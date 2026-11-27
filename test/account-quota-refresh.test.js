import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Accounts } from '../multi/accounts.js'
import { createAccountQuotaReader } from '../multi/quota.js'
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r }); return { promise, resolve } }

export async function quotaFixture(native = {}) {
  const maps = { accounts: new Map(), sessions: new Map() }, records = new Map(), chains = new Map()
  const domain = { table: name => ({ get: id => maps[name].get(id), entries: () => maps[name].entries(), put: async (id, v) => maps[name].set(id, v), delete: async id => maps[name].delete(id) }), close: async () => {} }
  const credentials = { readRecord: async key => structuredClone(records.get(key)), describeRecord: async key => ({ configured: records.has(key) }), deleteRecord: async key => records.delete(key),
    modifyRecord(key, fn) { const op = (chains.get(key) ?? Promise.resolve()).then(async () => { const next = await fn(structuredClone(records.get(key))); if (next !== undefined) records.set(key, next); return structuredClone(records.get(key)) }); chains.set(key, op.catch(() => {})); return op } }
  const accounts = new Accounts({ domain, credentials })
  const id = await accounts.create('synthetic'), other = await accounts.create('other')
  const grant = accountId => ({ kind: 'grant', payload: { type: 'oauth', access: 'old', refresh: 'refresh', expires: 1, accountId } })
  records.set(accounts.key(id), grant('issuer')); records.set(accounts.key(other), grant('other-issuer'))
  const beforeOther = structuredClone(records.get(accounts.key(other)))
  const stats = { refresh: 0, usage: 0 }, state = { now: Date.now(), reject: false, hold: null, expired: false }
  const oauth = { async refresh(old) { stats.refresh++; if (state.hold) { state.hold.started.resolve(); await state.hold.finish.promise } if (state.reject) throw state.reject; return { ...old, access: 'new', refresh: 'rotated', expires: state.expired ? 1 : Date.now() + 3600000 } } }
  const createModels = native.createModels ?? (({ credentials: c }) => ({ setProvider() {}, async getAuth(_provider, { signal }) {
    const work = c.modify('openai-codex', async current => current.expires > Date.now() ? undefined : oauth.refresh(current))
    return Promise.race([work.then(() => ({ source: 'OAuth' })), new Promise((_, reject) => { signal.addEventListener('abort', () => reject(signal.reason), { once: true }) })])
  } }))
  const openaiCodexProvider = () => {
    if (!native.openaiCodexProvider) return {}
    const provider = native.openaiCodexProvider(); provider.auth = { ...provider.auth, oauth: { ...provider.auth.oauth, refresh: oauth.refresh } }; return provider
  }
  const reader = createAccountQuotaReader({ accounts, id, createModels, openaiCodexProvider, now: () => state.now, cacheTtlMs: native.cacheTtlMs ?? 0,
    fetch: native.fetch ?? (async (_url, init) => { stats.usage++; assert.equal(init.headers.authorization, 'Bearer new'); return Response.json({ plan_type: 'plus' }) }) })
  return { accounts, id, other, records, beforeOther, stats, state, reader }
}

test('expired quota uses one native auth resolution, then usage, only for its own account', async () => {
  const f = await quotaFixture()
  const values = await Promise.all(Array.from({ length: 5 }, () => f.reader.read(true)))
  assert.ok(values.every(x => x.status === 'logged-in'))
  assert.equal(f.stats.refresh, 1)
  assert.equal(f.stats.usage, 5)
  assert.deepEqual(f.records.get(f.accounts.key(f.other)), f.beforeOther)
  assert.equal(f.accounts.activeAccounts.get(f.id), 0)
  assert.equal(f.accounts.activeSessions.size, 1, 'bounded fixed quota lease key')
  f.reader.dispose()
})

