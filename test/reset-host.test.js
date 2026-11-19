import test from 'node:test'
import assert from 'node:assert/strict'
import { installResetEndpoint } from '../multi/reset-host.js'

function fixture() {
  let handle, posted = 0, invalidated = 0
  const accounts = {
    assertAccount(id) { if (id !== 'a') throw Object.assign(new Error(), { code: 'ACCOUNT_NOT_FOUND' }) },
    assertIdle(id) { this.assertAccount(id) },
    exclusive: fn => fn(),
    recordStore: () => ({ readRecord: async () => ({ kind: 'grant', payload: { type: 'oauth', accountId: 'synthetic', access: 'synthetic', refresh: 'synthetic', expires: Date.now() + 100000 } }) }),
  }
  const original = globalThis.fetch
  globalThis.fetch = async (_url, options) => {
    if (options.method === 'POST') { posted++; return Response.json({ code: 'reset' }) }
    return Response.json({ available_count: 1, credits: [{ id: 'test-credit', status: 'available', reset_type: 'codex_rate_limits', expires_at: null }] })
  }
  const disposers = []
  const ctx = { effect(fn) { disposers.push(fn()) }, connection: { fetch: { register(route) { handle = route.fetch } } } }
  try { installResetEndpoint(ctx, accounts, { onConsumed() { invalidated++ } }) } finally { globalThis.fetch = original }
  return {
    async token() {
      const response = await handle(new Request('http://dsh.internal/api/chatgpt-resets?accountId=a'))
      return (await response.json()).csrfToken
    },
    async call(body, headers) {
      if (headers === undefined) headers = { origin: 'http://127.0.0.1:49801', 'content-type': 'application/json', 'x-chatgpt-reset-csrf': await this.token(), 'sec-fetch-site': 'same-origin' }
      const response = await handle(new Request('http://dsh.internal/api/chatgpt-resets', { method: 'POST', headers, body: JSON.stringify(body) }))
      return { status: response.status, body: await response.json() }
    },
    close() { disposers.forEach(fn => fn()) },
    get posted() { return posted }, get invalidated() { return invalidated },
  }
}
test('reset HTTP actions reject missing CSRF and cross-site requests before consumption', async () => {
  const f = fixture()
  for (const headers of [{ 'content-type': 'application/json' }, { origin: 'https://evil.invalid', 'content-type': 'application/json' }, { origin: 'http://localhost', 'content-type': 'application/json', 'sec-fetch-site': 'cross-site' }]) {
    assert.equal((await f.call({ action: 'begin', accountId: 'a', creditId: 'test-credit' }, headers)).status, 403)
  }
  assert.equal(f.posted, 0); f.close()
})
test('HTTP consume needs both confirmation stages and a fresh nonce, but no password', async t => {
  const f = fixture()
  t.after(() => f.close())
  const consumeWith = nonce => ({ action: 'consume', accountId: 'a', nonce })
  const one = await f.call({ action: 'begin', accountId: 'a', creditId: 'test-credit' })
  assert.equal(one.body.stage, 1)
  assert.equal((await f.call(consumeWith(one.body.nonce))).body.error, 'RESET_CONFIRMATION_INVALID')
  assert.equal(f.posted, 0)
  const two = await f.call({ action: 'advance', accountId: 'a', nonce: one.body.nonce })
  assert.equal(two.body.stage, 2)
  assert.notEqual(two.body.nonce, one.body.nonce)
  for (const nonce of [undefined, one.body.nonce]) {
    const rejected = await f.call(consumeWith(nonce))
    assert.equal(rejected.status, 400)
    assert.equal(rejected.body.error, 'RESET_CONFIRMATION_INVALID')
  }
  const consume = consumeWith(two.body.nonce)
  const forbidden = await f.call(consume, { 'content-type': 'application/json' })
  assert.equal(forbidden.status, 403)
  assert.equal(forbidden.body.error, 'RESET_CSRF_INVALID')
  assert.equal(f.posted, 0); assert.equal(f.invalidated, 0)
  const final = await f.call(consume)
  assert.equal(final.status, 200)
  assert.equal(final.body.outcome, 'reset'); assert.equal(f.posted, 1); assert.equal(f.invalidated, 1)
  const replay = await f.call(consume)
  assert.deepEqual(replay, final)
  assert.equal(f.posted, 1)
})
test('bridge synthetic origin accepts secret-header requests, including absent browser-only headers', async () => {
  const f = fixture(), token = await f.token()
  const result = await f.call({ action: 'begin', accountId: 'a', creditId: 'test-credit' }, { 'content-type': 'application/json', 'x-chatgpt-reset-csrf': token })
  assert.equal(result.status, 200); assert.equal(result.body.stage, 1); assert.equal(f.posted, 0)
  f.close()
})
test('cross-site and same-site metadata remain forbidden even with a valid token; tokens do not cross instances', async () => {
  const f = fixture(), other = fixture(), token = await f.token()
  for (const site of ['cross-site', 'same-site', 'none']) {
    const result = await f.call({ action: 'begin', accountId: 'a', creditId: 'test-credit' }, { 'content-type': 'application/json', 'x-chatgpt-reset-csrf': token, 'sec-fetch-site': site })
    assert.equal(result.status, 403); assert.equal(result.body.error, 'RESET_CSRF_INVALID')
  }
  assert.equal((await other.call({ action: 'begin', accountId: 'a', creditId: 'test-credit' }, { 'content-type': 'application/json', 'x-chatgpt-reset-csrf': token })).status, 403)
  assert.equal(f.posted, 0); assert.equal(other.posted, 0); f.close(); other.close()
})
test('cancelled HTTP warning cannot progress and bad actions/content types fail closed', async () => {
  const f = fixture()
  const one = await f.call({ action: 'begin', accountId: 'a', creditId: 'test-credit' })
  await f.call({ action: 'cancel', accountId: 'a', nonce: one.body.nonce })
  assert.equal((await f.call({ action: 'advance', accountId: 'a', nonce: one.body.nonce })).status, 400)
  assert.equal((await f.call({ action: 'purchase', accountId: 'a' })).status, 400)
  assert.equal((await f.call({ action: 'consume', accountId: 'a' }, { origin: 'http://localhost', 'content-type': 'text/plain', 'x-chatgpt-reset-csrf': await f.token() })).status, 400)
  assert.equal(f.posted, 0); f.close()
})
