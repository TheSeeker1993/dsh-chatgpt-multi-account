import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Accounts, LEGACY_KEY } from '../multi/accounts.js'
function fixture() {
  const maps = { accounts: new Map(), sessions: new Map() }, records = new Map()
  const domain = { table: name => ({ get: id => maps[name].get(id), entries: () => maps[name].entries(), put: async (id, value) => maps[name].set(id, value), delete: async id => maps[name].delete(id) }), close: async () => {} }
  const chains = new Map()
  const credentials = {
    readRecord: async key => structuredClone(records.get(key)),
    describeRecord: async key => ({ configured: records.has(key) }),
    deleteRecord: async key => records.delete(key),
    modifyRecord(key, mutate) {
      const work = (chains.get(key) ?? Promise.resolve()).then(async () => {
        const value = await mutate(structuredClone(records.get(key)))
        if (value !== undefined) records.set(key, value)
        return structuredClone(records.get(key))
      })
      chains.set(key, work.catch(() => {})); return work
    },
  }
  let busy = false
  return { accounts: new Accounts({ domain, credentials, isSessionBusy: () => busy }), domain, credentials, records, maps, busy: value => { busy = value } }
}
async function signed(f, label) {
  const id = await f.accounts.create(label)
  await f.accounts.credentialStore(id).modify('openai-codex', async () => ({ type: 'oauth', access: label, refresh: `refresh-${label}`, accountId: label, expires: 1 }))
  return id
}
test('accounts isolate concurrent refreshes and session bindings', async () => {
  const f = fixture(), a = await signed(f, 'A'), b = await signed(f, 'B')
  await Promise.all([f.accounts.select('s-a', a), f.accounts.select('s-b', b)])
  await Promise.all([f.accounts.credentialStore(a).modify('openai-codex', old => ({ ...old, access: 'new-A' })), f.accounts.credentialStore(b).modify('openai-codex', old => ({ ...old, access: 'new-B' }))])
  assert.equal(await f.accounts.resolveSession('s-a'), a)
  assert.equal(await f.accounts.resolveSession('s-b'), b)
  assert.equal((await f.accounts.credentialStore(a).read('openai-codex')).access, 'new-A')
  assert.equal((await f.accounts.credentialStore(b).read('openai-codex')).access, 'new-B')
  assert.doesNotMatch(JSON.stringify(await f.accounts.snapshot('s-a')), /refresh-|new-A|new-B/)
})
test('binding survives reopening and never falls back for missing selection', async () => {
  const f = fixture(), id = await signed(f, 'A')
  await f.accounts.select('s-a', id)
  const reopened = new Accounts({ domain: f.domain, credentials: f.credentials })
  assert.equal(await reopened.resolveSession('s-a'), id)
  await assert.rejects(reopened.resolveSession('s-b'), { code: 'SESSION_ACCOUNT_REQUIRED' })
})
test('active lease blocks rebinding/removal and release is idempotent', async () => {
  const f = fixture(), a = await signed(f, 'A'), b = await signed(f, 'B')
  await f.accounts.select('s-a', a)
  const lease = await f.accounts.acquireSession('s-a')
  await assert.rejects(f.accounts.select('s-a', b), { code: 'SESSION_BUSY' })
  await assert.rejects(f.accounts.remove(a), { code: 'ACCOUNT_BUSY' })
  lease.release(); lease.release()
  await f.accounts.select('s-a', b)
  assert.equal(await f.accounts.resolveSession('s-a'), b)
})
test('running agents block changes also between network requests', async () => {
  const f = fixture(), a = await signed(f, 'A')
  f.busy(true)
  await assert.rejects(f.accounts.select('s-a', a), { code: 'SESSION_BUSY' })
})
test('removed/signed-out account fails closed without changing session binding', async () => {
  const f = fixture(), a = await signed(f, 'A')
  await f.accounts.select('s-a', a)
  await f.accounts.remove(a)
  await assert.rejects(f.accounts.resolveSession('s-a'), { code: 'ACCOUNT_NOT_FOUND' })
  assert.equal((await f.accounts.snapshot('s-a')).sessionAccountId, a)
})
test('legacy grant remains in its original lock/key and cannot be deleted through multiaccount UI', async () => {
  const f = fixture(); f.records.set(LEGACY_KEY, { kind: 'grant', payload: { type: 'oauth', access: 'legacy' } })
  await f.accounts.initialize()
  assert.equal((await f.accounts.credentialStore('legacy').read('openai-codex')).access, 'legacy')
  await f.accounts.credentialStore('legacy').modify('openai-codex', old => ({ ...old, access: 'rotated' }))
  assert.equal(f.records.get(LEGACY_KEY).payload.access, 'rotated')
  assert.equal(f.records.size, 1)
  await assert.rejects(f.accounts.remove('legacy'), { code: 'LEGACY_ACCOUNT_PROTECTED' })
})
test('unconfigured account and invalid provider/session/label are refused', async () => {
  const f = fixture(), a = await f.accounts.create('A')
  await assert.rejects(f.accounts.select('s-a', a), { code: 'ACCOUNT_SIGNED_OUT' })
  await assert.rejects(f.accounts.create(' '), { code: 'INVALID_LABEL' })
  await assert.rejects(f.accounts.credentialStore(a).read('other'), { code: 'INVALID_PROVIDER' })
  await assert.rejects(f.accounts.select('../bad', a), { code: 'INVALID_SESSION' })
})
test('subagent inheritance is durable, ordinary sessions and cycles fail closed', async () => {
  const f = fixture(), a = await signed(f, 'A'), b = await signed(f, 'B')
  await f.accounts.select('parent', a)
  const childAware = new Accounts({ domain: f.domain, credentials: f.credentials,
    parentSession: id => ({ child: 'parent', grandchild: 'child', loop: 'loop' })[id] })
  assert.equal(await childAware.resolveSession('grandchild'), a)
  await f.accounts.select('parent', b)
  assert.equal(await childAware.resolveSession('grandchild'), a)
  await assert.rejects(childAware.resolveSession('ordinary-fork'), { code: 'SESSION_ACCOUNT_REQUIRED' })
  await assert.rejects(childAware.resolveSession('loop'), { code: 'SESSION_ACCOUNT_REQUIRED' })
})
test('pending authorization blocks inference and running bound sessions protect account changes', async () => {
  const f = fixture(), a = await signed(f, 'A')
  await f.accounts.select('s-a', a)
  f.accounts.authorizing.add(a)
  await assert.rejects(f.accounts.acquireSession('s-a'), { code: 'LOGIN_IN_PROGRESS' })
  f.accounts.authorizing.delete(a)
  f.busy(true)
  await assert.rejects(f.accounts.remove(a), { code: 'ACCOUNT_BUSY' })
  assert.throws(() => f.accounts.assertIdle(a), { code: 'ACCOUNT_BUSY' })
})
