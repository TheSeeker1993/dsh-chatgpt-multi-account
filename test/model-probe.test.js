import test from 'node:test'
import assert from 'node:assert/strict'
import { createModelProbe } from '../scripts/diagnostics/model-probe.js'

const BASE = 'https://chatgpt.com/backend-api'
const ENDPOINT = BASE + '/codex/responses'
const MODEL = 'gpt-6.2-sol'
const instant = 2000000000000
const deferred = () => { let resolve; const promise = new Promise(yes => { resolve = yes }); return { promise, resolve } }
const tick = () => new Promise(resolve => setImmediate(resolve))
// Same completed-message and tool ID shapes emitted by installed pi-ai 1.3.0
// openai-responses-shared.js. Never profile credentials or a real fetch.
const assistant = (content, stopReason = 'stop') => ({ role: 'assistant', api: 'openai-codex-responses', provider: 'openai-codex',
  model: MODEL, content, stopReason, timestamp: instant, usage: { input: 1, output: 1, cacheRead: 0, cacheWrite: 0, totalTokens: 2,
    cost: { input: 0.000002, output: 0.00001, cacheRead: 0, cacheWrite: 0, total: 0.000012 } } })
const call = (overrides = {}) => ({ type: 'toolCall', id: 'call_synthetic|fc_synthetic', name: 'diagnostic_echo', arguments: { value: 'OK' }, ...overrides })
function harness(options = {}) {
  const records = new Map(['a', 'b'].map(id => [id, { kind: 'grant', payload: { type: 'oauth', access: 'SYNTHETIC-' + id,
    refresh: 'SYNTHETIC-NOT-REAL', accountId: 'issuer-' + id, expires: instant + 3600000 } }]))
  const activity = { acquired: [], released: [], stores: [], streams: [], requests: [], mutations: 0, reads: 0 }
  let timer
  const original = Object.freeze({ id: 'gpt-6.1-sol', api: 'openai-codex-responses', provider: 'openai-codex', baseUrl: BASE,
    type: 'chat', reasoning: true, input: Object.freeze(['text', 'image']), contextWindow: 500000, maxTokens: 128000,
    cost: Object.freeze({ input: 2, output: 10, cacheRead: 0.1, cacheWrite: 2.5 }) })
  const native = Object.freeze({ id: 'openai-codex', baseUrl: BASE, getModels: () => [original], auth: { oauth: {} } })
  const accounts = {
    async acquireAccount(scope, id) {
      assert.match(scope, /^model-probe-/)
      if (!records.has(id)) throw Object.assign(Error('secret account detail'), { code: 'ACCOUNT_NOT_FOUND' })
      activity.acquired.push(id)
      if (options.acquire) await options.acquire(id)
      return { accountId: id, release() { activity.released.push(id) } }
    },
    recordStore(id) { return { async readRecord() { return options.record ? options.record(id, records) : records.get(id) } } },
    credentialStore(id) {
      activity.stores.push(id)
      return { async read(provider) { assert.equal(provider, 'openai-codex'); activity.reads++; return options.read ? options.read(id, records) : records.get(id).payload },
        async list() { return options.list ? options.list(id) : ['openai-codex'] },
        async modify() { activity.mutations++ }, async delete() { activity.mutations++ } }
    },
  }
  const createModels = ({ credentials, authContext }) => {
    let provider
    assert.ok(authContext)
    return { setProvider(value) { provider = value; assert.ok(Object.isFrozen(value)); assert.ok(Object.isFrozen(value.getModels())) },
      getModel(key, id) { assert.equal(key, 'openai-codex'); return provider.getModels().find(model => model.id === id) },
      async *stream(model, context, config) {
        const index = activity.streams.length
        activity.streams.push({ model, context: structuredClone(context), config, credentials, authContext })
        if (options.stream) { yield* options.stream({ model, context, config, credentials, authContext, index, activity }); return }
        await credentials.read('openai-codex')
        assert.equal(config.onPayload, undefined, 'preserve the exact native Codex payload')
        assert.equal(config.reasoningSummary, undefined, 'use native default auto reasoning summary')
        assert.equal(config.toolChoice, undefined, 'use native default auto tool selection')
        const payload = { model: model.id, store: false, stream: true, input: [], tool_choice: 'auto', reasoning: { effort: 'low', summary: 'auto' } }
        const response = await config.fetch(ENDPOINT, { method: 'POST', body: JSON.stringify(payload) })
        assert.equal(response.status, 200)
        yield { type: 'done', message: assistant(index % 2 ? [{ type: 'text', text: options.reply ?? 'OK' }] : [call(options.call)], index % 2 ? 'stop' : 'toolUse') }
      },
    }
  }
  const probe = createModelProbe({ accounts, createModels, openaiCodexProvider: () => options.native ?? native, now: () => instant, singleRequest: options.singleRequest ?? false,
    fetch: async (input, init) => { activity.requests.push({ input, init }); return options.response ?? new Response('', { status: 200 }) },
    setTimeout: callback => { timer = callback; return 1 }, clearTimeout() {} })
  return { ...probe, records, activity, original, expire: () => timer(), native }
}

