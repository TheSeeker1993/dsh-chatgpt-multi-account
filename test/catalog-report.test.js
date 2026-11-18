import test from 'node:test'
import assert from 'node:assert/strict'
import { setTimeout as delay } from 'node:timers/promises'
import { Accounts } from '../multi/accounts.js'
import { CATALOG_REPORT_URL, createCatalogReporter, installCatalogReport, summarizeCatalog } from '../multi/catalog-report.js'

const NOW = Date.parse('2026-11-18T09:00:00Z')
const PRIVATE = 'PRIVATE_SYNTHETIC_SERVER_SECRET'
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done }); return { promise, resolve } }
const grant = id => ({ kind: 'grant', payload: { type: 'oauth', accountId: `issuer-${id}`, access: `synthetic-access-${id}`, refresh: `synthetic-refresh-${id}`, expires: NOW + 1e9 } })
const model = (slug = 'gpt-6.1-sol') => ({ slug, visibility: 'list', tool_mode: 'direct', use_responses_lite: false,
  experimental_supported_tools: ['web_search', 'image_generation'], supported_reasoning_levels: [{ effort: 'low' }, { effort: 'high' }],
  default_reasoning_level: 'low', input_modalities: ['text', 'image'], context_window: 272000 })
const body = () => Response.json({ models: [model()] })

function fixture(options = {}) {
  let now = NOW, acquisitions = 0, releases = 0
  const records = new Map(['a', 'b', 'legacy'].map(id => [id, grant(id)])), calls = [], reads = [], leases = new Map()
  const accounts = {
    assertAccount(id) { if (!records.has(id)) throw Object.assign(new Error(PRIVATE), { code: 'ACCOUNT_NOT_FOUND' }) },
    async acquireAccount(sessionId, id) {
      this.assertAccount(id); acquisitions++; leases.set(id, (leases.get(id) ?? 0) + 1)
      assert.match(sessionId, /^catalog-report-[\da-f-]+$/)
      let released = false
      return { release() { assert.equal(released, false); released = true; releases++; leases.set(id, leases.get(id) - 1) } }
    },
    recordStore(id) { this.assertAccount(id); return { readRecord: async () => { reads.push(id); return structuredClone(records.get(id)) },
      modify: () => assert.fail('catalog must not refresh credentials'), deleteRecord: () => assert.fail('catalog must not delete credentials') } },
    select: () => assert.fail('catalog must not change bindings'),
    credentialStore: () => assert.fail('catalog must not obtain a mutable credential store'),
  }
  const reporter = createCatalogReporter({ accounts, nativeIds: ['gpt-6.1-sol'], now: () => now, ...options,
    fetch: async (url, init) => { calls.push({ url, ...init }); return options.fetch ? options.fetch(url, init) : body() } })
  return { reporter, accounts, records, calls, reads, leases, tick: ms => { now += ms }, get acquisitions() { return acquisitions }, get releases() { return releases } }
}
const safeFailure = (report, code) => {
  assert.deepEqual(report, { checkedAt: null, clientVersion: '0.166.0', models: [], error: code, retryAt: null })
  assert.ok(!JSON.stringify(report).includes(PRIVATE))
}

test('catalog whitelists real-like fields without inferring compatibility, including 6.2 code-mode-only lite', () => {
  const rows = [model(), { ...model('gpt-6.2'), tool_mode: 'code_mode_only', use_responses_lite: true,
    experimental_supported_tools: ['web_search', { name: 'computer_use', schema: PRIVATE }, { type: 'other_tool', prompt: PRIVATE }] }]
  for (const row of rows) Object.assign(row, { description: PRIVATE, instructions: PRIVATE, system_prompt: PRIVATE, headers: { authorization: PRIVATE }, schema: { secret: PRIVATE }, disabled: true, compatible: false })
  const result = summarizeCatalog({ models: rows, secrets: PRIVATE }, new Set(['gpt-6.1-sol']))
  assert.deepEqual(result, [
    { id: 'gpt-6.1-sol', native: true, visibility: 'list', toolMode: 'direct', responsesLite: false, experimentalToolNames: ['web_search', 'image_generation'], reasoningLevels: ['low', 'high'], defaultReasoning: 'low', input: ['text', 'image'], contextWindow: 272000 },
    { id: 'gpt-6.2', native: false, visibility: 'list', toolMode: 'code_mode_only', responsesLite: true, experimentalToolNames: ['web_search', 'computer_use', 'other_tool'], reasoningLevels: ['low', 'high'], defaultReasoning: 'low', input: ['text', 'image'], contextWindow: 272000 },
  ])
  assert.ok(!JSON.stringify(result).includes(PRIVATE))
  assert.ok(result.every(row => !('compatible' in row) && !('disabled' in row) && !('supported' in row)))
})

