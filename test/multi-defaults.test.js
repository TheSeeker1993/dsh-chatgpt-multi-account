import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Accounts } from '../multi/accounts.js'
import { ChatDefaults } from '../multi/defaults.js'
import { MODEL_IDS } from '../multi/routing.js'

function fixture() {
  const maps = { accounts: new Map(), sessions: new Map(), defaults: new Map() }
  const configured = new Set(), descriptions = []
  let writes = 0
  const domain = { table: name => ({
    get: id => maps[name].get(id), entries: () => maps[name].entries(),
    put: async (id, value) => { if (name === 'defaults') writes++; maps[name].set(id, structuredClone(value)) },
    delete: async id => maps[name].delete(id),
  }), close: async () => {} }
  const credentials = {
    describeRecord: async key => { descriptions.push(key); return { configured: configured.has(key) } },
    readRecord: async () => { throw new Error('Must not read grants') },
    deleteRecord: async key => configured.delete(key),
  }
  const accounts = new Accounts({ domain, credentials, isSessionBusy: () => true })
  const table = domain.table('defaults')
  const defaults = new ChatDefaults({ accounts, table })
  const add = (id, createdAt, signed = true) => {
    maps.accounts.set(id, { label: id, createdAt })
    if (signed) configured.add(accounts.key(id))
    return id
  }
  return { accounts, defaults, maps, configured, descriptions, add, writes: () => writes,
    reopen: () => new ChatDefaults({ accounts, table }) }
}
const initial = accountId => ({ enabled: true, accountId, model: 'gpt-6.1-sol', reasoningEffort: 'low', available: true })

test('defaults wait for configured accounts without persisting an empty marker', async () => {
  const f = fixture()
  f.add('empty', 0, false)
  assert.deepEqual(await f.defaults.snapshot(), { ...initial(null), enabled: false, available: false })
  assert.equal(f.writes(), 0)
  f.add('later', 30)
  f.add('first', 10)
  f.add('same-time', 10)
  assert.deepEqual(await f.defaults.snapshot(), initial('first'))
  assert.equal(f.writes(), 1)
  assert.deepEqual(await f.reopen().snapshot(), initial('first'))
  assert.deepEqual([...f.maps.sessions], [])
})

test('defaults persist custom selections and accept all seven models and reasoning levels while busy', async () => {
  const f = fixture(); f.add('a', 1); f.add('b', 2)
  f.maps.sessions.set('existing', { accountId: 'a' })
  f.accounts.activeAccounts.set('b', 1)
  for (const model of MODEL_IDS) {
    for (const reasoningEffort of ['low', 'medium', 'high', 'xhigh']) {
      const expected = { enabled: true, accountId: 'b', model, reasoningEffort, available: true }
      assert.deepEqual(await f.defaults.save({ accountId: 'b', model, reasoningEffort }), expected)
      assert.deepEqual(await f.reopen().snapshot(), expected)
    }
  }
  assert.deepEqual([...f.maps.sessions], [['existing', { accountId: 'a' }]])
  assert.equal(f.accounts.activeAccounts.get('b'), 1)
})

test('saved missing or signed-out accounts never fall back or erase the selection', async () => {
  const f = fixture(); f.add('a', 1); f.add('b', 2)
  await f.defaults.snapshot()
  f.configured.delete(f.accounts.key('a'))
  assert.deepEqual(await f.reopen().snapshot(), { ...initial('a'), available: false })
  await f.accounts.remove('a')
  assert.deepEqual(await f.reopen().snapshot(), { ...initial('a'), available: false })
  assert.equal(f.writes(), 1)
})

test('explicit disable persists before any initialization and never reselects on reopen', async () => {
  const f = fixture()
  assert.equal((await f.defaults.disable()).enabled, false)
  f.add('a', 1)
  assert.deepEqual(await f.reopen().snapshot(), { ...initial(null), enabled: false, available: false })
  await f.defaults.save({ accountId: 'a', model: 'gpt-6-luna', reasoningEffort: 'high' })
  const disabled = await f.defaults.disable()
  assert.deepEqual(await f.reopen().snapshot(), disabled)
  assert.equal(disabled.accountId, 'a')
  assert.equal(disabled.enabled, false)
})

test('concurrent initialization, save and disable serialize on the existing Accounts gate', async () => {
  const f = fixture(); f.add('a', 1); f.add('b', 2)
  const selected = { accountId: 'b', model: 'gpt-5.6-terra', reasoningEffort: 'xhigh' }
  const results = await Promise.all([
    f.defaults.snapshot(), f.reopen().snapshot(), f.defaults.save(selected), f.defaults.disable(), f.defaults.snapshot(),
  ])
  assert.deepEqual(results[0], initial('a'))
  assert.deepEqual(results[1], initial('a'))
  assert.deepEqual(results[2], { ...selected, enabled: true, available: true })
  assert.deepEqual(results[3], { ...selected, enabled: false, available: true })
  assert.deepEqual(results[4], results[3])
  assert.equal(f.writes(), 3)
  assert.deepEqual(await f.reopen().snapshot(), results[3])
  assert.deepEqual([...f.maps.sessions], [])
})

test('validation fails without writing or changing bindings and a failed save does not poison the gate', async () => {
  const f = fixture(); f.add('a', 1); f.add('empty', 2, false)
  const valid = { accountId: 'a', model: 'gpt-6.1-sol', reasoningEffort: 'low' }
  for (const [value, code] of [
    [{ ...valid, model: 'unknown' }, 'INVALID_MODEL'],
    [{ ...valid, reasoningEffort: 'off' }, 'INVALID_REASONING_EFFORT'],
    [{ ...valid, accountId: 'missing' }, 'ACCOUNT_NOT_FOUND'],
    [{ ...valid, accountId: 'empty' }, 'ACCOUNT_SIGNED_OUT'],
    [{}, 'INVALID_MODEL'],
  ]) await assert.rejects(f.defaults.save(value), { code })
  assert.equal(f.writes(), 0)
  assert.deepEqual(await f.defaults.save(valid), initial('a'))
  assert.deepEqual([...f.maps.sessions], [])
})
