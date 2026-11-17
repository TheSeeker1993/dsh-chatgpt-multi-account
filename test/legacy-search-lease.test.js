import test from 'node:test'
import assert from 'node:assert/strict'
import { Accounts, LEGACY_KEY } from '../multi/accounts.js'

function fixture() {
  const tables = {
    accounts: new Map([['legacy', { label: 'Original', createdAt: 1 }], ['b', { label: 'B', createdAt: 1 }]]),
    sessions: new Map([['s', { accountId: 'b' }]]),
  }
  return new Accounts({
    domain: {
      table: name => ({
        get: id => tables[name].get(id), entries: () => tables[name].entries(),
        put: async (id, value) => tables[name].set(id, value), delete: async id => tables[name].delete(id),
      }),
      close: async () => {},
    },
    credentials: {
      describeRecord: async () => ({ configured: true }),
      readRecord: async key => ({ kind: 'grant', payload: { accountId: key } }),
    },
  })
}

test('native legacy search reserves original account without rewriting explicit session binding', async () => {
  const a = fixture()
  const lease = await a.acquireAccount('s', 'legacy')
  assert.equal(lease.accountId, 'legacy')
  assert.equal(a.sessions.get('s').accountId, 'b')
  assert.throws(() => a.assertIdle('legacy'), { code: 'ACCOUNT_BUSY' })
  await assert.rejects(a.select('s', 'b'), { code: 'SESSION_BUSY' })
  await assert.rejects(a.remove('legacy'), { code: 'ACCOUNT_BUSY' })
  lease.release()
  lease.release()
  assert.doesNotThrow(() => a.assertIdle('legacy'))
  assert.equal(a.activeAccounts.get('legacy'), 0)
  assert.equal(a.activeSessions.get('s'), 0)
})

test('normal session lease still addresses its own account and can coexist with legacy search', async () => {
  const a = fixture()
  const [legacy, session] = await Promise.all([a.acquireAccount('s', 'legacy'), a.acquireSession('s')])
  assert.equal(legacy.accountId, 'legacy')
  assert.equal(session.accountId, 'b')
  assert.notEqual(legacy.replayIdentity, session.replayIdentity)
  assert.equal(a.activeSessions.get('s'), 2)
  legacy.release()
  assert.equal(a.activeSessions.get('s'), 1)
  await assert.rejects(a.select('s', 'b'), { code: 'SESSION_BUSY' })
  session.release()
  assert.equal(a.activeSessions.get('s'), 0)
})

test('explicit legacy acquisition does not bypass pending login or missing identity', async () => {
  const a = fixture()
  a.authorizing.add('legacy')
  await assert.rejects(a.acquireAccount('s', 'legacy'), { code: 'LOGIN_IN_PROGRESS' })
  a.authorizing.clear()
  a.isAuthorizing = id => id === 'legacy'
  await assert.rejects(a.acquireAccount('s', 'legacy'), { code: 'LOGIN_IN_PROGRESS' })
  a.isAuthorizing = () => false
  a.credentials.readRecord = async () => undefined
  await assert.rejects(a.acquireAccount('s', 'legacy'), { code: 'ACCOUNT_SIGNED_OUT' })
  assert.equal(a.activeSessions.size, 0)
  assert.equal(a.activeAccounts.size, 0)
  assert.equal(a.sessions.get('s').accountId, 'b')
})

test('explicit acquisition fails closed for invalid session, missing account, removal and stopped plugin', async () => {
  const a = fixture()
  await assert.rejects(a.acquireAccount('', 'legacy'), { code: 'SESSION_ACCOUNT_REQUIRED' })
  await assert.rejects(a.acquireAccount('s', 'missing'), { code: 'ACCOUNT_NOT_FOUND' })
  a.removing.add('legacy')
  await assert.rejects(a.acquireAccount('s', 'legacy'), { code: 'ACCOUNT_NOT_FOUND' })
  a.removing.clear()
  assert.equal(a.activeSessions.size, 0)
  await a.close()
  await assert.rejects(a.acquireAccount('s', 'legacy'), { code: 'PLUGIN_STOPPED' })
})

test('explicit acquisition uses shared serial gate and native legacy credential key', async () => {
  const a = fixture()
  let unblock
  const blocked = a.exclusive(() => new Promise(resolve => { unblock = resolve }))
  await Promise.resolve()
  const keys = []
  a.credentials.readRecord = async key => {
    keys.push(key)
    return { kind: 'grant', payload: { accountId: 'synthetic-issuer' } }
  }
  const pending = a.acquireAccount('unbound', 'legacy')
  assert.deepEqual(keys, [])
  unblock()
  await blocked
  const lease = await pending
  assert.deepEqual(keys, [LEGACY_KEY])
  assert.equal(a.sessions.get('unbound'), undefined)
  lease.release()
  const again = await a.acquireAccount('s', 'legacy')
  assert.equal(again.replayIdentity, lease.replayIdentity)
  again.release()
  a.credentials.readRecord = async () => ({ kind: 'grant', payload: { accountId: 'different-synthetic-issuer' } })
  const changed = await a.acquireAccount('s', 'legacy')
  assert.notEqual(changed.replayIdentity, lease.replayIdentity)
  changed.release()
})
