import test from 'node:test'
import assert from 'node:assert/strict'
import { Resets, RESET_CREDITS_URL } from '../multi/resets.js'
import { Accounts } from '../multi/accounts.js'

function fixture() {
  let now = Date.parse('2026-06-20T00:00:00Z'), busy = false, posts = 0, gets = 0
  const records = new Map(['a', 'b'].map(id => [id, { kind: 'grant', payload: { type: 'oauth', accountId: `issuer-${id}`, access: `secret-${id}`, refresh: `refresh-${id}`, expires: now + 1e9 } }]))
  const credit = { id: 'credit-1', reset_type: 'codex_rate_limits', status: 'available', expires_at: '2026-07-17T00:00:00Z', profile_user_id: 'PRIVATE', title: 'PRIVATE' }
  let body = { available_count: 1, credits: [credit] }, result = { code: 'reset', secret: 'PRIVATE' }, failure = null
  const calls = []
  let tail = Promise.resolve()
  const accounts = {
    authorizing: new Set(),
    isAuthorizing: () => false,
    assertAccount(id) { assert.ok(records.has(id), 'unknown account') },
    assertIdle(id) { this.assertAccount(id); if (busy) { const error = new Error('ACCOUNT_BUSY'); error.code = 'ACCOUNT_BUSY'; throw error } },
    recordStore(id) { return { readRecord: async () => structuredClone(records.get(id)) } },
    exclusive(fn) { const next = tail.then(fn); tail = next.catch(() => {}); return next },
  }
  const service = new Resets({ accounts, now: () => now, fetch: async (url, options) => {
    calls.push({ url, ...options })
    if (options.method === 'POST') { posts++; if (failure) throw Error('secret backend body'); return { ok: true, json: async () => result } }
    gets++; if (failure) throw Error('secret backend body')
    return { ok: true, json: async () => structuredClone(body) }
  } })
  return { service, records, credit, calls, setBusy: value => { busy = value }, tick: value => { now += value }, setFailure: value => { failure = value }, setBody: value => { body = value }, setResult: value => { result = value }, get posts() { return posts }, get gets() { return gets } }
}
const code = expected => error => error.code === expected
async function confirm(f, id = 'a') { const first = await f.service.begin(id, 'credit-1'); return f.service.advance(id, first.nonce) }

