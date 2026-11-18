import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Accounts } from '../multi/accounts.js'
import { ChatDefaults } from '../multi/defaults.js'

const native = id => ({ id, reasoning: true, thinkingLevelMap: { low: 'low', high: 'high' }, defaultReasoningEffort: 'low' })
function fixture() {
  const maps = { accounts: new Map(), sessions: new Map(), defaults: new Map() }, configured = new Set()
  const domain = { table: name => ({ get: id => maps[name].get(id), entries: () => maps[name].entries(), put: async (id, value) => maps[name].set(id, structuredClone(value)), delete: async id => maps[name].delete(id) }) }
  const accounts = new Accounts({ domain, credentials: { describeRecord: async key => ({ configured: configured.has(key) }) }, isSessionBusy: () => true })
  let models = ['gpt-6.2-sol', 'gpt-6.10-sol', 'gpt-99-sol-preview', 'gpt-100-astra'].map(id => ({ id, compatible: true, reasoning: { efforts: [{ id: 'low', name: 'low' }, { id: 'high', name: 'high' }], defaultEffort: 'low' } }))
  const catalog = { refresh: async () => ({ models, freshness: 'fresh', checkedAt: 123 }), available: async (accountId, id) => {
    if (!models.some(model => model.id === id && model.compatible)) throw Object.assign(new Error('Unavailable'), { code: 'MODEL_UNAVAILABLE' })
    return native(id)
  } }
  const table = domain.table('defaults'), defaults = new ChatDefaults({ accounts, table, catalog })
  const add = (id, createdAt = 1) => { maps.accounts.set(id, { createdAt }); configured.add(accounts.key(id)) }
  return { accounts, defaults, maps, catalog, add, configured, models: value => { models = value }, reopen: () => new ChatDefaults({ accounts, table, catalog }) }
}

test('absent default selects numeric latest compatible Sol from first configured account only', async () => {
  const f = fixture(); f.add('a'); f.add('b', 2)
  const result = await f.defaults.snapshot()
  assert.equal(result.model, 'gpt-6.10-sol'); assert.equal(result.accountId, 'a')
  assert.equal(result.selectionMode, 'auto-latest-sol'); assert.equal(result.available, true)
  assert.equal(f.maps.sessions.size, 0)
})

test('legacy records including disabled old factory IDs migrate without guessing provenance', async () => {
  for (const enabled of [true, false]) {
    const f = fixture(); f.add('a')
    f.maps.defaults.set('default', { enabled, accountId: 'a', model: 'gpt-6.1-sol', reasoningEffort: 'low' })
    const value = await f.defaults.snapshot()
    assert.equal(value.model, 'gpt-6.1-sol'); assert.equal(value.enabled, enabled)
    assert.equal(value.selectionMode, 'legacy-preserved'); assert.equal(value.available, false)
    assert.equal(f.maps.defaults.get('default').selectionMode, 'legacy-preserved')
  }
})

test('save validates account catalog and exact effort; explicit disable pins persistently', async () => {
  const f = fixture(); f.add('a')
  const choice = { accountId: 'a', model: 'gpt-6.2-sol', reasoningEffort: 'high' }
  assert.equal((await f.defaults.save(choice)).selectionMode, 'user-pinned')
  assert.equal((await f.reopen().snapshot()).model, choice.model)
  await assert.rejects(f.defaults.save({ ...choice, reasoningEffort: 'xhigh' }), { code: 'INVALID_REASONING_EFFORT' })
  await assert.rejects(f.defaults.save({ ...choice, model: 'unknown' }))
  await f.defaults.disable()
  assert.equal((await f.reopen().snapshot()).enabled, false)
  assert.equal((await f.defaults.enableAuto({ accountId: 'a' })).model, 'gpt-6.10-sol')
})

test('stale/no Sol never guesses, retains prior auto model and reports unavailable', async () => {
  const f = fixture(); f.add('a')
  await f.defaults.snapshot()
  f.catalog.refresh = async () => ({ models: [], freshness: 'stale' })
  const value = await f.defaults.snapshot()
  assert.equal(value.model, 'gpt-6.10-sol'); assert.equal(value.available, false); assert.equal(value.status, 'no-fresh-sol')
  const g = fixture(); g.add('a'); g.models([])
  const absent = await g.defaults.snapshot()
  assert.equal(absent.model, ''); assert.equal(absent.available, false)
})

test('discovery may acquire Accounts gate; concurrent disable wins late refresh', async () => {
  const f = fixture(); f.add('a')
  let release, started
  const waiting = new Promise(resolve => { release = resolve }), ready = new Promise(resolve => { started = resolve })
  const original = f.catalog.refresh
  f.catalog.refresh = async (...args) => {
    await f.accounts.exclusive(async () => {})
    started(); await waiting
    return original(...args)
  }
  const pending = f.defaults.snapshot()
  await ready; await f.defaults.disable(); release()
  const value = await pending
  assert.equal(value.enabled, false); assert.equal(value.selectionMode, 'user-pinned')
  assert.equal(f.maps.defaults.get('default').enabled, false)
})

test('late auto discovery cannot overwrite concurrent exact save', async () => {
  const f = fixture(); f.add('a'); f.add('b', 2)
  let release, started
  const ready = new Promise(resolve => { started = resolve })
  const original = f.catalog.refresh
  f.catalog.refresh = async (...args) => { started(); await new Promise(resolve => { release = resolve }); return original(...args) }
  const pending = f.defaults.snapshot()
  await ready
  await f.defaults.save({ accountId: 'b', model: 'gpt-6.2-sol', reasoningEffort: 'high' })
  release()
  const value = await pending
  assert.equal(value.accountId, 'b'); assert.equal(value.model, 'gpt-6.2-sol'); assert.equal(value.reasoningEffort, 'high')
  assert.equal(value.selectionMode, 'user-pinned')
})

test('signed-out pinned account retains exact model without account fallback', async () => {
  const f = fixture(); f.add('a'); f.add('b', 2)
  await f.defaults.save({ accountId: 'a', model: 'gpt-6.2-sol', reasoningEffort: 'high' })
  f.configured.delete(f.accounts.key('a'))
  const value = await f.defaults.snapshot()
  assert.equal(value.accountId, 'a'); assert.equal(value.model, 'gpt-6.2-sol'); assert.equal(value.available, false)
})

test('catalog omission is safe, never falls back to a hardcoded model', async () => {
  const f = fixture(); f.add('a')
  const value = await new ChatDefaults({ accounts: f.accounts, table: { get: () => undefined } }).snapshot()
  assert.equal(value.available, false); assert.equal(value.model, '')
})
