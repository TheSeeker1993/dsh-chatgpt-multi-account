import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ModelCatalog, reasoningForModel } from '../multi/catalog.js'

const model = (id = 'synthetic-sol') => ({ id, name: id, provider: 'openai-codex', api: 'openai-codex-responses', baseUrl: 'https://chatgpt.com/backend-api', type: 'chat', reasoning: true, input: ['text'], cost: { input: 1, output: 2, cacheRead: 0, cacheWrite: 0 }, contextWindow: 10000, maxTokens: 1000, thinkingLevelMap: { low: 'low', high: 'high' } })
const row = (slug = 'synthetic-sol', extra = {}) => ({ slug, display_name: slug, visibility: 'list', supported_reasoning_levels: [{ effort: 'low' }], default_reasoning_level: 'low', ...extra })
const response = rows => Response.json({ models: rows })
function setup(fetcher) {
  let time = 1000, calls = 0, leases = 0, principal = 'principal-one', changed = 0
  const catalog = new ModelCatalog({ nativeModels: [model()], now: () => time, onChanged: () => changed++,
    accounts: { acquireAccount: async (session, id) => { assert.equal(session, `catalog-${id}`); leases++; return { release: () => leases-- } } },
    authenticate: async id => ({ access: `fake-${id}`, accountId: `issuer-${id}`, identity: principal }),
    fetch: async (url, opts) => { calls++; assert.equal(url, 'https://chatgpt.com/backend-api/codex/models?client_version=0.166.0'); assert.equal(opts.method, 'GET'); assert.equal(opts.redirect, 'error'); assert.match(opts.headers.Authorization, /^Bearer fake-/); return fetcher(url, opts) },
  })
  return { catalog, calls: () => calls, leases: () => leases, changed: () => changed, tick: n => { time += n }, principal: p => { principal = p } }
}

test('ETag is retained safely, bounded to 512 characters, without conditional requests', async () => {
  let tag = 'W/"synthetic-v1"'
  const f = setup((_url, opts) => {
    assert.equal(Object.keys(opts.headers).some(key => key.toLowerCase() === 'if-none-match'), false)
    return Response.json({ models: [row()] }, { headers: { ETag: tag } })
  })
  assert.equal((await f.catalog.refresh('a')).etag, tag)
  assert.equal(f.catalog.cached('a').etag, tag)
  tag = 'x'.repeat(512)
  assert.equal((await f.catalog.refresh('a')).etag, tag)
  tag = 'x'.repeat(513)
  assert.equal((await f.catalog.refresh('a')).etag, null)
  assert.equal(f.catalog.cached('a').freshness, 'fresh')
})

test('malformed reasoning or context disables only its row without discarding valid models', async () => {
  const malformed = [
    row('bad-reasoning', { supported_reasoning_levels: { effort: 'low' } }),
    row('null-reasoning', { supported_reasoning_levels: null }),
    row('decimal-context', { context_window: 1000.5 }),
    row('string-context', { context_window: '10000' }),
    row('negative-context', { context_window: -1 }),
    row('huge-context', { context_window: 100000001 }),
  ]
  const f = setup(() => response([row(), ...malformed]))
  f.catalog.setManual(malformed.map(r => model(r.slug)))
  const view = await f.catalog.refresh('a')
  assert.equal(view.error, null)
  assert.equal(view.freshness, 'fresh')
  assert.equal(view.models.length, malformed.length + 1)
  assert.equal(view.models[0].compatible, true)
  for (const candidate of view.models.slice(1)) {
    assert.equal(candidate.compatible, false, candidate.id)
    await assert.rejects(f.catalog.available('a', candidate.id), { code: 'CATALOG_INCOMPATIBLE' })
  }
  assert.equal((await f.catalog.available('a', 'synthetic-sol')).id, 'synthetic-sol')
})

test('manual capacities reject decimals and unsafe sizes atomically', () => {
  const f = setup(() => response([row()]))
  f.catalog.setManual([model('retained')])
  for (const key of ['contextWindow', 'maxTokens']) {
    for (const value of [1.5, 0, -1, 100000001, Number.MAX_SAFE_INTEGER + 1, Infinity, '1000']) {
      assert.throws(() => f.catalog.setManual([{ ...model('invalid-capacity'), [key]: value }]), { code: 'CATALOG_INVALID_MODEL' })
      assert.deepEqual(f.catalog.manualModels.map(m => m.id), ['retained'])
    }
  }
  f.catalog.setManual([{ ...model('upper-bound'), contextWindow: 100000000, maxTokens: 100000000 }])
  assert.equal(f.catalog.manualModels[0].contextWindow, 100000000)
})