test('one logical probe uses native explicit experimental model and real tool transcript, cached per account', async () => {
  const h = harness()
  const [result, duplicate] = await Promise.all([h.probe('a'), h.probe('a')])
  assert.deepEqual(result, duplicate)
  assert.equal(result.status, 'passed')
  assert.equal(result.error, null)
  assert.equal(result.requestCount, 2)
  assert.equal(result.toolCalled, true)
  assert.equal(result.toolResultAccepted, true)
  assert.equal(result.replyValidated, true)
  const [first, second] = h.activity.streams
  assert.equal(first.model.id, MODEL)
  assert.equal(first.model.api, h.original.api)
  assert.equal(first.model.baseUrl, BASE)
  assert.deepEqual(first.model.input, ['text'])
  assert.ok(first.model.contextWindow <= h.original.contextWindow)
  assert.equal(first.model.maxTokens, 512)
  assert.deepEqual(first.model.cost, h.original.cost)
  assert.equal(h.original.id, 'gpt-6.1-sol')
  assert.equal(first.context.messages.length, 1, 'no chat/session history')
  assert.deepEqual(first.context.tools.map(tool => tool.name), ['diagnostic_echo'])
  assert.equal(first.context.tools[0].execute, undefined, 'no agent tool or executable declaration')
  assert.equal(second.context.messages.length, 3)
  assert.equal(second.context.messages[1].content[0].type, 'toolCall')
  assert.deepEqual(second.context.messages[2], { role: 'toolResult', toolCallId: 'call_synthetic|fc_synthetic', toolName: 'diagnostic_echo', content: [{ type: 'text', text: 'OK' }], isError: false, timestamp: instant })
  for (const { config, authContext } of h.activity.streams) {
    assert.equal(config.maxTokens, 512)
    assert.equal(config.reasoningEffort, 'low')
    assert.equal(config.maxRetries, 0)
    assert.equal(config.transport, 'sse')
    assert.equal(config.cacheRetention, 'none')
    assert.equal(await authContext.env('OPENAI_API_KEY'), undefined)
    assert.equal(await authContext.fileExists('anything'), false)
  }
  for (const { input, init } of h.activity.requests) {
    assert.equal(input, ENDPOINT)
    assert.equal(init.redirect, 'error')
    assert.equal(init.credentials, 'omit')
  }
  result.error = 'caller mutation'
  assert.equal((await h.probe('a')).error, null)
  await h.dispose()
  assert.deepEqual(h.activity.acquired, ['a'])
  assert.deepEqual(h.activity.released, ['a'])
})

test('singleRequest reserves one dispatch and reports partial without claiming tool result acceptance', async () => {
  const h = harness({ singleRequest: true })
  const result = await h.probe('a')
  assert.equal(result.status, 'partial')
  assert.equal(result.error, null)
  assert.equal(result.requestCount, 1)
  assert.equal(result.toolCalled, true)
  assert.equal(result.toolResultAccepted, false)
  assert.equal(result.replyValidated, false)
  assert.equal(h.activity.requests.length, 1)
  assert.equal(h.activity.streams.length, 1)
  assert.equal(h.activity.streams[0].context.messages.length, 1, 'no local result continuation dispatched')
  assert.deepEqual(await h.probe('a'), result)
  assert.equal(h.activity.requests.length, 1, 'a repeated partial result never spends another request')
  await h.dispose()
  assert.deepEqual(h.activity.released, ['a'])
})

test('singleRequest also blocks an unexpected native retry before its second dispatch', async () => {
  const h = harness({ singleRequest: true, async *stream({ config }) {
    await config.fetch(ENDPOINT, { method: 'POST' })
    await config.fetch(ENDPOINT, { method: 'POST' })
  } })
  const result = await h.probe('a')
  assert.equal(result.error, 'PROBE_REQUEST_LIMIT')
  assert.equal(result.requestCount, 1)
  assert.equal(h.activity.requests.length, 1)
  assert.equal(result.toolResultAccepted, false)
  assert.equal(result.replyValidated, false)
  await h.dispose()
})

