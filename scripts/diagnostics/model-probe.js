import { randomUUID } from 'node:crypto'
import { grantOf } from '../../lib/quota/grant.js'

const PROVIDER = 'openai-codex'
const MODEL = 'gpt-6.2-sol'
const BASE = 'https://chatgpt.com/backend-api'
const ENDPOINT = `${BASE}/codex/responses`
const TOOL = 'diagnostic_echo'
const fail = code => { throw Object.assign(new Error(code), { code }) }
const SAFE = new Set(['PROBE_STOPPED', 'PROBE_TIMEOUT', 'PROBE_SIGNED_OUT', 'PROBE_TOKEN_STALE', 'PROBE_AUTH_MUTATION_BLOCKED', 'PROBE_ACCOUNT_CHANGED', 'PROBE_MODEL_UNAVAILABLE', 'PROBE_TARGET_BLOCKED', 'PROBE_REQUEST_LIMIT', 'PROBE_REDIRECT_BLOCKED', 'PROBE_HTTP', 'PROBE_TOOL_INVALID', 'PROBE_OUTPUT_LIMIT', 'PROBE_REPLY_INVALID', 'PROBE_FAILED', 'ACCOUNT_NOT_FOUND', 'ACCOUNT_SIGNED_OUT', 'ACCOUNT_BUSY', 'LOGIN_IN_PROGRESS', 'PLUGIN_STOPPED'])
const declaration = () => ({ name: TOOL, description: 'Return the literal OK locally. No filesystem, network or other effects.',
  parameters: { type: 'object', properties: { value: { type: 'string', const: 'OK' } }, required: ['value'], additionalProperties: false } })

/** One explicit transport experiment, not a catalog entry or model capability claim.
 * Native 6.1 supplies only verified transport metadata (including its existing
 * same-API Sol pricing, never fabricated zero prices). The conservative context
 * and 512 output cap are probe limits, NOT advertised GPT-6.2 capacities.
 * Nothing here registers a global provider, changes a selected model or refreshes OAuth.
 */