test('account isolation, exact safe GET, immutable snapshots and per-model narrowing', async () => {
  const f = setup((_u, o) => response([row(o.headers['chatgpt-account-id'] === 'issuer-b' ? 'unknown-b' : undefined)]))
  const a = await f.catalog.refresh('a'), b = await f.catalog.refresh('b')
  assert.equal(a.models[0].compatible, true)
  assert.equal(b.models[0].compatible, false)
  assert.equal(b.models[0].id, 'unknown-b')
  assert.equal(JSON.stringify(a).includes('fake-'), false)
  const native = await f.catalog.available('a', 'synthetic-sol')
  assert.equal(native.maxTokens, 1000)
  assert.equal(native.thinkingLevelMap.high, null)
  assert.throws(() => native.input.push('image'), TypeError)
  assert.throws(() => a.models.push({}), TypeError)
  assert.equal(f.leases(), 0)
})

test('deduplicates same-account requests and holds lease until noncooperative fetch settles', async () => {
  let finish
  const f = setup(() => new Promise(resolve => { finish = resolve }))
  const a = f.catalog.refresh('a'), b = f.catalog.refresh('a')
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(f.calls(), 1); assert.equal(f.leases(), 1)
  finish(response([row()]))
  assert.deepEqual(await a, await b)
  assert.equal(f.leases(), 0)
})

test('empty/schema/JSON errors preserve last good data as stale and available fails closed', async () => {
  let result = response([row()])
  const f = setup(() => result)
  await f.catalog.refresh('a')
  for (const bad of [response([]), Response.json({ data: [] }), new Response('{bad')]) {
    result = bad
    const view = await f.catalog.refresh('a')
    assert.equal(view.freshness, 'stale'); assert.equal(view.models.length, 1)
  }
  await assert.rejects(f.catalog.available('a', 'synthetic-sol'), { code: 'CATALOG_STALE' })
})

test('TTL expiration is stale and refreshed by available', async () => {
  const f = setup(() => response([row()]))
  await f.catalog.refresh('a'); f.tick(300000)
  assert.equal(f.catalog.cached('a').freshness, 'stale')
  await f.catalog.available('a', 'synthetic-sol')
  assert.equal(f.calls(), 2)
})

test('rate limiting backoff cannot be bypassed by force and respects bounded Retry-After', async () => {
  const f = setup(() => new Response('', { status: 429, headers: { 'Retry-After': '999999' } }))
  const a = await f.catalog.refresh('a')
  assert.equal(a.error, 'CATALOG_RATE_LIMITED'); assert.equal(a.nextRetryAt, 301000)
  await f.catalog.refresh('a', { force: true }); assert.equal(f.calls(), 1)
  f.tick(300000); await f.catalog.refresh('a'); assert.equal(f.calls(), 2)
})

for (const [name, fetcher, code] of [
  ['network', () => { throw new Error('fake-secret') }, 'CATALOG_NETWORK_ERROR'],
  ['500', () => new Response('fake-secret', { status: 500 }), 'CATALOG_SERVER_ERROR'],
  ['401', () => new Response('fake-secret', { status: 401 }), 'CATALOG_AUTH_FAILED'],
  ['403', () => new Response('fake-secret', { status: 403 }), 'CATALOG_AUTH_FAILED'],
  ['redirect', () => new Response('fake-secret', { status: 302 }), 'CATALOG_REDIRECT'],
  ['oversize', () => new Response(' '.repeat(1048577)), 'CATALOG_TOO_LARGE'],
]) test(`safe ${name} status`, async () => {
  const f = setup(fetcher); const view = await f.catalog.refresh('a')
  assert.equal(view.error, code); assert.equal(JSON.stringify(view).includes('fake-secret'), false); assert.equal(f.leases(), 0)
})

test('mixed invalid rows do not wipe valid models, hidden omitted, unknown and tool contracts disabled', async () => {
  const f = setup(() => response([null, {}, row(), row('hidden', { visibility: 'hide' }), row('unknown'), row('lite', { use_responses_lite: true }), row('visibility', { visibility: 'future' })]))
  const view = await f.catalog.refresh('a')
  assert.deepEqual(view.models.map(x => x.id), ['synthetic-sol', 'unknown', 'lite', 'visibility'])
  assert.equal(view.models[0].compatible, true)
  assert.equal(view.models.slice(1).every(x => !x.compatible), true)
})

test('manual new ID is metadata only until server confirms, then resolves exact full definition', async () => {
  let rows = [row()]
  const f = setup(() => response(rows))
  f.catalog.setManual([model('brand-new-sol')])
  assert.equal(f.catalog.knownModels().length, 2)
  await f.catalog.refresh('a')
  await assert.rejects(f.catalog.available('a', 'brand-new-sol'), { code: 'CATALOG_UNAVAILABLE' })
  rows = [row('brand-new-sol')]; await f.catalog.refresh('a')
  assert.equal((await f.catalog.available('a', 'brand-new-sol')).id, 'brand-new-sol')
  for (const bad of [{ ...model('x'), baseUrl: 'https://evil.invalid' }, { ...model('x'), headers: {} }, { id: 'unknown-only' }, { ...model('x'), cost: { input: Infinity } }]) {
    assert.throws(() => f.catalog.setManual([bad]), { code: 'CATALOG_INVALID_MODEL' })
  }
})

