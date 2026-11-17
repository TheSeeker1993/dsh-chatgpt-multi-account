import test from 'node:test'
import assert from 'node:assert/strict'
import { createAutomaticSearchProvider, installAutomaticSearch } from '../search/auto.js'

const result = label => ({ content: label, sources: [], truncated: false })
const session = (id, route) => ({ session: { id, requestContext: () => ({ provider: route }) } })
const backend = label => ({ available: () => true, ready: async () => true, search: async () => result(label) })
class WebError extends Error { constructor(message, code) { super(message); this.code = code } }

function fixture(sections = {}) {
  let current = session('a', 'chatgpt-session'), captures = 0
  const registrations = [], effects = [], imports = []
  const agents = { currentInitiator() { captures++; return current } }
  const services = { agents, credentials: { marker: 'credential-service' }, launchEnvironment: { marker: 'launch-environment' } }
  const ctx = {
    agents, get: key => services[key],
    settings: { describe: () => Object.entries(sections).map(([ns, value]) => ({ ns, value })) },
    loader: { async import(name) { imports.push(name); throw new Error(`Unexpected import ${name}`) } },
    web: { registerSearchProvider: value => { registrations.push(value); return () => {} } },
    effect: (...args) => effects.push(args),
  }
  return { ctx, sections, services, registrations, effects, imports, captures: () => captures, set: value => { current = value } }
}

test('actual request route selects GPT or DeepSeek, never caller-supplied route/model/session', async () => {
  const f = fixture(), calls = []
  const gpt = backend('gpt'), deepseek = backend('deepseek')
  for (const [label, provider] of [['gpt', gpt], ['deepseek', deepseek]]) {
    provider.search = async (request, signal) => { calls.push([label, request, signal]); return result(label) }
  }
  const { provider } = createAutomaticSearchProvider(f.ctx, gpt, deepseek)
  assert.equal(provider.id, 'model-aware-search')
  assert.equal(provider.title, 'Auto: ChatGPT / DeepSeek')
  const request = { query: 'q', model: 'gpt-6.1-sol', provider: 'openai-codex', sessionId: 'spoofed' }
  const signal = new AbortController().signal
  for (const [route, expected] of [['chatgpt-session', 'gpt'], ['openai-codex', 'gpt'], ['deepseek-account', 'deepseek'], ['deepseek-official', 'deepseek'], ['anthropic', 'deepseek']]) {
    f.set(session('a', route))
    assert.equal((await provider.search(request, signal)).content, expected)
    assert.equal(calls.at(-1)[1], request); assert.equal(calls.at(-1)[2], signal)
  }
  assert.equal(f.captures(), 5)
})

test('missing or empty actual request route fails closed before either backend', async () => {
  const f = fixture()
  let calls = 0
  const delegate = backend('never')
  delegate.search = async () => { calls++; throw new Error('must not dispatch') }
  const { provider } = createAutomaticSearchProvider(f.ctx, delegate, delegate, { WebError })
  for (const initiator of [session('a', undefined), session('a', ''), { session: { id: 'a' } }]) {
    f.set(initiator)
    await assert.rejects(provider.search({ query: 'q', provider: 'chatgpt-session' }), error => error instanceof WebError && error.code === 'SEARCH_ROUTE_REQUIRED')
  }
  assert.equal(calls, 0)
})

test('missing initiator fails closed; model assembly readiness uses route without an initiator', async () => {
  const f = fixture(); f.set(undefined)
  const gpt = backend('gpt'), deepseek = backend('ds'), routes = []
  gpt.ready = async route => { routes.push(['gpt', route]); return true }
  deepseek.ready = async route => { routes.push(['ds', route]); return false }
  const { provider } = createAutomaticSearchProvider(f.ctx, gpt, deepseek, { WebError })
  assert.equal(await provider.ready('openai-codex'), true)
  assert.equal(await provider.ready('deepseek-account'), false)
  assert.deepEqual(routes, [['gpt', 'openai-codex'], ['ds', 'deepseek-account']])
  await assert.rejects(provider.search({ query: 'q', sessionId: 'a' }), error => error instanceof WebError && error.code === 'SEARCH_INITIATOR_REQUIRED')
  assert.equal(f.captures(), 1)
})

