export const SESSION_PROVIDER = 'chatgpt-session'
const NATIVE_PROVIDER = 'openai-codex'
// Historical compatibility export only; never used to validate or restrict routing.
export const MODEL_IDS = Object.freeze([
  'gpt-6-astra', 'gpt-6.1-sol', 'gpt-6-sol', 'gpt-6-luna',
  'gpt-5.6-sol', 'gpt-5.6-terra', 'gpt-5.6-luna',
  'gpt-5.5', 'gpt-5.3-codex-spark',
])

function failure(code, message) {
  return Object.assign(new Error(message), { code })
}

// These are adapter-local transport copies, never edits to the durable request.
function nativeRequest(options, accountId) {
  return {
    ...options,
    provider: NATIVE_PROVIDER,
    messages: options.messages.map(message => message.role === 'assistant'
      && (message.source?.provider === SESSION_PROVIDER || message.source?.provider === NATIVE_PROVIDER)
      ? (() => {
          const { replayState, ...source } = message.source
          const tagged = replayState?.response
          return { ...message, source: {
            ...source, provider: NATIVE_PROVIDER,
            ...(tagged?.gptLinkAccount === accountId && tagged?.format === 'dsh-gpt-link/account-v1'
              ? { replayState: { ...replayState, response: tagged.nativeResponse } } : {}),
          } }
        })()
      : message),
  }
}

// Copy before freezing: native providers and other snapshots retain ownership.
function immutable(value) {
  if (Array.isArray(value)) return Object.freeze(value.map(immutable))
  if (value && typeof value === 'object') return Object.freeze(Object.fromEntries(Object.entries(value).map(([key, item]) => [key, immutable(item)])))
  return value
}

/** Safe schema union, not an account entitlement list. Invalid records are independent. */
export function commonProfiles(nativeProvider, resolveRetryPolicy, definitions = nativeProvider.getModels()) {
  const seen = new Set()
  const models = Object.freeze(definitions.filter(model => {
    if (!model || typeof model.id !== 'string' || !model.id.trim() || seen.has(model.id)
      || model.provider !== NATIVE_PROVIDER || typeof model.api !== 'string'
      || !Array.isArray(model.input) || !model.input.length
      || !Number.isFinite(model.contextWindow) || model.contextWindow <= 0
      || !Number.isFinite(model.maxTokens) || model.maxTokens <= 0
      || typeof model.reasoning !== 'boolean' || !model.cost) return false
    seen.add(model.id)
    return true
  }).map(immutable))
  const provider = Object.freeze({
    ...nativeProvider,
    getModels: () => models,
    stream: (...args) => nativeProvider.stream(...args),
    streamSimple: (...args) => nativeProvider.streamSimple(...args),
  })
  return new Map([[NATIVE_PROVIDER, Object.freeze({
    provider: NATIVE_PROVIDER,
    displayName: 'ChatGPT (session account)',
    piProvider: provider,
    reasoning: 'low',
    streamIdleTimeoutMs: 120000,
    maxRequestImageBytes: 20971520,
    maxRequestImages: 50,
    imageOffloadCountQuantum: 10,
    requestImagePixelBudget: 4194304,
    requestImageMaxBytes: 1048576,
    retryPolicy: resolveRetryPolicy(undefined),
    modelErrors: new Map(),
    configuredMaxTokens: new Map(),
  })]])
}