test('catalog normalizer rejects unknown schema and bounds/filters field values rather than copying raw rows', () => {
  for (const value of [null, [], {}, { models: {} }, { models: Array(1001).fill(model()) }]) assert.throws(() => summarizeCatalog(value, new Set()), { code: 'CATALOG_PAYLOAD' })
  const rows = [null, {}, { slug: '<script>secret</script>' }, { ...model('valid-id'), visibility: PRIVATE + '\n', tool_mode: {}, use_responses_lite: 'true',
    experimental_supported_tools: [null, { name: '<secret>' }, 'web_search', ...Array(70).fill('safe_tool')], supported_reasoning_levels: [{ effort: 'high' }, { effort: 'high' }, { effort: '<secret>' }],
    default_reasoning_level: 'unsafe value', input_modalities: ['secret', 'text', 'image', 'audio', 'video', 'text'], context_window: Number.MAX_SAFE_INTEGER }, model('valid-id')]
  const [row] = summarizeCatalog({ models: rows }, new Set())
  assert.deepEqual({ ...row, experimentalToolNames: [] }, { id: 'valid-id', native: false, visibility: null, toolMode: null, responsesLite: null,
    experimentalToolNames: [], reasoningLevels: ['high'], defaultReasoning: null, input: ['text', 'image', 'audio', 'video'], contextWindow: null })
  assert.equal(row.experimentalToolNames.length, 50)
  assert.equal(summarizeCatalog({ models: rows }, new Set()).length, 1)
})

test('GET uses exact selected-account bearer/issuer, no fallback, refresh, bindings or credential mutations', async t => {
  const f = fixture(); t.after(() => f.reporter.dispose())
  const before = structuredClone(f.records)
  const result = await f.reporter.report('b')
  assert.equal(result.error, null); assert.equal(result.checkedAt, NOW)
  assert.deepEqual(f.records, before)
  assert.deepEqual(f.reads, ['b', 'b'])
  assert.equal(f.calls.length, 1)
  const call = f.calls[0]
  assert.equal(CATALOG_REPORT_URL, 'https://chatgpt.com/backend-api/codex/models?client_version=0.166.0')
  assert.equal(call.url, CATALOG_REPORT_URL)
  assert.equal(call.method, 'GET'); assert.equal(call.redirect, 'error'); assert.equal(call.cache, 'no-store')
  assert.deepEqual(call.headers, { accept: 'application/json', authorization: 'Bearer synthetic-access-b', 'chatgpt-account-id': 'issuer-b' })
  assert.equal(call.body, undefined); assert.ok(call.signal instanceof AbortSignal)
  assert.equal(f.acquisitions, 1); assert.equal(f.releases, 1); assert.equal(f.leases.get('b'), 0)
  assert.ok(!JSON.stringify(result).includes('synthetic-'))
})

test('missing and expired grants and invalid accounts dispatch zero HTTP, never legacy fallback', async t => {
  for (const [stored, code] of [[null, 'CATALOG_SIGNED_OUT'], [{ kind: 'grant', payload: {} }, 'CATALOG_SIGNED_OUT'], [{ ...grant('a'), payload: { ...grant('a').payload, expires: NOW } }, 'CATALOG_TOKEN_EXPIRED']]) {
    const f = fixture(); t.after(() => f.reporter.dispose()); f.records.set('a', stored)
    safeFailure(await f.reporter.report('a'), code)
    assert.equal(f.calls.length, 0); assert.equal(f.releases, 1); assert.deepEqual(f.reads, ['a'])
  }
  const f = fixture(); t.after(() => f.reporter.dispose())
  for (const id of [null, undefined, '', 'unknown', '../legacy', PRIVATE]) safeFailure(await f.reporter.report(id), 'ACCOUNT_NOT_FOUND')
  assert.equal(f.calls.length, 0); assert.equal(f.acquisitions, 0)
})