export function createModelProbe({ accounts, createModels, openaiCodexProvider, fetch: http = globalThis.fetch,
  now = Date.now, timeoutMs = 30000, singleRequest = false, setTimeout: startTimer = globalThis.setTimeout, clearTimeout: stopTimer = globalThis.clearTimeout }) {
  const spent = new Map(), controllers = new Set(), workers = new Set()
  let stopped = false
  const fresh = grant => grant && Number.isFinite(grant.expires) && grant.expires > now() + 360000
  const empty = () => ({ status: 'failed', error: null, httpStatus: null, model: MODEL, requestCount: 0,
    checkedAt: now(), durationMs: 0, toolCalled: false, toolResultAccepted: false, replyValidated: false })
  async function run(id) {
    const state = empty(), began = now(), controller = new AbortController(), pending = new Set()
    let lease, closed = false, guardError, timer, abortListener
    controllers.add(controller)
    const track = operation => {
      controller.signal.throwIfAborted()
      if (closed) fail('PROBE_STOPPED')
      let promise
      try { promise = Promise.resolve(operation()) } catch (error) { promise = Promise.reject(error) }
      pending.add(promise)
      void promise.then(() => pending.delete(promise), () => pending.delete(promise))
      return promise
    }
    const aborted = new Promise((_, reject) => {
      abortListener = () => reject(controller.signal.reason)
      controller.signal.addEventListener('abort', abortListener, { once: true })
    })
    timer = startTimer(() => controller.abort(Object.assign(new Error('PROBE_TIMEOUT'), { code: 'PROBE_TIMEOUT' })),
      Math.min(60000, Math.max(1, timeoutMs)))
    const work = (async () => {
      if (stopped) fail('PROBE_STOPPED')
      lease = await accounts.acquireAccount('model-probe-' + randomUUID(), id)
      controller.signal.throwIfAborted()
      const grant = grantOf(await track(() => accounts.recordStore(id).readRecord()))
      if (!grant) fail('PROBE_SIGNED_OUT')
      if (!fresh(grant)) fail('PROBE_TOKEN_STALE')
      const store = accounts.credentialStore(id)
      const credentials = {
        read: (provider, ...args) => track(async () => {
          if (provider !== PROVIDER) fail('PROBE_TARGET_BLOCKED')
          const value = await store.read(provider, ...args)
          controller.signal.throwIfAborted()
          if (value?.type !== 'oauth' || value.access !== grant.access || value.accountId !== grant.accountId) fail('PROBE_ACCOUNT_CHANGED')
          if (!fresh(value)) fail('PROBE_TOKEN_STALE')
          return value
        }),
        list: (...args) => track(() => store.list(...args)),
        // No refresh or credential mutation is authorized by this inference test.
        // Track even rejected operations and close all entry points before releasing.
        modify: () => track(() => fail('PROBE_AUTH_MUTATION_BLOCKED')),
        delete: () => track(() => fail('PROBE_AUTH_MUTATION_BLOCKED')),
      }
      const native = openaiCodexProvider()
      const originals = native.getModels()
      const base = originals.find(model => model.id === 'gpt-6.1-sol')
      if (native.id !== PROVIDER || base?.api !== 'openai-codex-responses' || base?.baseUrl !== BASE ||
        !Number.isFinite(base.contextWindow) || base.contextWindow < 1 || !base.cost || !(base.cost.input > 0) || !(base.cost.output > 0)) fail('PROBE_MODEL_UNAVAILABLE')
      const experiment = Object.freeze({ ...base, id: MODEL, name: 'GPT-6.2 Sol (transport probe only)', baseUrl: BASE,
        input: Object.freeze(['text']), contextWindow: Math.min(base.contextWindow, 32768), maxTokens: 512,
        cost: Object.freeze(structuredClone(base.cost)) })
      // Models.getModel searches provider.getModels; passing a renamed alias alone
      // is insufficient. This immutable override lives only in this local Models instance.
      const localModels = Object.freeze([...originals.filter(model => model.id !== MODEL), experiment])
      const provider = Object.freeze({ ...native, baseUrl: BASE, getModels: () => localModels, getAllModels: () => localModels })
      const models = createModels({ credentials, authContext: { env: async () => undefined, fileExists: async () => false } })
      models.setProvider(provider)
      const model = models.getModel(PROVIDER, MODEL)
      if (model !== experiment) fail('PROBE_MODEL_UNAVAILABLE')
      const messages = [{ role: 'user', content: 'Call diagnostic_echo exactly once with {"value":"OK"}. After its result, reply with exactly OK and nothing else.', timestamp: now() }]
      async function turn(second) {
        controller.signal.throwIfAborted()
        if (!fresh(grant)) fail('PROBE_TOKEN_STALE')
        let done, outputCharacters = 0, dispatched = false
        const stream = models.stream(model, {
          systemPrompt: 'This is a minimal tool transport test. Only diagnostic_echo is allowed. Never request other tools. Final answer must be exactly OK.',
          tools: [declaration()], messages,
        }, { signal: controller.signal, transport: 'sse', maxRetries: 0, timeoutMs: Math.min(60000, Math.max(1, timeoutMs)),
          // Use exactly the native payload, including its default auto summary
          // and tool selection. No diagnostic-only wire parameters are injected.
          maxTokens: 512, reasoningEffort: 'low', cacheRetention: 'none',
          async fetch(input, init) {
            controller.signal.throwIfAborted()
            if (!fresh(grant)) fail('PROBE_TOKEN_STALE')
            const target = typeof input === 'string' || input instanceof URL ? String(input) : input?.url
            const method = init?.method ?? (input instanceof Request ? input.method : 'GET')
            if (target !== ENDPOINT || method.toUpperCase() !== 'POST') { guardError = 'PROBE_TARGET_BLOCKED'; fail(guardError) }
            if (dispatched || state.requestCount >= (singleRequest ? 1 : 2)) { guardError = 'PROBE_REQUEST_LIMIT'; fail(guardError) }
            dispatched = true
            state.requestCount++
            const response = await http(input, { ...init, signal: controller.signal, redirect: 'error', credentials: 'omit' })
            if (Number.isInteger(response.status) && response.status >= 100 && response.status <= 599) state.httpStatus = response.status
            if (response.redirected || (response.status >= 300 && response.status < 400)) guardError = 'PROBE_REDIRECT_BLOCKED'
            else if (!response.ok) guardError = 'PROBE_HTTP'
            if (guardError) {
              // Keep only recognized schema diagnostics, never raw backend text.
              if (guardError === 'PROBE_HTTP' && response.body?.getReader) {
                const reader = response.body.getReader()
                const cancel = () => { void reader.cancel().catch(() => {}) }
                controller.signal.addEventListener('abort', cancel, { once: true })
                try {
                  let raw = '', bytes = 0
                  const decoder = new TextDecoder()
                  while (bytes < 8192) {
                    controller.signal.throwIfAborted()
                    const part = await reader.read()
                    if (part.done) break
                    bytes += part.value.byteLength
                    if (bytes <= 8192) raw += decoder.decode(part.value, { stream: true })
                  }
                  const detail = JSON.parse(raw)?.error
                  const known = ['reasoning.summary', 'reasoning.effort', 'tool_choice', 'tools', 'model', 'include', 'instructions', 'max_output_tokens']
                  state.errorField = known.find(field => detail?.param === field || (typeof detail?.message === 'string' && detail.message.includes(field))) ?? null
                } catch {} finally {
                  controller.signal.removeEventListener('abort', cancel)
                  try { await reader.cancel() } catch {}
                }
              } else { try { await response.body?.cancel() } catch {} }
              fail(guardError)
            }
            return response
          },
        })
        for await (const event of stream) {
          controller.signal.throwIfAborted()
          if (typeof event.delta === 'string') {
            outputCharacters += event.delta.length
            if (outputCharacters > 4096) {
              const error = Object.assign(new Error('PROBE_OUTPUT_LIMIT'), { code: 'PROBE_OUTPUT_LIMIT' })
              controller.abort(error)
              throw error
            }
          }
          if (event.type === 'error') fail(guardError ?? 'PROBE_FAILED')
          if (event.type === 'done') {
            if (done || ['error', 'aborted', 'length', 'pending'].includes(event.message?.stopReason)) fail(guardError ?? 'PROBE_FAILED')
            done = event.message
          }
        }
        controller.signal.throwIfAborted()
        if (guardError) fail(guardError)
        if (done?.role !== 'assistant' || done.model !== MODEL || done.provider !== PROVIDER || !Array.isArray(done.content)) fail('PROBE_FAILED')
        return done
      }
      const first = await turn(false)
      const calls = first.content.filter(block => block.type === 'toolCall')
      state.toolCalled = calls.length > 0
      const call = calls[0]
      if (calls.length !== 1 || call.name !== TOOL || typeof call.id !== 'string' || !/^[a-zA-Z0-9_|-]{1,512}$/.test(call.id) ||
        !call.arguments || Array.isArray(call.arguments) || Object.keys(call.arguments).length !== 1 || call.arguments.value !== 'OK') fail('PROBE_TOOL_INVALID')
      if (singleRequest) return // Only the one remaining paid dispatch of the original test budget.
      // Literal in-process response only. Never evaluate arguments or dispatch agent tools.
      messages.push(first, { role: 'toolResult', toolCallId: call.id, toolName: TOOL,
        content: [{ type: 'text', text: 'OK' }], isError: false, timestamp: now() })
      const final = await turn(true)
      if (final.content.some(block => block.type === 'toolCall')) fail('PROBE_TOOL_INVALID')
      state.toolResultAccepted = true
      const text = final.content.filter(block => block.type === 'text').map(block => typeof block.text === 'string' && block.text.length <= 64 ? block.text : '').join('')
      if (text.trim() !== 'OK') fail('PROBE_REPLY_INVALID')
      state.replyValidated = true
    })()
    // Native lazy auth can return on abort before its credential reads settle.
    // Draining is independent of the prompt response and retains the shared lease.
    const quiescence = work.catch(() => {}).then(async () => {
      closed = true
      while (pending.size) await Promise.allSettled([...pending])
      await lease?.release()
    })
    workers.add(quiescence)
    void quiescence.then(() => workers.delete(quiescence), () => workers.delete(quiescence))
    try {
      await Promise.race([work, aborted])
      state.status = singleRequest ? 'partial' : 'passed'
    } catch (error) {
      const code = stopped ? 'PROBE_STOPPED' : controller.signal.aborted ? controller.signal.reason?.code : guardError ?? error?.code
      state.error = SAFE.has(code) ? code : 'PROBE_FAILED'
      state.status = state.requestCount > 0 && ['PROBE_TIMEOUT', 'PROBE_STOPPED', 'PROBE_FAILED'].includes(state.error) ? 'unknown' : 'failed'
    } finally {
      stopTimer(timer)
      controller.signal.removeEventListener('abort', abortListener)
      controllers.delete(controller)
      controller.abort()
      state.checkedAt = now()
      state.durationMs = Math.max(0, now() - began)
    }
    return Object.freeze({ ...state })
  }
  return {
    probe(accountId) {
      // Burn synchronously before acquisition/dispatch. Cache successes, errors and
      // unknown outcomes alike; this instance NEVER retries a selected account.
      if (spent.has(accountId)) return spent.get(accountId).then(result => ({ ...result }))
      if (stopped) return Promise.resolve({ ...empty(), error: 'PROBE_STOPPED' })
      const promise = run(accountId)
      spent.set(accountId, promise)
      return promise.then(result => ({ ...result }))
    },
    async dispose() {
      stopped = true
      for (const controller of controllers) controller.abort(Object.assign(new Error('PROBE_STOPPED'), { code: 'PROBE_STOPPED' }))
      await Promise.allSettled([...spent.values()])
      await Promise.allSettled([...workers])
    },
  }
}
