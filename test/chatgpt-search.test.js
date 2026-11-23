import test from 'node:test'
import assert from 'node:assert/strict'
import { Accounts } from '../multi/accounts.js'
import { createChatGPTSearchProvider, installChatGPTSearch } from '../search/provider.js'

const ENDPOINT = 'https://chatgpt.com/backend-api/codex/responses'
const table = entries => {
  const data = new Map(entries)
  return { get: id => data.get(id), entries: () => data.entries(), put: async (id, value) => data.set(id, value), delete: async id => data.delete(id) }
}
function fixture(run, overrides = {}) {
  const tables = { accounts: table([['a', { label: 'A' }], ['b', { label: 'B' }]]), sessions: table([['one', { accountId: 'a' }], ['two', { accountId: 'b' }]]) }
  const reads = [], calls = [], streams = [], timers = new Set()
  const accounts = new Accounts({ domain: { table: id => tables[id], close: async () => {} }, credentials: {
    describeRecord: async () => ({ configured: true }),
    readRecord: async key => { reads.push(key); return { kind: 'grant', payload: { type: 'oauth', accountId: key, access: `SECRET-${key}` } } },
  } })
  let current = 'one', route, captures = 0
  const ctx = { agents: { currentInitiator() { captures++; return current === undefined ? undefined : { session: { id: current, requestContext: () => ({ provider: route }) } } } } }
  const deps = {
    createModels({ credentials, authContext }) {
      return { setProvider() {}, getModel: () => ({ id: 'gpt-6.1-sol' }),
        stream(model, context, options) {
          streams.push({ model, context, options, credentials, authContext })
          return run({ model, context, options, credentials, accounts })
        } }
    },
    openaiCodexProvider: () => ({}),
    fetch: async (url, init) => { calls.push({ url, init }); return new Response('', { status: 200 }) },
    setTimeout: (fn, ms) => { assert.equal(ms, 60000); const timer = { fn }; timers.add(timer); return timer },
    clearTimeout: timer => timers.delete(timer),
    ...overrides,
  }
  const installation = createChatGPTSearchProvider(ctx, accounts, deps)
  return { ...installation, accounts, calls, reads, streams, timers, ctx, deps, setCurrent: id => { current = id }, setRoute: value => { route = value }, captures: () => captures }
}
async function* success({ options }) {
  await options.fetch(ENDPOINT, { method: 'POST' })
  options.onProviderStreamEvent({ type: 'response.web_search_call.completed' })
  options.onProviderStreamEvent({ type: 'response.output_text.annotation.added', annotation: { type: 'url_citation', url: 'https://real.example/', title: 'Real' } })
  yield { type: 'text_delta', delta: 'Answer https://fake.example/ is not a citation.' }
  yield { type: 'done', message: { stopReason: 'stop', content: [] } }
}
const idle = f => {
  assert.equal([...f.accounts.activeAccounts.values()].reduce((a, b) => a + b, 0), 0)
  assert.equal([...f.accounts.activeSessions.values()].reduce((a, b) => a + b, 0), 0)
  assert.equal(f.timers.size, 0)
}
const code = expected => error => { assert.equal(error.message, expected); assert.equal(error.code, expected); assert.equal(error.cause, undefined); return true }

test('captures initiating session once and keeps concurrent credentials/leases isolated', async () => {
  let started = 0, resume
  const gate = new Promise(resolve => { resume = resolve })
  const grants = []
  const f = fixture(async function* (args) {
    grants.push(await args.credentials.read('openai-codex'))
    if (++started === 2) resume()
    await gate
    assert.equal(args.accounts.activeAccounts.get('a'), 1)
    assert.equal(args.accounts.activeAccounts.get('b'), 1)
    yield* success(args)
  })
  const first = f.provider.search({ query: 'alpha', sessionId: 'two' })
  f.setCurrent('two')
  const second = f.provider.search({ query: 'beta' })
  f.setCurrent(undefined)
  const results = await Promise.all([first, second])
  assert.equal(f.captures(), 2)
  assert.deepEqual(grants.map(x => x.accountId).sort(), ['dsh-gpt-link/account-a', 'dsh-gpt-link/account-b'])
  assert.deepEqual(results[0].sources, [{ url: 'https://real.example/', title: 'Real' }])
  assert.equal(f.calls.length, 2)
  for (const { context, options, authContext } of f.streams) {
    assert.equal(context.messages.length, 1)
    assert.deepEqual(context.messages.map(x => x.role), ['user'])
    assert.equal(context.tools, undefined)
    assert.equal(options.transport, 'sse'); assert.equal(options.maxRetries, 0)
    assert.equal(options.cacheRetention, 'none')
    assert.equal(await authContext.env('OPENAI_API_KEY'), undefined)
    assert.equal(await authContext.fileExists('/credentials'), false)
    const payload = options.onPayload({ tools: [{ type: 'function' }], previous_response_id: 'replay' })
    assert.deepEqual(payload.tools, [{ type: 'web_search', external_web_access: true }])
    assert.deepEqual(payload.tool_choice, { type: 'web_search' })
    assert.deepEqual(payload.include, ['web_search_call.action.sources'])
    assert.equal(payload.previous_response_id, undefined); assert.equal(payload.store, false)
  }
  assert.deepEqual(f.streams.map(x => x.context.messages[0].content), ['alpha', 'beta'])
  idle(f)
})