test('parallel accounts remain isolated; same account deduplicates in-flight work and cooldown is per-account', async t => {
  const gates = new Map(['issuer-a', 'issuer-b'].map(id => [id, deferred()])), started = deferred()
  let count = 0
  const f = fixture({ fetch: async (_url, init) => { if (++count === 2) started.resolve(); await gates.get(init.headers['chatgpt-account-id']).promise; return body() } })
  t.after(() => f.reporter.dispose())
  const a = f.reporter.report('a'), same = f.reporter.report('a'), b = f.reporter.report('b')
  assert.equal(a, same)
  await started.promise
  assert.equal(f.calls.length, 2); assert.equal(f.leases.get('a'), 1); assert.equal(f.leases.get('b'), 1)
  gates.get('issuer-b').resolve(); await b
  assert.equal(f.leases.get('a'), 1); assert.equal(f.leases.get('b'), 0)
  gates.get('issuer-a').resolve(); const original = await a
  original.models[0].id = 'tampered'
  assert.equal((await f.reporter.report('a')).models[0].id, 'gpt-6.1-sol')
  const cached = await f.reporter.report('a'); cached.models.length = 0
  assert.equal((await f.reporter.report('a')).models.length, 1)
  f.tick(9999); await f.reporter.report('a'); assert.equal(f.calls.length, 2)
  f.tick(1); await f.reporter.report('a'); assert.equal(f.calls.length, 3)
})

test('429 honors bounded per-account Retry-After backoff without retry or raw error body', async t => {
  for (const [retryAfter, expected] of [['1', 30000], ['60', 60000], ['9999999', 300000], ['nonsense', 30000], [new Date(NOW + 90000).toUTCString(), 90000]]) {
    const f = fixture({ fetch: async () => new Response(PRIVATE, { status: 429, headers: { 'retry-after': retryAfter } }) }); t.after(() => f.reporter.dispose())
    const result = await f.reporter.report('a')
    assert.deepEqual(result, { checkedAt: null, clientVersion: '0.166.0', models: [], error: 'CATALOG_THROTTLED', retryAt: NOW + expected })
    f.tick(expected - 1); assert.deepEqual(await f.reporter.report('a'), result); assert.equal(f.calls.length, 1)
    await f.reporter.report('b'); assert.equal(f.calls.length, 2)
    f.tick(1); await f.reporter.report('a'); assert.equal(f.calls.length, 3)
  }
})

test('401/403/500/redirects fail safely without reading or echoing raw bodies', async t => {
  for (const status of [401, 403, 500, 301, 302, 307]) {
    let consumed = false
    const f = fixture({ fetch: async () => new Response(new ReadableStream({ pull() { consumed = true; throw Error(PRIVATE) } }, { highWaterMark: 0 }), { status }) })
    t.after(() => f.reporter.dispose())
    safeFailure(await f.reporter.report('a'), [401, 403].includes(status) ? 'CATALOG_AUTH_REJECTED' : 'CATALOG_HTTP')
    assert.equal(consumed, false); assert.equal(f.calls.length, 1); assert.equal(f.releases, 1)
  }
  const f = fixture({ fetch: async () => { const response = body(); Object.defineProperty(response, 'redirected', { value: true }); return response } }); t.after(() => f.reporter.dispose())
  safeFailure(await f.reporter.report('a'), 'CATALOG_HTTP')
})

test('malformed JSON/schema and both declared/streamed oversized payloads fail safely using actual Response bodies', async t => {
  const factories = [
    [() => new Response(PRIVATE), 'CATALOG_PAYLOAD'],
    [() => Response.json({ models: null, secret: PRIVATE }), 'CATALOG_PAYLOAD'],
    [() => Response.json({ models: Array(1001).fill(model()), secret: PRIVATE }), 'CATALOG_PAYLOAD'],
    [() => new Response(PRIVATE, { headers: { 'content-length': String(2 * 1024 * 1024 + 1) } }), 'CATALOG_TOO_LARGE'],
    [() => new Response(PRIVATE + 'x'.repeat(2 * 1024 * 1024)), 'CATALOG_TOO_LARGE'],
    [() => new Response(null), 'CATALOG_PAYLOAD'],
  ]
  for (const [response, expected] of factories) {
    const f = fixture({ fetch: async () => response() }); t.after(() => f.reporter.dispose())
    safeFailure(await f.reporter.report('a'), expected); assert.equal(f.releases, 1)
  }
})