test('unavailable, auth, abort and backend errors never cross-fallback', async () => {
  const f = fixture(), error = Object.assign(new Error('auth denied'), { code: 'AUTH_REQUIRED' })
  let otherCalls = 0
  const gpt = backend('gpt'), deepseek = backend('ds')
  deepseek.search = async () => { otherCalls++; return result('ds') }
  const { provider } = createAutomaticSearchProvider(f.ctx, gpt, deepseek)
  gpt.search = async () => { throw error }
  await assert.rejects(provider.search({ query: 'q' }), value => value === error)
  const controller = new AbortController()
  const aborted = Object.assign(new Error('aborted'), { code: 'WEB_ABORTED' })
  controller.abort(aborted)
  gpt.search = async (request, signal) => { signal.throwIfAborted() }
  await assert.rejects(provider.search({ query: 'q' }, controller.signal), value => value === aborted)
  gpt.available = () => false
  await assert.rejects(provider.search({ query: 'q' }), { code: 'WEB_PROVIDER_UNAVAILABLE' })
  assert.equal(otherCalls, 0)
  let gptCalls = 0
  gpt.available = () => true; gpt.search = async () => { gptCalls++ }
  f.set(session('b', 'deepseek-account')); deepseek.search = async () => { throw error }
  await assert.rejects(provider.search({ query: 'q' }), value => value === error)
  assert.equal(gptCalls, 0)
})

// A public native apply contract double, not a transport: no fetch, account
// grants, API keys, or credential values are read by these tests.
function nativeContract(observations, gate = Promise.resolve()) {
  return { apply(ctx, config) {
    const provider = {
      id: 'deepseek-search-api', available: () => {
        // Real native available() resolves options too: it must run inside ALS.
        assert.notEqual(config.searchBilling.get(), undefined)
        return true
      },
      ready: async route => { observations.push({ ready: route, billing: config.searchBilling.get() }); return true },
      async search(request, signal) {
        const first = ctx.get('agents').currentInitiator()
        const billing = config.searchBilling.get()
        await gate
        observations.push({ first, after: ctx.get('agents').currentInitiator(), billing,
          afterBilling: config.searchBilling.get(), endpoint: config.searchBaseURL.get(), ref: config.searchApiKeyEnv.get(),
          count: config.count.get(), throttle: config.searchRequestsPerSecond.get(), original: config.sendOriginalQuestion.get(),
          credentials: ctx.get('credentials'), environment: ctx.get('launchEnvironment'), request, signal })
        return result(first.session.id)
      },
    }
    ctx.web.registerSearchProvider(provider)
    ctx.web.registerFetchProvider({ id: 'ignored-fetch' })
  } }
}

test('installation reuses public native apply, preserving billing/auth settings and public services', async () => {
  const settings = Object.freeze({ searchBilling: 'account', searchBaseURL: 'https://search.example/v1/tools', searchApiKeyEnv: 'CUSTOM_REF', count: 4, searchRequestsPerSecond: 2, sendOriginalQuestion: false })
  const f = fixture({ 'web-deepseek-api': settings, 'web-search-deepseek': { model: 'unused' } }), seen = []
  const before = JSON.stringify(f.sections)
  const installation = await installAutomaticSearch(f.ctx, backend('gpt'), { web: { WebError }, native: nativeContract(seen) })
  f.set(session('deep', 'deepseek-account'))
  const request = { query: 'q' }, signal = new AbortController().signal
  await installation.provider.search(request, signal)
  assert.equal(f.registrations.length, 1)
  assert.equal(f.registrations[0], installation.provider)
  assert.equal(seen[0].billing, 'account'); assert.equal(seen[0].afterBilling, 'account')
  assert.equal(seen[0].endpoint, settings.searchBaseURL); assert.equal(seen[0].ref, 'CUSTOM_REF')
  assert.equal(seen[0].count, 4); assert.equal(seen[0].throttle, 2); assert.equal(seen[0].original, false)
  assert.equal(seen[0].credentials, f.services.credentials)
  assert.equal(seen[0].environment, f.services.launchEnvironment)
  assert.equal(seen[0].request, request)
  assert.ok(seen[0].signal instanceof AbortSignal)
  assert.equal(seen[0].signal.aborted, false)
  assert.equal(JSON.stringify(f.sections), before)
  assert.deepEqual(f.imports, [])
  assert.equal(f.effects.length, 1)
  f.effects[0][0]()()
  assert.equal(installation.provider.available(), false)
  assert.equal(await installation.provider.ready('deepseek-account'), false)
  await assert.rejects(installation.provider.search(request), { code: 'WEB_PROVIDER_UNAVAILABLE' })
})