test('native openai-codex route uses legacy account despite stale selector binding; never falls back', async () => {
  const grants = []
  const f = fixture(async function* (args) {
    grants.push(await args.credentials.read('openai-codex'))
    assert.equal(args.accounts.activeAccounts.get('legacy'), 1)
    assert.equal(args.accounts.activeAccounts.get('b') ?? 0, 0)
    yield* success(args)
  })
  f.setCurrent('two'); f.setRoute('openai-codex')
  await assert.rejects(f.provider.search({ query: 'q' }), code('ACCOUNT_NOT_FOUND'))
  assert.equal(f.streams.length, 0)
  await f.accounts.accounts.put('legacy', { label: 'Original' })
  const pending = f.provider.search({ query: 'q' })
  f.setRoute('chatgpt-session') // Route too is captured before asynchronous account acquisition.
  await pending
  assert.equal(grants[0].accountId, 'llm-pi-ai/openai-codex')
  assert.equal(f.accounts.sessions.get('two').accountId, 'b')
  idle(f)
})

test('assembly is ready without an initiator; missing/invalid bindings fail before inference', async () => {
  const f = fixture(success)
  f.setCurrent(undefined)
  assert.equal(f.provider.available(), true); assert.equal(await f.provider.ready(), true)
  await assert.rejects(f.provider.search({ query: 'q', sessionId: 'one' }), code('SESSION_ACCOUNT_REQUIRED'))
  f.setCurrent('unbound')
  await assert.rejects(f.provider.search({ query: 'q' }), code('SESSION_ACCOUNT_REQUIRED'))
  assert.equal(f.streams.length, 0); assert.equal(f.calls.length, 0)
  idle(f)
})

test('validates query and maxResults before inference, including zero-result requests', async () => {
  const f = fixture(success)
  for (const query of ['', '  ', null, 'a'.repeat(4001)]) await assert.rejects(f.provider.search({ query }), code('INVALID_QUERY'))
  for (const maxResults of [-1, 51, 1.5, NaN, '2', null]) await assert.rejects(f.provider.search({ query: 'q', maxResults }), code('INVALID_MAX_RESULTS'))
  assert.equal(f.calls.length, 0)
  const result = await f.provider.search({ query: 'q', maxResults: 0 })
  assert.deepEqual(result.sources, []); assert.equal(result.truncated, true)
  idle(f)
})

test('only genuine citation annotations/action sources; bounded deduped http(s) URLs and answer', async () => {
  const f = fixture(async function* ({ options }) {
    await options.fetch(ENDPOINT, { method: 'POST' })
    options.onProviderStreamEvent({ type: 'response.completed', response: { output: [
      { type: 'web_search_call', status: 'completed', action: { sources: [
        { url: 'https://one.example/' }, { url: 'https://one.example/' }, { url: 'javascript:bad' }, { url: 'file:///secret' },
        { url: 'https://user:secret@leak.example/' }, { url: 'https://long.example/' + 'a'.repeat(4096) },
        { url: 'https://unicode.example/' + '界'.repeat(1000) },
      ] } },
      { type: 'message', content: [{ annotations: [{ type: 'url_citation', url: 'http://two.example/', title: 'Two' }, { type: 'url_citation', url: 'https://three.example/' }, { type: 'other', url: 'https://fake.example/' }] }] },
    ] } })
    yield { type: 'text_delta', delta: 'a'.repeat(13000) + 'https://uncited.example/' }
  })
  const result = await f.provider.search({ query: 'q', maxResults: 2 })
  assert.deepEqual(result.sources, [{ url: 'https://one.example/' }, { url: 'http://two.example/', title: 'Two' }])
  assert.equal(result.content.length, 12000); assert.equal(result.truncated, true)
  idle(f)
})