test('network errors and identity changes are sanitized, terminal and release leases', async t => {
  const f = fixture({ fetch: async () => { throw Object.assign(Error(PRIVATE), { code: PRIVATE, body: PRIVATE }) } }); t.after(() => f.reporter.dispose())
  safeFailure(await f.reporter.report('a'), 'CATALOG_NETWORK')
  await f.reporter.report('a'); assert.equal(f.calls.length, 1); assert.equal(f.releases, 1)
  const g = fixture({ fetch: async () => { g.records.get('a').payload.accountId = 'different-issuer'; return body() } }); t.after(() => g.reporter.dispose())
  safeFailure(await g.reporter.report('a'), 'CATALOG_ACCOUNT_CHANGED'); assert.equal(g.releases, 1)
})

test('10ms timeout aborts cooperative fetch and releases all leases; dispose prevents further work', async () => {
  const started = deferred()
  let aborted = 0
  const f = fixture({ timeoutMs: 10, fetch: async (_url, { signal }) => {
    started.resolve(); return new Promise((_resolve, reject) => signal.addEventListener('abort', () => { aborted++; reject(Error(PRIVATE)) }, { once: true }))
  } })
  const work = f.reporter.report('a'); await started.promise
  safeFailure(await work, 'CATALOG_TIMEOUT'); assert.equal(aborted, 1); assert.equal(f.releases, 1)
  await f.reporter.dispose(); await f.reporter.dispose()
  safeFailure(await f.reporter.report('a'), 'CATALOG_STOPPED'); assert.equal(f.calls.length, 1)
})

test('timeout retains account lease until noncooperative fetch actually settles', async () => {
  const started = deferred(), finish = deferred()
  let signal
  const f = fixture({ timeoutMs: 10, fetch: async (_url, init) => { signal = init.signal; started.resolve(); await finish.promise; return body() } })
  const work = f.reporter.report('a'); await started.promise
  try {
    await delay(30); assert.equal(signal.aborted, true); assert.equal(f.releases, 0); assert.equal(f.leases.get('a'), 1)
  } finally { finish.resolve() }
  safeFailure(await work, 'CATALOG_TIMEOUT'); assert.equal(f.releases, 1)
  await f.reporter.dispose()
})

test('dispose aborts concurrent fetches, waits for their settlement and releases every lease', async () => {
  const started = deferred(), finish = deferred(), signals = []
  const f = fixture({ timeoutMs: 10, fetch: async (_url, { signal }) => { signals.push(signal); if (signals.length === 2) started.resolve(); await finish.promise; return body() } })
  const work = [f.reporter.report('a'), f.reporter.report('b')]; await started.promise
  let disposed = false
  const disposal = f.reporter.dispose().then(() => { disposed = true })
  try { await Promise.resolve(); assert.ok(signals.every(signal => signal.aborted)); assert.equal(disposed, false); assert.equal(f.releases, 0) }
  finally { finish.resolve() }
  for (const report of await Promise.all(work)) safeFailure(report, 'CATALOG_STOPPED')
  await disposal; assert.equal(f.releases, 2); assert.equal(disposed, true)
  safeFailure(await f.reporter.report('a'), 'CATALOG_STOPPED'); assert.equal(f.calls.length, 2)
})

test('10ms timeout/dispose cancel stalled Response body reads without leaking leases', async () => {
  for (const stop of [false, true]) {
    const started = deferred()
    let streamController, cancelled = 0
    const f = fixture({ timeoutMs: 10, fetch: async () => new Response(new ReadableStream({
      start(controller) { streamController = controller },
      pull() { started.resolve() },
      cancel() { cancelled++ },
    }, { highWaterMark: 0 })) })
    const work = f.reporter.report('a'); await started.promise
    const disposal = stop ? f.reporter.dispose() : null
    const sentinel = Symbol('hung')
    let watchdog
    const outcome = await Promise.race([work, new Promise(resolve => { watchdog = setTimeout(() => resolve(sentinel), 200) })])
    clearTimeout(watchdog)
    if (outcome === sentinel) {
      // Unblock a broken implementation so the regression fails without hanging node:test.
      streamController.close(); await work; await f.reporter.dispose()
    } else { await (disposal ?? f.reporter.dispose()) }
    assert.notEqual(outcome, sentinel, 'abort must cancel a pending Response reader.read()')
    safeFailure(outcome, stop ? 'CATALOG_STOPPED' : 'CATALOG_TIMEOUT')
    assert.equal(cancelled, 1); assert.equal(f.releases, 1)
  }
})