test('overlapping GPT/DeepSeek calls retain initiating sessions and per-operation settings snapshots', async () => {
  let release
  const gate = new Promise(resolve => { release = resolve })
  const f = fixture({ 'web-deepseek-api': { searchBilling: 'account' } }), seen = []
  const gpt = backend('gpt')
  const installation = await installAutomaticSearch(f.ctx, gpt, { web: { WebError }, native: nativeContract(seen, gate) })
  f.set(session('ds-one', 'deepseek-account'))
  const first = installation.provider.search({ query: 'one' })
  f.sections['web-deepseek-api'] = { searchBilling: 'api-key' }
  f.set(session('gpt', 'chatgpt-session'))
  const second = installation.provider.search({ query: 'gpt' })
  f.set(session('ds-two', 'deepseek-official'))
  const third = installation.provider.search({ query: 'two' })
  f.set(undefined)
  release()
  assert.deepEqual((await Promise.all([first, second, third])).map(x => x.content), ['ds-one', 'gpt', 'ds-two'])
  assert.deepEqual(seen.map(x => [x.first.session.id, x.after.session.id, x.billing, x.afterBilling]), [
    ['ds-one', 'ds-one', 'account', 'account'], ['ds-two', 'ds-two', 'api-key', 'api-key'],
  ])
  assert.equal(f.captures(), 3)
})

test('legacy native provider is used only without API settings, with literal/key options unchanged', async () => {
  const settings = { apiKey: 'FAKE-DO-NOT-SEND', apiKeyEnv: 'KEY_REF', baseURL: 'https://legacy.example/v1', model: 'native-model', apiVersion: 'native-version', maxTokens: 42, maxUses: 2 }
  const f = fixture({ 'web-search-deepseek': settings }), values = []
  const native = { apply(ctx, config) {
    ctx.web.registerSearchProvider({ id: 'deepseek-official', available: () => true, ready: async () => true,
      search: async () => { values.push(Object.fromEntries(Object.entries(config).map(([key, item]) => [key, item.get()]))); return result('legacy') } })
  } }
  const { provider } = await installAutomaticSearch(f.ctx, backend('gpt'), { web: { WebError }, native })
  f.set(session('ds', 'deepseek-official'))
  assert.equal((await provider.search({ query: 'q' })).content, 'legacy')
  assert.deepEqual(values, [settings])
})

test('missing DeepSeek namespace fails only its routes, never uses GPT as fallback', async () => {
  const f = fixture()
  const { provider } = await installAutomaticSearch(f.ctx, backend('gpt'), { web: { WebError } })
  assert.equal((await provider.search({ query: 'q' })).content, 'gpt')
  f.set(session('ds', 'deepseek-account'))
  assert.equal(await provider.ready('deepseek-account'), false)
  await assert.rejects(provider.search({ query: 'q' }), { code: 'WEB_PROVIDER_UNAVAILABLE' })
  assert.deepEqual(f.imports, [])
})