test('completed hosted search permits genuinely empty results, but not an ordinary answer', async () => {
  const empty = fixture(async function* ({ options }) { options.onProviderStreamEvent({ type: 'web_search_call.completed' }); yield { type: 'done', message: { content: [] } } })
  assert.deepEqual(await empty.provider.search({ query: 'q' }), { content: '', sources: [], truncated: false })
  const fake = fixture(async function* () { yield { type: 'text_delta', delta: 'https://fake.example/' } })
  await assert.rejects(fake.provider.search({ query: 'q' }), code('SEARCH_NOT_EXECUTED'))
  idle(empty); idle(fake)
})

test('injected native WebError preserves normalized structured code without raw cause', async () => {
  class WebError extends Error { constructor(message, code) { super(message); this.code = code } }
  const f = fixture(async function* () { throw new Error('SECRET OAuth') }, { WebError })
  await assert.rejects(f.provider.search({ query: 'q' }), error => {
    assert.ok(error instanceof WebError)
    return code('SEARCH_FAILED')(error)
  })
  idle(f)
})

test('errors and HTTP failures release leases and cannot leak raw OAuth/server errors', async () => {
  for (const run of [async function* () { throw Object.assign(new Error('SECRET refresh token'), { code: 'SECRET_CODE' }) },
    async function* () { yield { type: 'error', error: { errorMessage: 'SECRET bearer' } } }]) {
    const f = fixture(run)
    await assert.rejects(f.provider.search({ query: 'q' }), code('SEARCH_FAILED')); idle(f)
  }
  const f = fixture(success, { fetch: async () => new Response('SECRET', { status: 401 }) })
  await assert.rejects(f.provider.search({ query: 'q' }), code('SEARCH_HTTP_401')); idle(f)
})

test('network guard blocks alternate URLs/methods and redirects; never forwards credentials to redirects', async () => {
  for (const [url, method] of [['https://evil.example/', 'POST'], ['https://chatgpt.com.evil/backend-api/codex/responses', 'POST'], [ENDPOINT, 'GET'], [ENDPOINT + '?token=SECRET', 'POST']]) {
    const f = fixture(async function* ({ options }) { try { await options.fetch(url, { method }) } catch {} })
    await assert.rejects(f.provider.search({ query: 'q' }), code('SEARCH_TARGET_BLOCKED'))
    assert.equal(f.calls.length, 0); idle(f)
  }
  let calls = 0
  const f = fixture(success, { fetch: async (url, init) => {
    calls++; assert.equal(url, ENDPOINT); assert.equal(init.redirect, 'error'); assert.equal(init.credentials, 'omit')
    return new Response('', { status: 302, headers: { location: 'https://evil.example/' } })
  } })
  await assert.rejects(f.provider.search({ query: 'q' }), code('SEARCH_REDIRECT_BLOCKED'))
  assert.equal(calls, 1); idle(f)
})

test('one inference POST per query, even if native code attempts a retry', async () => {
  const f = fixture(async function* ({ options }) {
    await options.fetch(ENDPOINT, { method: 'POST' })
    try { await options.fetch(ENDPOINT, { method: 'POST' }) } catch {}
    options.onProviderStreamEvent({ type: 'web_search_call.completed' })
  })
  await assert.rejects(f.provider.search({ query: 'q' }), code('SEARCH_REQUEST_LIMIT'))
  assert.equal(f.calls.length, 1); idle(f)
})