test('list whitelists, caches per account, force refreshes and GET works busy', async () => {
  const f = fixture(); f.setBusy(true)
  const view = await f.service.list('a')
  assert.deepEqual(view, { accountId: 'a', availableCount: 1, credits: [{ id: 'credit-1', resetType: 'codex_rate_limits', status: 'available', expiresAt: '2026-07-17T00:00:00.000Z' }], fetchedAt: Date.parse('2026-06-20T00:00:00Z'), freshness: 'fresh', error: null })
  view.credits[0].id = 'tampered'
  assert.equal((await f.service.list('a')).credits[0].id, 'credit-1'); assert.equal(f.gets, 1)
  await f.service.list('b'); await f.service.list('a', true); assert.equal(f.gets, 3)
  assert.equal(f.calls[0].url, RESET_CREDITS_URL)
  assert.equal(f.calls[0].headers.originator, 'dsh-chatgpt-multi-account')
  assert.equal(f.calls[0].headers['OAI-Product-Sku'], 'CODEX')
  assert.equal(f.calls[1].headers['chatgpt-account-id'], 'issuer-b')
})
test('failed and unknown payload reads report null, not zero or stale count', async () => {
  const f = fixture(); await f.service.list('a'); f.setFailure(true)
  assert.deepEqual(await f.service.list('a', true), { accountId: 'a', availableCount: null, credits: [], fetchedAt: null, freshness: 'empty', error: 'RESET_NETWORK' })
  f.setFailure(false); f.credit.reset_type = 'paid_purchase'
  assert.equal((await f.service.list('a', true)).availableCount, null)
  await assert.rejects(f.service.begin('a', 'credit-1'), code('RESET_PAYLOAD')); assert.equal(f.posts, 0)
})
test('requires two distinct stages, exact account and selected credit; duplicate POST never dispatched', async () => {
  const f = fixture(), first = await f.service.begin('a', 'credit-1')
  await assert.rejects(f.service.consume('a', first.nonce), code('RESET_CONFIRMATION_INVALID'))
  await assert.rejects(f.service.advance('b', first.nonce), code('RESET_CONFIRMATION_INVALID'))
  const final = await f.service.advance('a', first.nonce)
  assert.notEqual(final.nonce, first.nonce)
  await assert.rejects(f.service.advance('a', first.nonce), code('RESET_CONFIRMATION_INVALID'))
  const results = await Promise.all([f.service.consume('a', final.nonce), f.service.consume('a', final.nonce)])
  assert.deepEqual(results[0], { accountId: 'a', creditId: 'credit-1', outcome: 'reset' }); assert.deepEqual(results[0], results[1]); assert.equal(f.posts, 1)
  const post = f.calls.find(call => call.method === 'POST')
  assert.equal(post.url, `${RESET_CREDITS_URL}/consume`)
  assert.equal(post.redirect, 'error')
  const payload = JSON.parse(post.body); assert.equal(payload.credit_id, 'credit-1'); assert.match(payload.redeem_request_id, /^[\da-f-]{36}$/)
  assert.deepEqual(Object.keys(payload).sort(), ['credit_id', 'redeem_request_id'])
})
test('new begin, abort and expiry revoke previous confirmation', async () => {
  const f = fixture(), first = await confirm(f), second = await f.service.begin('a', 'credit-1')
  await assert.rejects(f.service.consume('a', first.nonce), code('RESET_CONFIRMATION_INVALID'))
  await f.service.abort('a', second.nonce)
  await assert.rejects(f.service.advance('a', second.nonce), code('RESET_CONFIRMATION_INVALID'))
  const final = await confirm(f); f.tick(60_001)
  await assert.rejects(f.service.consume('a', final.nonce), code('RESET_CONFIRMATION_EXPIRED')); assert.equal(f.posts, 0)
})
test('fresh availability validation blocks changed or expired credits', async () => {
  for (const change of [f => { f.credit.status = 'redeemed' }, f => { f.credit.expires_at = '2026-06-19T00:00:00Z' }, f => f.setBody({ available_count: 0, credits: [] })]) {
    const f = fixture(), final = await confirm(f); change(f)
    await assert.rejects(f.service.consume('a', final.nonce), code('RESET_CREDIT_UNAVAILABLE')); assert.equal(f.posts, 0)
    await assert.rejects(f.service.consume('a', final.nonce), code('RESET_CONFIRMATION_INVALID'))
  }
})
test('issuer/refresh changes revoke consent; access rotation does not', async () => {
  for (const field of ['accountId', 'refresh']) {
    const f = fixture(), final = await confirm(f); f.records.get('a').payload[field] = 'changed'
    await assert.rejects(f.service.consume('a', final.nonce), code('RESET_ACCOUNT_CHANGED')); assert.equal(f.posts, 0)
  }
  const f = fixture(), final = await confirm(f); f.records.get('a').payload.access = 'rotated'
  assert.equal((await f.service.consume('a', final.nonce)).outcome, 'reset')
})
test('busy account permits both confirmations and exactly one consume', async () => {
  const f = fixture(); f.setBusy(true)
  const final = await confirm(f)
  assert.equal((await f.service.consume('a', final.nonce)).outcome, 'reset')
  assert.equal((await f.service.consume('a', final.nonce)).outcome, 'reset')
  assert.equal(f.posts, 1)
})
test('expired grants block mutation without refreshing', async () => {
  const f = fixture(), final = await confirm(f)
  f.records.get('a').payload.expires = 1
  await assert.rejects(f.service.consume('a', final.nonce), code('RESET_TOKEN_EXPIRED'))
  assert.equal((await f.service.list('a', true)).error, 'RESET_TOKEN_EXPIRED'); assert.equal(f.posts, 0)
})
test('authorization blocks every mutation through either authorization guard', async () => {
  for (const guard of ['authorizing', 'isAuthorizing']) {
    for (const stage of ['begin', 'advance', 'consume']) {
      const f = fixture(); f.setBusy(true)
      const pending = stage === 'advance' ? await f.service.begin('a', 'credit-1') : stage === 'consume' ? await confirm(f) : null
      if (guard === 'authorizing') f.service.accounts.authorizing.add('a')
      else f.service.accounts.isAuthorizing = id => id === 'a'
      await assert.rejects(f.service[stage]('a', pending?.nonce ?? 'credit-1'), code('LOGIN_IN_PROGRESS'))
      assert.equal(f.posts, 0)
    }
  }
})
test('dispatch rechecks account and authorization after asynchronous validation', async () => {
  for (const change of ['remove', 'authorizing', 'isAuthorizing']) {
    const f = fixture(), final = await confirm(f)
    const original = f.service.identity.bind(f.service)
    let reads = 0
    f.service.identity = async id => {
      const identity = await original(id)
      if (++reads === 2) {
        if (change === 'remove') f.records.delete(id)
        else if (change === 'authorizing') f.service.accounts.authorizing.add(id)
        else f.service.accounts.isAuthorizing = () => true
      }
      return identity
    }
    await assert.rejects(f.service.consume('a', final.nonce), change === 'remove' ? /unknown account/ : code('LOGIN_IN_PROGRESS'))
    assert.equal(f.posts, 0)
    await assert.rejects(f.service.consume('a', final.nonce))
    assert.equal(f.posts, 0)
  }
})
test('unknown POST outcome is terminal and cached, never automatically replayed', async () => {
  const f = fixture(), final = await confirm(f)
  // Allow the immediately-before-consume GET; fail only synthetic POST.
  const original = f.service.http
  f.service.http = async (url, options) => { if (options.method === 'POST') { f.setFailure(true) }; return original(url, options) }
  assert.equal((await f.service.consume('a', final.nonce)).outcome, 'unknown')
  assert.equal((await f.service.consume('a', final.nonce)).outcome, 'unknown'); assert.equal(f.posts, 1)
  f.setFailure(false); assert.equal((await f.service.list('a')).availableCount, 1)
})
test('real Accounts retains active lease and running binding during manual reset', async () => {
  const maps = { accounts: new Map(), sessions: new Map() }, records = new Map()
  const domain = { table: name => ({ get: id => maps[name].get(id), entries: () => maps[name].entries(), put: async (id, value) => maps[name].set(id, value), delete: async id => maps[name].delete(id) }), close: async () => {} }
  const credentials = {
    readRecord: async key => structuredClone(records.get(key)),
    describeRecord: async key => ({ configured: records.has(key) }),
    deleteRecord: async key => records.delete(key),
  }
  let running = false
  const accounts = new Accounts({ domain, credentials, isSessionBusy: () => running })
  const a = await accounts.create('Synthetic A'), b = await accounts.create('Synthetic B')
  const f = fixture()
  for (const id of [a, b]) records.set(accounts.key(id), structuredClone(f.records.get('a')))
  await accounts.select('session-a', a)
  const lease = await accounts.acquireSession('session-a')
  running = true
  f.service.accounts = accounts
  try {
    const final = await confirm(f, a)
    const original = f.service.http
    f.service.http = async (url, options) => {
      if (options.method === 'POST') {
        assert.equal(accounts.activeAccounts.get(a), 1)
        assert.equal(accounts.activeSessions.get('session-a'), 1)
        assert.equal(await accounts.resolveSession('session-a'), a)
      }
      return original(url, options)
    }
    assert.equal((await f.service.consume(a, final.nonce)).outcome, 'reset')
    assert.equal(f.posts, 1)
    assert.equal(accounts.activeAccounts.get(a), 1)
    assert.equal(accounts.activeSessions.get('session-a'), 1)
    await assert.rejects(accounts.remove(a), code('ACCOUNT_BUSY'))
    await assert.rejects(accounts.select('session-a', b), code('SESSION_BUSY'))
    assert.equal(await accounts.resolveSession('session-a'), a)
    // The running-session guard remains after the network lease is released.
    lease.release()
    await assert.rejects(accounts.remove(a), code('ACCOUNT_BUSY'))
    await assert.rejects(accounts.select('session-a', b), code('SESSION_BUSY'))
    assert.equal(await accounts.resolveSession('session-a'), a)
    running = false
    await accounts.select('session-a', b)
    await accounts.remove(a)
    assert.equal(await accounts.resolveSession('session-a'), b)
  } finally { lease.release(); f.service.close(); await accounts.close() }
})
test('only official consume codes are exposed; response bodies never leak', async () => {
  for (const outcome of ['nothing_to_reset', 'no_credit', 'already_redeemed', 'unknown']) {
    const f = fixture(), final = await confirm(f); f.setResult({ code: outcome, details: 'PRIVATE' })
    const result = await f.service.consume('a', final.nonce)
    assert.equal(result.outcome, outcome); assert.ok(!JSON.stringify(result).includes('PRIVATE')); assert.equal(f.posts, 1)
  }
})
