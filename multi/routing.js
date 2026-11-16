export const SESSION_PROVIDER = 'chatgpt-session'
const NATIVE_PROVIDER = 'openai-codex'
export const MODEL_IDS = Object.freeze([
  'gpt-6-astra', 'gpt-6.1-sol', 'gpt-6-sol', 'gpt-6-luna',
  'gpt-5.6-sol', 'gpt-5.6-terra', 'gpt-5.6-luna',
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

/** Immutable common catalog: account identity affects authentication, never model capabilities. */
export function commonProfiles(nativeProvider, resolveRetryPolicy) {
  const catalog = nativeProvider.getModels()
  const models = Object.freeze(MODEL_IDS.map(id => {
    const found = catalog.find(model => model.id === id)
    if (!found) throw failure('UNKNOWN_MODEL', `Bundled Codex catalog lacks required model ${id}`)
    return Object.freeze({
      ...found,
      thinkingLevelMap: Object.freeze({ off: null, minimal: null, low: 'low', medium: 'medium', high: 'high', xhigh: 'xhigh', max: null }),
    })
  }))
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

/** Dependency injection keeps routing/lease behavior testable without importing the Host runtime. */
export function createRoutingAdapter({ LlmAdapter, metadataAdapter, makeAccountAdapter }, accounts) {
  const delegates = new Map()
  const delegateFor = id => {
    if (typeof id !== 'string' || !id) throw failure('SESSION_ACCOUNT_REQUIRED', 'Select a ChatGPT account for this session')
    if (!delegates.has(id)) delegates.set(id, makeAccountAdapter(accounts.credentialStore(id)))
    return delegates.get(id)
  }
  return new class extends LlmAdapter {
    providerInfo() { return { id: SESSION_PROVIDER, name: 'ChatGPT (session account)' } }
    providerRetryPolicy() { return metadataAdapter.providerRetryPolicy(NATIVE_PROVIDER) }
    imageRequestTarget(_provider, model, image) { return metadataAdapter.imageRequestTarget(NATIVE_PROVIDER, model, image) }
    async listModels() {
      return (await metadataAdapter.listModels(NATIVE_PROVIDER)).map(model => ({ ...model, provider: SESSION_PROVIDER }))
    }
    async resolveModel(_provider, model, signal) {
      return { ...await metadataAdapter.resolveModel(NATIVE_PROVIDER, model, signal), provider: SESSION_PROVIDER }
    }
    async prepareCall(_provider, model, signal) {
      const prepared = await metadataAdapter.prepareCall(NATIVE_PROVIDER, model, signal)
      return { model: { ...prepared.model, provider: SESSION_PROVIDER }, stream: options => this.stream(options) }
    }
    async *stream(options) {
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
        const adapter = delegateFor(lease.accountId)
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
export async function installRouting(ctx, accounts) {
  const [{ LlmAdapter, resolveRetryPolicy, resolveImageAttachmentAccess }, { PiAiAdapter }, { openaiCodexProvider }] = await Promise.all([
    ctx.loader.import('@deepseek-ai/dsh-llm'),
    ctx.loader.import('@deepseek-ai/dsh-llm-pi-ai'),
    ctx.loader.import('@earendil-works/pi-ai/providers/openai-codex'),
  ])
  const profiles = commonProfiles(openaiCodexProvider(), resolveRetryPolicy)
  // Never discover another account's ambient environment credentials.
  const authContext = { env: async () => undefined, fileExists: async () => false }
  const makeAccountAdapter = credentials => new PiAiAdapter({
    profiles: () => profiles,
    resolveApiKey: async () => undefined,
    auth: { credentials, authContext },
    resolveAttachments: () => ctx.get('attachments'),
    resolveImageAccess: (attachments, ref) => resolveImageAttachmentAccess(
      attachments, path => ctx.get('fs')?.processPathFromHostPath(path), ref,
    ),
  })
  const metadataAdapter = makeAccountAdapter({
    read: async () => undefined, list: async () => [],
    modify: async () => { throw failure('NO_CREDENTIAL_STORE', 'Catalog does not authenticate') },
    delete: async () => { throw failure('NO_CREDENTIAL_STORE', 'Catalog does not authenticate') },
  })
  const adapter = createRoutingAdapter({ LlmAdapter, metadataAdapter, makeAccountAdapter }, accounts)
  return ctx.llm.registerAdapter([SESSION_PROVIDER], adapter)
}