const EFFORTS = ['off', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max']
function supportsEffort(model, effort) {
  const mapped = model.thinkingLevelMap?.[effort]
  return EFFORTS.includes(effort) && (model.reasoning
    ? mapped !== null && (!['xhigh', 'max'].includes(effort) || mapped !== undefined)
    : effort === 'off')
}

// A prepared snapshot freezes transport metadata, not an entitlement. Fresh account
// capabilities can only narrow it; never replace its cost/compat/wire mappings.
function restrictPrepared(captured, available) {
  if (!captured) return available
  if (!available) return captured
  if (captured.id !== available.id || captured.api !== available.api || captured.provider !== available.provider) {
    throw failure('MODEL_UNAVAILABLE', 'Prepared transport is no longer compatible')
  }
  const input = captured.input.filter(modality => available.input.includes(modality))
  if (!input.length) throw failure('MODEL_UNAVAILABLE', 'Prepared input capabilities are no longer available')
  return immutable({
    ...captured,
    input,
    contextWindow: Math.min(captured.contextWindow, available.contextWindow),
    maxTokens: Math.min(captured.maxTokens, available.maxTokens),
    reasoning: captured.reasoning && available.reasoning,
    thinkingLevelMap: Object.fromEntries(EFFORTS.map(effort => [effort,
      supportsEffort(captured, effort) && supportsEffort(available, effort)
        ? captured.thinkingLevelMap?.[effort] : null,
    ])),
  })
}

/** Dependency injection keeps routing/lease behavior testable without importing the Host runtime. */
export function createRoutingAdapter({ LlmAdapter, metadataAdapter, makeAccountAdapter, catalog }, accounts) {
  const metadata = () => typeof metadataAdapter === 'function' ? metadataAdapter() : metadataAdapter
  // Definition identity is safe even when two account views have the same version.
  const delegates = new Map()
  const delegateFor = (id, definition) => {
    if (typeof id !== 'string' || !id) throw failure('SESSION_ACCOUNT_REQUIRED', 'Select a ChatGPT account for this session')
    let cached = delegates.get(id)
    if (!cached || cached.definition !== definition) {
      cached = { definition, adapter: makeAccountAdapter(accounts.credentialStore(id), definition) }
      delegates.set(id, cached)
    }
    // In-flight generators retain their own adapter even after the cache advances.
    return cached.adapter
  }
  return new class extends LlmAdapter {
    providerInfo() { return { id: SESSION_PROVIDER, name: 'ChatGPT (session account)' } }
    providerRetryPolicy() { return metadata().providerRetryPolicy(NATIVE_PROVIDER) }
    imageRequestTarget(_provider, model, image) { return metadata().imageRequestTarget(NATIVE_PROVIDER, model, image) }
    async listModels() {
      return (await metadata().listModels(NATIVE_PROVIDER)).map(model => ({ ...model, provider: SESSION_PROVIDER }))
    }
    async resolveModel(_provider, model, signal) {
      return { ...await metadata().resolveModel(NATIVE_PROVIDER, model, signal), provider: SESSION_PROVIDER }
    }
    async prepareCall(_provider, model, signal) {
      const definition = catalog?.knownModels().find(item => item.id === model)
      const prepared = await metadata().prepareCall(NATIVE_PROVIDER, model, signal)
      return { model: { ...prepared.model, provider: SESSION_PROVIDER }, stream: options => {
        if (options.model !== model) throw failure('UNKNOWN_MODEL', 'Prepared model does not match dispatch')
        return this.stream(options, definition)
      } }
    }
    async *stream(options, capturedDefinition) {
      if (options.provider !== SESSION_PROVIDER) throw failure('NO_ADAPTER', 'Unexpected ChatGPT provider route')
      if (typeof options.sessionId !== 'string' || !options.sessionId) {
        throw failure('SESSION_ACCOUNT_REQUIRED', 'A session is required to select a ChatGPT account')
      }
      options.signal?.throwIfAborted()
      // Acquire exactly once. A lease prevents rebind/removal until this iterator settles.
      const lease = accounts.acquireSession
        ? await accounts.acquireSession(options.sessionId)
        : { accountId: await accounts.resolveSession(options.sessionId), release() {} }
      try {
        options.signal?.throwIfAborted()
        const available = catalog && await catalog.available(lease.accountId, options.model, { signal: options.signal })
        if (catalog && (!available || available.id !== options.model)) throw failure('MODEL_UNAVAILABLE', 'Model is unavailable for this account')
        const definition = restrictPrepared(capturedDefinition, available)
        if (options.reasoningEffort !== undefined && [capturedDefinition, available, definition]
          .some(model => model && !supportsEffort(model, options.reasoningEffort))) {
          throw failure('UNSUPPORTED_REASONING_EFFORT', 'Reasoning effort is unsupported by this model')
        }
        options.signal?.throwIfAborted()
        const adapter = delegateFor(lease.accountId, definition)
        const prepared = await adapter.prepareCall(NATIVE_PROVIDER, options.model, options.signal)
        options.signal?.throwIfAborted()
        const replayIdentity = lease.replayIdentity ?? lease.accountId
        for await (const chunk of prepared.stream(nativeRequest(options, replayIdentity))) {
          // Native response IDs/signatures can be account-bound. Preserve replay only
          // when the next dispatch authenticates as the same explicitly bound account.
          yield chunk.type === 'finish' && chunk.replayState
            ? { ...chunk, replayState: { ...chunk.replayState, response: {
                format: 'dsh-gpt-link/account-v1', gptLinkAccount: replayIdentity,
                nativeResponse: chunk.replayState.response,
              } } }
            : chunk
        }
      } finally {
        await lease.release()
      }
    }
  }()
}

/** Install a separate route; the existing openai-codex adapter and its grant remain untouched. */
export async function installRouting(ctx, accounts, catalog) {
  const [{ LlmAdapter, resolveRetryPolicy, resolveImageAttachmentAccess }, { PiAiAdapter }, { openaiCodexProvider }] = await Promise.all([
    ctx.loader.import('@deepseek-ai/dsh-llm'),
    ctx.loader.import('@deepseek-ai/dsh-llm-pi-ai'),
    ctx.loader.import('@earendil-works/pi-ai/providers/openai-codex'),
  ])
  const nativeProvider = openaiCodexProvider()
  const profiles = commonProfiles(nativeProvider, resolveRetryPolicy)
  // Never discover another account's ambient environment credentials.
  const authContext = { env: async () => undefined, fileExists: async () => false }
  const makeAccountAdapter = (credentials, definition, snapshotProfiles = definition
    ? commonProfiles(nativeProvider, resolveRetryPolicy, [
        ...(catalog?.knownModels() ?? nativeProvider.getModels()).filter(model => model.id !== definition.id), definition,
      ]) : profiles) => new PiAiAdapter({
    profiles: () => snapshotProfiles,
    resolveApiKey: async () => undefined,
    auth: { credentials, authContext },
    resolveAttachments: () => ctx.get('attachments'),
    resolveImageAccess: (attachments, ref) => resolveImageAttachmentAccess(
      attachments, path => ctx.get('fs')?.processPathFromHostPath(path), ref,
    ),
  })
  const metadataCredentials = {
    read: async () => undefined, list: async () => [],
    modify: async () => { throw failure('NO_CREDENTIAL_STORE', 'Catalog does not authenticate') },
    delete: async () => { throw failure('NO_CREDENTIAL_STORE', 'Catalog does not authenticate') },
  }
  let previousModels, currentMetadata
  const metadataAdapter = () => {
    const models = catalog?.knownModels() ?? nativeProvider.getModels()
    // Compare identities too: version counters may restart for a different account view.
    if (!previousModels || previousModels.length !== models.length || models.some((model, i) => model !== previousModels[i])) {
      previousModels = [...models]
      currentMetadata = makeAccountAdapter(metadataCredentials, undefined, commonProfiles(nativeProvider, resolveRetryPolicy, models))
    }
    return currentMetadata
  }
  const adapter = createRoutingAdapter({ LlmAdapter, metadataAdapter, makeAccountAdapter, catalog }, accounts)
  return ctx.llm.registerAdapter([SESSION_PROVIDER], adapter)
}