test('principal identity replacement drops old entitlement even when new fetch fails', async () => {
  let bad = false
  const f = setup(() => bad ? new Response('', { status: 401 }) : response([row()]))
  await f.catalog.refresh('a'); bad = true; f.principal('new-principal')
  const view = await f.catalog.refresh('a')
  assert.equal(view.freshness, 'empty'); assert.equal(view.models.length, 0)
  f.catalog.invalidate('a'); assert.equal(f.catalog.cached('a').error, null)
})

test('server default effort prefers exact low over native minimal alias', async () => {
  const f = setup(() => response([row()]))
  f.catalog.setManual([{ id: 'synthetic-sol', thinkingLevelMap: { minimal: 'low', low: 'low', high: 'high' } }])
  const view = await f.catalog.refresh('a')
  assert.deepEqual(view.models[0].reasoning.efforts.map(e => e.id), ['minimal', 'low'])
  assert.equal(view.models[0].reasoning.defaultEffort, 'low')
})

test('native cost tiers preserve omitted optional cacheWrite', () => {
  const f = setup(() => response([row()]))
  f.catalog.setManual([{ ...model('tiered'), cost: { ...model().cost, tiers: [{ inputTokensAbove: 272000, input: 4, output: 15, cacheRead: 0.2 }] } }])
  assert.equal(f.catalog.manualModels[0].cost.tiers[0].input, 4)
})

test('native reasoning follows DSH implicit levels and explicit null opt-outs', () => {
  assert.deepEqual(reasoningForModel({ reasoning: true, thinkingLevelMap: { minimal: 'low', xhigh: 'xhigh', off: null } }).efforts.map(x => x.id), ['minimal', 'low', 'medium', 'high', 'xhigh'])
  assert.deepEqual(reasoningForModel({ reasoning: false }).efforts.map(x => x.id), ['off'])
  assert.equal(reasoningForModel({ reasoning: true }).defaultEffort, 'medium')
})

test('explicit manual replacement does not silently union removed bundled metadata', async () => {
  const f = setup(() => response([row(), row('manual-only')]))
  f.catalog.setManual([model('manual-only')], { replace: true })
  assert.deepEqual(f.catalog.knownModels().map(x => x.id), ['manual-only'])
  assert.equal(f.catalog.manualModels[0].id, 'manual-only')
  const view = await f.catalog.refresh('a')
  assert.equal(view.models.find(x => x.id === 'synthetic-sol').compatible, false)
  f.catalog.setManual([])
  assert.equal(f.catalog.knownModels()[0].id, 'synthetic-sol')
})

test('15-second timeout yields safe status without leaking fetch error', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const f = setup((_url, opts) => new Promise((_resolve, reject) => opts.signal.addEventListener('abort', () => reject(new Error('private-timeout')), { once: true })))
  const pending = f.catalog.refresh('a')
  await new Promise(resolve => setImmediate(resolve))
  t.mock.timers.tick(15000)
  const view = await pending
  assert.equal(view.error, 'CATALOG_TIMEOUT')
  assert.equal(JSON.stringify(view).includes('private-timeout'), false)
  assert.equal(f.leases(), 0)
})

test('caller cancellation aborts fetch and releases its lease after it settles', async () => {
  const f = setup((_url, opts) => new Promise((_resolve, reject) => opts.signal.addEventListener('abort', () => reject(new Error('private')), { once: true })))
  const controller = new AbortController()
  const pending = f.catalog.refresh('a', { signal: controller.signal })
  await new Promise(resolve => setImmediate(resolve))
  controller.abort()
  assert.equal((await pending).error, 'CATALOG_ABORTED')
  assert.equal(f.leases(), 0)
})

test('dispose aborts and prevents late publication while retaining lease until settle', async () => {
  let finish
  const f = setup(() => new Promise(resolve => { finish = resolve }))
  const pending = f.catalog.refresh('a')
  await new Promise(resolve => setImmediate(resolve))
  f.catalog.dispose(); const version = f.catalog.cached('a').version
  assert.equal(f.leases(), 1)
  finish(response([row()]))
  await assert.rejects(pending, { code: 'CATALOG_DISPOSED' })
  assert.equal(f.leases(), 0); assert.equal(f.catalog.cached('a').version, version)
  assert.equal(f.catalog.cached('a').models.length, 0)
})