for (const reason of ['abort', 'timeout', 'unload']) test(`${reason} aborts injected fetch and releases shared lease`, async () => {
  let entered
  const ready = new Promise(resolve => { entered = resolve })
  let nativeSignal
  const f = fixture(async function* ({ options }) {
    await options.fetch(ENDPOINT, { method: 'POST' })
  }, { fetch: async (_url, init) => {
    nativeSignal = init.signal; entered()
    return new Promise((_, reject) => init.signal.addEventListener('abort', () => reject(new Error('SECRET abort')), { once: true }))
  } })
  let released
  const cleanup = new Promise(resolve => { released = resolve })
  const acquire = f.accounts.acquireSession.bind(f.accounts)
  f.accounts.acquireSession = async id => {
    const lease = await acquire(id)
    return { ...lease, release() { lease.release(); released() } }
  }
  const controller = new AbortController()
  const pending = f.provider.search({ query: 'q' }, controller.signal)
  await ready
  assert.equal(f.accounts.activeAccounts.get('a'), 1)
  if (reason === 'abort') controller.abort(new Error('SECRET caller reason'))
  else if (reason === 'timeout') [...f.timers][0].fn()
  else f.dispose()
  await assert.rejects(pending, code(reason === 'abort' ? 'SEARCH_ABORTED' : reason === 'timeout' ? 'SEARCH_TIMEOUT' : 'PLUGIN_STOPPED'))
  assert.equal(nativeSignal.aborted, true)
  await cleanup
  idle(f)
  if (reason === 'unload') {
    assert.equal(f.provider.available(), false)
    await assert.rejects(f.provider.search({ query: 'q' }), code('PLUGIN_STOPPED'))
  }
})

test('pre-aborted invocation does not infer and acquisition completing after abort releases late lease', async () => {
  const f = fixture(success)
  const controller = new AbortController(); controller.abort()
  await assert.rejects(f.provider.search({ query: 'q' }, controller.signal), code('SEARCH_ABORTED'))
  assert.equal(f.streams.length, 0)
  let releaseAcquisition, releases = 0
  f.accounts.acquireSession = () => new Promise(resolve => { releaseAcquisition = () => resolve({ accountId: 'a', release: () => { releases++ } }) })
  const c = new AbortController()
  const pending = f.provider.search({ query: 'q' }, c.signal)
  c.abort()
  await assert.rejects(pending, code('SEARCH_ABORTED'))
  releaseAcquisition()
  await Promise.resolve(); await Promise.resolve()
  assert.equal(releases, 1); assert.equal(f.streams.length, 0); idle(f)
})

test('aborted non-cooperative native work keeps lease until it actually quiesces', async () => {
  let entered, resume, released
  const ready = new Promise(resolve => { entered = resolve })
  const gate = new Promise(resolve => { resume = resolve })
  const cleanup = new Promise(resolve => { released = resolve })
  const f = fixture(async function* () {
    entered()
    await gate // Simulates a native credential refresh that ignores AbortSignal.
    yield { type: 'done', message: { content: [] } }
  })
  const acquire = f.accounts.acquireSession.bind(f.accounts)
  f.accounts.acquireSession = async id => {
    const lease = await acquire(id)
    return { ...lease, release() { lease.release(); released() } }
  }
  const controller = new AbortController()
  const pending = f.provider.search({ query: 'q' }, controller.signal)
  await ready
  controller.abort()
  await assert.rejects(pending, code('SEARCH_ABORTED'))
  assert.equal(f.accounts.activeAccounts.get('a'), 1)
  await assert.rejects(f.accounts.remove('a'), code('ACCOUNT_BUSY'))
  assert.equal(f.timers.size, 0)
  resume()
  await cleanup
  idle(f)
})

test('installation imports native dependencies through loader and registers lifecycle cleanup', async () => {
  const f = fixture(success), imported = []
  let registered, cleanup
  Object.assign(f.ctx, {
    loader: { import: async id => { imported.push(id); return id.endsWith('/openai-codex') ? { openaiCodexProvider: f.deps.openaiCodexProvider } : { createModels: f.deps.createModels } } },
    effect: setup => { cleanup = setup() }, web: { registerSearchProvider: provider => { registered = provider } },
  })
  const installation = await installChatGPTSearch(f.ctx, f.accounts)
  assert.deepEqual(imported, ['@earendil-works/pi-ai', '@earendil-works/pi-ai/providers/openai-codex', '@deepseek-ai/dsh-web'])
  assert.equal(registered.id, 'chatgpt-session-search'); assert.equal(registered.title, 'ChatGPT (session account)')
  assert.deepEqual(Object.keys(registered.description).sort(), ['de', 'en', 'es', 'fr', 'ja', 'pt', 'ru', 'zh'])
  assert.equal(registered, installation.provider)
  cleanup(); assert.equal(registered.available(), false)
})