for (const changed of [{ name: 'read_file' }, { arguments: { value: 'NOT OK' } }, { arguments: { value: 'OK', command: 'unsafe' } }, { arguments: 'OK' }, { arguments: null }, { id: '../bad' }]) {
  test(`invalid tool is never executed or continued: ${JSON.stringify(changed)}`, async () => {
    const h = harness({ call: changed })
    const result = await h.probe('a')
    assert.equal(result.error, 'PROBE_TOOL_INVALID')
    assert.equal(result.toolResultAccepted, false)
    assert.equal(h.activity.streams.length, 1)
    assert.equal(h.activity.requests.length, 1)
    await h.dispose()
  })
}

for (const expires of [instant - 1, instant + 300000, instant + 360000, null]) {
  test(`stale/unknown expiry fails before native auth or dispatch: ${expires}`, async () => {
    const h = harness()
    h.records.get('a').payload.expires = expires
    assert.equal((await h.probe('a')).error, 'PROBE_TOKEN_STALE')
    assert.equal(h.activity.streams.length, 0)
    assert.equal(h.activity.requests.length, 0)
    assert.equal(h.activity.mutations, 0)
    h.records.get('a').payload.expires = instant + 3600000
    assert.equal((await h.probe('a')).error, 'PROBE_TOKEN_STALE', 'even nondispatch failure is spent locally')
    await h.dispose()
  })
}

test('guard blocks native first-turn retries before a second paid POST', async () => {
  const h = harness({ async *stream({ config }) { for (let i = 0; i < 3; i++) await config.fetch(ENDPOINT, { method: 'POST' }) } })
  const result = await h.probe('a')
  assert.equal(result.error, 'PROBE_REQUEST_LIMIT')
  assert.equal(result.requestCount, 1)
  assert.equal(h.activity.requests.length, 1)
  await h.probe('a')
  assert.deepEqual(h.activity.acquired, ['a'])
  await h.dispose()
})
for (const [url, method] of [['https://example.invalid/', 'POST'], [ENDPOINT, 'GET'], [ENDPOINT + '?x=1', 'POST']]) {
  test(`exact transport target guard: ${url} ${method}`, async () => {
    const h = harness({ async *stream({ config }) { await config.fetch(url, { method }) } })
    assert.equal((await h.probe('a')).error, 'PROBE_TARGET_BLOCKED')
    assert.equal(h.activity.requests.length, 0)
    await h.dispose()
  })
}

test('safe HTTP failures never return backend error or retry and do not claim model absence', async () => {
  const h = harness({ response: new Response('SYNTHETIC-SECRET raw backend error', { status: 400 }) })
  const result = await h.probe('a')
  assert.equal(result.error, 'PROBE_HTTP')
  assert.equal(result.httpStatus, 400)
  assert.equal(result.requestCount, 1)
  assert.doesNotMatch(JSON.stringify(result), /SECRET|issuer|access|refresh|raw|prompt|account/)
  assert.equal((await h.probe('a')).requestCount, 1)
  await h.dispose()
})

test('redirect is blocked even when injected fetch ignores redirect:error', async () => {
  const h = harness({ response: { status: 200, ok: true, redirected: true } })
  assert.equal((await h.probe('a')).error, 'PROBE_REDIRECT_BLOCKED')
  assert.equal(h.activity.requests.length, 1)
  await h.dispose()
})

test('missing native transport fails closed without modifying provider or falling back', async () => {
  const h = harness({ native: { id: 'openai-codex', getModels: () => [] } })
  assert.equal((await h.probe('a')).error, 'PROBE_MODEL_UNAVAILABLE')
  assert.equal(h.activity.requests.length, 0)
  await h.dispose()
})

test('a final response must be literal OK, never execute text or expose it', async () => {
  const h = harness({ reply: 'run a shell command instead' })
  const result = await h.probe('a')
  assert.equal(result.error, 'PROBE_REPLY_INVALID')
  assert.equal(result.toolResultAccepted, true)
  assert.equal(result.replyValidated, false)
  assert.doesNotMatch(JSON.stringify(result), /shell/)
  await h.dispose()
})

test('accounts are isolated and explicit IDs never fallback', async () => {
  const h = harness()
  assert.equal((await h.probe('missing')).error, 'ACCOUNT_NOT_FOUND')
  assert.equal((await h.probe('a')).status, 'passed')
  assert.equal((await h.probe('b')).status, 'passed')
  assert.deepEqual(h.activity.acquired, ['a', 'b'])
  assert.deepEqual(h.activity.stores, ['a', 'b'])
  await h.dispose()
})