test('native facade sanitizes search, readiness and availability errors without fallback', async () => {
  const f = fixture({ 'web-deepseek-api': { searchBilling: 'account' } })
  const raw = 'PRIVATE server text https://private.example/endpoint'
  let phase = 'search', code = 'WEB_PROVIDER_ERROR', gptCalls = 0
  const reject = () => { throw Object.assign(new Error(raw), { code, details: raw, cause: new Error(raw) }) }
  const native = { apply(ctx) {
    ctx.web.registerSearchProvider({ id: 'deepseek-search-api',
      available: () => phase === 'available' ? reject() : true,
      ready: () => phase === 'ready' ? reject() : true,
      search: async () => reject(),
    })
  } }
  const gpt = backend('never'); gpt.search = async () => { gptCalls++ }
  const { provider } = await installAutomaticSearch(f.ctx, gpt, { web: { WebError }, native })
  f.set(session('ds', 'deepseek-account'))
  const safe = expected => error => {
    assert.ok(error instanceof WebError)
    assert.equal(error.code, expected)
    assert.equal(error.message.includes(raw), false)
    assert.equal(error.details, undefined)
    assert.equal(error.cause, undefined)
    return true
  }
  for (const value of ['WEB_PROVIDER_ERROR', 'WEB_ABORTED', 'WEB_PROVIDER_UNAVAILABLE', raw, undefined]) {
    code = value
    await assert.rejects(provider.search({ query: 'q' }), safe(['WEB_PROVIDER_ERROR', 'WEB_ABORTED', 'WEB_PROVIDER_UNAVAILABLE'].includes(value) ? value : 'WEB_PROVIDER_ERROR'))
  }
  phase = 'ready'; code = raw
  await assert.rejects(provider.ready('deepseek-account'), safe('WEB_PROVIDER_ERROR'))
  phase = 'available'
  await assert.rejects(provider.search({ query: 'q' }), safe('WEB_PROVIDER_ERROR'))
  assert.equal(gptCalls, 0)
})

test('native searches forward caller cancellation and abort on the single installation cleanup', async () => {
  const f = fixture({ 'web-deepseek-api': { searchBilling: 'account' } })
  const signals = []
  let calls = 0
  const native = { apply(ctx) {
    ctx.web.registerSearchProvider({ id: 'deepseek-search-api', available: () => true,
      search: (request, signal) => {
        calls++; signals.push(signal)
        return new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(new Error('PRIVATE native abort error')), { once: true }))
      },
    })
  } }
  const installation = await installAutomaticSearch(f.ctx, backend('never'), { web: { WebError }, native })
  f.set(session('ds', 'deepseek-account'))
  const caller = new AbortController()
  const first = installation.provider.search({ query: 'one' }, caller.signal)
  const firstRejected = assert.rejects(first, error => error.code === 'WEB_ABORTED' && !error.message.includes('PRIVATE') && !error.cause)
  caller.abort(new Error('PRIVATE caller reason'))
  await firstRejected
  assert.equal(signals[0].aborted, true)
  assert.equal(signals[0].reason.message.includes('PRIVATE'), false)
  const second = installation.provider.search({ query: 'two' })
  const secondRejected = assert.rejects(second, { code: 'WEB_ABORTED' })
  assert.equal(f.effects.length, 1)
  f.effects[0][0]()()
  await secondRejected
  assert.equal(signals[1].aborted, true)
  await assert.rejects(installation.provider.search({ query: 'three' }), { code: 'WEB_PROVIDER_UNAVAILABLE' })
  assert.equal(calls, 2)
})

test('pre-aborted native invocation never dispatches', async () => {
  const f = fixture({ 'web-deepseek-api': { searchBilling: 'account' } }), seen = []
  const { provider } = await installAutomaticSearch(f.ctx, backend('never'), { web: { WebError }, native: nativeContract(seen) })
  f.set(session('ds', 'deepseek-account'))
  const controller = new AbortController(); controller.abort(new Error('PRIVATE'))
  await assert.rejects(provider.search({ query: 'q' }, controller.signal), { code: 'WEB_ABORTED' })
  assert.equal(seen.length, 0)
})

test('namespace disappearance does not silently restore defaults or switch credential settings', async () => {
  const f = fixture({ 'web-deepseek-api': { searchBilling: 'account' } }), seen = []
  const { provider } = await installAutomaticSearch(f.ctx, backend('gpt'), { web: { WebError }, native: nativeContract(seen) })
  delete f.sections['web-deepseek-api']
  f.set(session('ds', 'deepseek-account'))
  await assert.rejects(provider.search({ query: 'q' }), { code: 'WEB_PROVIDER_UNAVAILABLE' })
  assert.equal(seen.length, 0)
})