test('temporary and recognized revoked refresh failures are throttled even on forced reads', async () => {
  for (const [error, code] of [[new Error('network token secret'), 'quota-refresh-failed'], [new Error('OpenAI Codex token refresh failed (400): {"error":{"code":"refresh_token_reused"}}'), 'quota-reauth-required']]) {
    const f = await quotaFixture(); f.state.reject = error
    for (let n = 0; n < 5; n++) assert.equal((await f.reader.read(true)).message, code)
    assert.equal(f.stats.refresh, 1); assert.equal(f.stats.usage, 0)
    f.state.now += 60001
    assert.equal((await f.reader.read(true)).message, code)
    assert.equal(f.stats.refresh, 2)
    assert.doesNotMatch(JSON.stringify(await f.reader.read()), /secret|refresh_token_reused/)
    f.reader.dispose()
  }
})

test('native refresh returning an expired rotated token is throttled as a failed refresh', async () => {
  const f = await quotaFixture(); f.state.expired = true
  for (let n = 0; n < 4; n++) assert.equal((await f.reader.read(true)).message, 'quota-refresh-failed')
  assert.equal(f.stats.refresh, 1); assert.equal(f.stats.usage, 0)
  f.reader.dispose()
})

test('missing refresh grant requires login without calling native auth or usage', async () => {
  const f = await quotaFixture(); delete f.records.get(f.accounts.key(f.id)).payload.refresh
  assert.equal((await f.reader.read()).message, 'quota-reauth-required')
  assert.equal(f.stats.refresh, 0); assert.equal(f.stats.usage, 0)
})

test('unload keeps lease until noncooperative native rotation is persisted and suppresses usage', async () => {
  const f = await quotaFixture(); f.state.hold = { started: deferred(), finish: deferred() }
  const read = f.reader.read(); await f.state.hold.started.promise
  await assert.rejects(f.accounts.remove(f.id), { code: 'ACCOUNT_BUSY' })
  f.reader.dispose()
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(f.accounts.activeAccounts.get(f.id), 1)
  f.state.hold.finish.resolve()
  assert.equal((await read).message, 'quota-stopped')
  assert.equal(f.records.get(f.accounts.key(f.id)).payload.refresh, 'rotated')
  assert.equal(f.accounts.activeAccounts.get(f.id), 0)
  assert.equal(f.stats.usage, 0)
})

test('a fresh access grant never refreshes on quota refusal, Cloudflare or rate limiting', async () => {
  for (const [status, headers, code] of [[401, {}, 'quota-token-rejected'], [403, { 'cf-mitigated': 'challenge' }, 'quota-blocked'], [429, {}, 'quota-throttled']]) {
    let usage = 0
    const f = await quotaFixture({ fetch: async () => { usage++; return new Response('', { status, headers }) } })
    f.records.get(f.accounts.key(f.id)).payload.expires = Date.now() + 3600000
    assert.equal((await f.reader.read(true)).message, code)
    assert.equal(f.stats.refresh, 0); assert.equal(usage, 1)
    f.reader.dispose()
  }
})

test('issuer replacement invalidates fresh cached windows and a response in flight', async () => {
  let f, calls = 0
  const hold = { started: deferred(), finish: deferred() }
  f = await quotaFixture({ cacheTtlMs: 60000, fetch: async () => {
    calls++
    if (calls === 1) return Response.json({ plan_type: 'plus' })
    hold.started.resolve(); await hold.finish.promise
    return Response.json({ plan_type: 'pro' })
  } })
  assert.equal((await f.reader.read()).planType, 'plus')
  f.records.get(f.accounts.key(f.id)).payload.accountId = 'new-issuer'
  const read = f.reader.read()
  await hold.started.promise
  assert.equal(calls, 2, 'old issuer cache was not used')
  f.records.get(f.accounts.key(f.id)).payload.accountId = 'third-issuer'
  hold.finish.resolve()
  const result = await read
  assert.equal(result.message, 'quota-unavailable'); assert.equal(result.planType, null)
  f.reader.dispose()
})

test('a malformed refreshed identity never overwrites the selected account', async () => {
  const f = await quotaFixture({ createModels: ({ credentials }) => ({ setProvider() {}, async getAuth() { await credentials.modify('openai-codex', async x => ({ ...x, accountId: 'foreign', access: 'new' })); return {} } }) })
  assert.equal((await f.reader.read()).message, 'quota-refresh-failed')
  assert.equal(f.records.get(f.accounts.key(f.id)).payload.accountId, 'issuer')
  assert.equal(f.stats.usage, 0)
})