test('real shared Accounts blocks removal/rebind while report is in flight and preserves metadata/grants', async () => {
  const maps = { accounts: new Map(), sessions: new Map() }, records = new Map(), reads = []
  let writes = 0
  const domain = { table: name => ({ get: id => maps[name].get(id), entries: () => maps[name].entries(), put: async (id, value) => maps[name].set(id, value), delete: async id => maps[name].delete(id) }), close: async () => {} }
  const credentials = { readRecord: async key => { reads.push(key); return structuredClone(records.get(key)) }, describeRecord: async key => ({ configured: records.has(key) }),
    modifyRecord: async () => { writes++; assert.fail('no refresh') }, deleteRecord: async key => { writes++; records.delete(key) } }
  const accounts = new Accounts({ domain, credentials })
  const a = await accounts.create('Synthetic A'), b = await accounts.create('Synthetic B')
  records.set(accounts.key(a), grant('a')); records.set(accounts.key(b), grant('b'))
  await accounts.select('existing-session', b)
  const snapshot = structuredClone({ maps, records }), started = deferred(), finish = deferred()
  const reporter = createCatalogReporter({ accounts, now: () => NOW, fetch: async (_url, init) => {
    assert.equal(init.headers['chatgpt-account-id'], 'issuer-a'); assert.equal(accounts.activeAccounts.get(a), 1)
    started.resolve(); await finish.promise; return body()
  } })
  const work = reporter.report(a); await started.promise
  try {
    await assert.rejects(accounts.remove(a), { code: 'ACCOUNT_BUSY' })
    const reportSession = [...accounts.activeSessions.keys()].find(id => id.startsWith('catalog-report-'))
    await assert.rejects(accounts.select(reportSession, b), { code: 'SESSION_BUSY' })
    assert.equal(await accounts.resolveSession('existing-session'), b)
    assert.equal(accounts.activeAccounts.get(a), 1)
  } finally { finish.resolve() }
  assert.equal((await work).error, null)
  assert.equal(accounts.activeAccounts.get(a), 0); assert.ok([...accounts.activeSessions.values()].every(value => value === 0))
  assert.equal(writes, 0); assert.deepEqual({ maps, records }, snapshot)
  assert.ok(reads.every(key => key === accounts.key(a)))
  await reporter.dispose()
})

test('installer registers GET-only diagnostics without startup network; returns no-store and safe invalid-account reports', async () => {
  let route, requests = 0, imported = 0
  const disposers = [], f = fixture(), original = globalThis.fetch
  globalThis.fetch = async (url, init) => { requests++; assert.equal(url, CATALOG_REPORT_URL); assert.equal(init.method, 'GET'); return body() }
  let reporter
  try {
    const ctx = { loader: { async import(name) { imported++; assert.equal(name, '@earendil-works/pi-ai/providers/openai-codex'); return { openaiCodexProvider: () => ({ getModels: () => [{ id: 'gpt-6.1-sol' }] }) } } },
      effect(fn) { disposers.push(fn()) }, connection: { fetch: { register(value) { assert.equal(route, undefined); route = value } } } }
    reporter = await installCatalogReport(ctx, f.accounts)
    assert.equal(requests, 0); assert.equal(imported, 1); assert.equal(disposers.length, 1)
    assert.equal(route.path, '/api/chatgpt-catalog-report'); assert.deepEqual(route.methods, ['GET']); assert.equal(route.requestBody, 'buffered')
    for (const suffix of ['', '?accountId=unknown', '?accountId=%3Cscript%3Esecret%3C/script%3E']) {
      const response = await route.fetch(new Request(`http://dsh.internal/api/chatgpt-catalog-report${suffix}`))
      assert.equal(response.status, 200); assert.equal(response.headers.get('cache-control'), 'no-store')
      safeFailure(await response.json(), 'ACCOUNT_NOT_FOUND')
    }
    assert.equal(requests, 0)
    const response = await route.fetch(new Request('http://dsh.internal/api/chatgpt-catalog-report?accountId=a'))
    const result = await response.json()
    assert.equal(response.headers.get('cache-control'), 'no-store'); assert.equal(result.models[0].native, true); assert.equal(requests, 1)
    assert.ok(!JSON.stringify(result).includes('synthetic-access'))
    assert.equal(result.accountId, undefined)
    assert.equal(result.probeCsrfToken, undefined)
    await disposers[0](); safeFailure(await reporter.report('b'), 'CATALOG_STOPPED'); assert.equal(requests, 1)
  } finally { globalThis.fetch = original; await reporter?.dispose(); await f.reporter.dispose() }
})