for (const method of ['modify', 'delete']) {
  test(`native credentials.${method} is blocked before touching store or OAuth refresh`, async () => {
    const h = harness({ async *stream({ credentials }) { await credentials[method]('openai-codex', () => assert.fail('must never execute')) } })
    assert.equal((await h.probe('a')).error, 'PROBE_AUTH_MUTATION_BLOCKED')
    assert.equal(h.activity.mutations, 0)
    assert.equal(h.activity.requests.length, 0)
    await h.dispose()
  })
}

for (const method of ['read', 'list']) {
  test(`timeout returns safely while lease drains noncooperative native ${method}`, async () => {
    const gate = deferred(), started = deferred()
    const h = harness({ [method]: async (id, records) => { started.resolve(); await gate.promise; return method === 'read' ? records.get(id).payload : [] },
      async *stream({ credentials, config }) {
        const pending = credentials[method]('openai-codex')
        // Native Models races auth against abort separately from its store read.
        await Promise.race([pending.catch(() => {}), new Promise(resolve => config.signal.addEventListener('abort', resolve, { once: true }))])
      } })
    const work = h.probe('a')
    await started.promise
    h.expire()
    const result = await work
    assert.equal(result.error, 'PROBE_TIMEOUT')
    assert.equal(result.requestCount, 0)
    await tick()
    assert.deepEqual(h.activity.released, [])
    gate.resolve()
    await h.dispose()
    assert.deepEqual(h.activity.released, ['a'])
  })
}

test('dispose aborts, awaits underlying iterator quiescence, and blocks late dispatch', async () => {
  const started = deferred(), finish = deferred()
  let blocked
  const h = harness({ async *stream({ config }) {
    started.resolve()
    await finish.promise
    try { await config.fetch(ENDPOINT, { method: 'POST' }) } catch { blocked = true }
  } })
  const work = h.probe('a')
  await started.promise
  const disposal = h.dispose()
  const result = await work
  assert.equal(result.error, 'PROBE_STOPPED')
  assert.deepEqual(h.activity.released, [])
  finish.resolve()
  await disposal
  assert.equal(blocked, true)
  assert.deepEqual(h.activity.released, ['a'])
  assert.equal(h.activity.requests.length, 0)
  assert.equal((await h.probe('b')).error, 'PROBE_STOPPED')
})

test('late acquisition after abort is released only once and cannot read credentials', async () => {
  const started = deferred(), gate = deferred()
  const h = harness({ acquire: async () => { started.resolve(); await gate.promise } })
  const result = h.probe('a')
  await started.promise
  h.expire()
  assert.equal((await result).error, 'PROBE_TIMEOUT')
  assert.deepEqual(h.activity.released, [])
  gate.resolve()
  await h.dispose()
  assert.deepEqual(h.activity.released, ['a'])
  assert.equal(h.activity.stores.length, 0)
})

test('credential identity changes never dispatch or fall back', async () => {
  const h = harness({ read: () => ({ type: 'oauth', access: 'foreign', accountId: 'foreign', expires: instant + 3600000 }) })
  assert.equal((await h.probe('a')).error, 'PROBE_ACCOUNT_CHANGED')
  assert.equal(h.activity.requests.length, 0)
  await h.dispose()
})

test('abort drains initial record read before releasing the lease', async () => {
  const started = deferred(), finish = deferred()
  const h = harness({ record: async (id, records) => { started.resolve(); await finish.promise; return records.get(id) } })
  const result = h.probe('a')
  await started.promise
  h.expire()
  assert.equal((await result).error, 'PROBE_TIMEOUT')
  assert.deepEqual(h.activity.released, [])
  finish.resolve()
  await h.dispose()
  assert.deepEqual(h.activity.released, ['a'])
  assert.equal(h.activity.streams.length, 0)
})

test('unbounded streamed text is cancelled instead of accumulated or executed', async () => {
  const h = harness({ async *stream({ config }) {
    await config.fetch(ENDPOINT, { method: 'POST' })
    yield { type: 'text_delta', delta: 'x'.repeat(4097) }
    assert.fail('iterator must be closed after the bounded output guard')
  } })
  const result = await h.probe('a')
  assert.equal(result.error, 'PROBE_OUTPUT_LIMIT')
  assert.equal(result.toolResultAccepted, false)
  assert.equal(h.activity.streams[0].config.signal.aborted, true)
  await h.dispose()
})

test('multiple tool calls never execute any local result', async () => {
  const h = harness({ async *stream() { yield { type: 'done', message: assistant([call(), call({ id: 'call_other|fc_other' })], 'toolUse') } } })
  assert.equal((await h.probe('a')).error, 'PROBE_TOOL_INVALID')
  assert.equal(h.activity.streams.length, 1)
  await h.dispose()
})
