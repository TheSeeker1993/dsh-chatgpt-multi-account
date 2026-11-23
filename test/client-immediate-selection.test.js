import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'

const source = readFileSync(new URL('../client/index.js', import.meta.url), 'utf8')
function excerpt(start, end) {
  const i = source.indexOf(start), j = source.indexOf(end, i)
  assert.ok(i >= 0 && j > i)
  return source.slice(i, j)
}
const handlers = excerpt('      const bindAccount =', '      const nativeModels =')
const reasoning = excerpt('      const changeEffort =', '      const filter = query')
const availability = excerpt('    function accountSupportsPickerModel(', '    const catalogCache =')

function fixture({ provider = 'chatgpt-session', model = 'standard', busy = false, resetBusy = false, confirmed = [], failModel = false } = {}) {
  const calls = [], notices = []
  const current = { provider, model, reasoningEffort: 'low' }
  const target = { id: 'target', configured: true }
  const emptyCatalog = { ids: new Set(), rows: [] }
  const catalogCache = new Map()
  const refreshCatalog = async id => { calls.push(['catalog', id]); catalogCache.set(id, { ids: new Set(confirmed), rows: [] }) }
  const directory = {
    store: { getSnapshot: () => ({ current }) },
    select: async value => { calls.push(['model', JSON.parse(JSON.stringify(value))]); return failModel ? { ok: false, error: { message: 'synthetic failure' } } : { ok: true } },
  }
  const ctx = { availabilityExtensions: new Set(['gated']), SUBAGENT_MODELS: ['standard', 'gated'], catalogCache, emptyCatalog, refreshCatalog,
    locked: false, busy, resetBusy, inFlight: { current: false }, snapshot: {}, selectedId: 'old', sessionId: 'synthetic',
    setError: key => { if (key) notices.push(key) }, setQuery() {}, setPreviewId() {}, setSelecting() {},
    directory, state: { current }, currentModel: { id: model }, levels: [{ id: 'low' }, { id: 'high' }], displayedEffort: 'low', text: (_, key) => key, t: null,
    mutate: async body => { calls.push(['bind', body.accountId]); return true },
  }
  const actions = vm.runInNewContext(`${availability}\n${handlers}\n${reasoning}\n({ pickAccount, choose, changeEffort })`, ctx)
  return { ...actions, target, calls, notices }
}

test('account click immediately binds on GPT and non-GPT routes without touching the model', async () => {
  for (const provider of ['chatgpt-session', 'deepseek']) {
    const f = fixture({ provider })
    await f.pickAccount(f.target)
    assert.deepEqual(f.calls, [['bind', 'target']])
  }
})

test('catalog-gated current model requires evidence for the clicked account before rebinding', async () => {
  const f = fixture({ model: 'gated' })
  await f.pickAccount(f.target)
  assert.deepEqual(f.calls, [['catalog', 'target']])
  assert.deepEqual(f.notices, ['pickerChooseCompatible'])
  const allowed = fixture({ model: 'gated', confirmed: ['gated'] })
  await allowed.pickAccount(allowed.target)
  assert.deepEqual(allowed.calls, [['catalog', 'target'], ['bind', 'target']])
})

test('busy or reset-pending account clicks do not bind', async () => {
  for (const patch of [{ busy: true }, { resetBusy: true }]) {
    const f = fixture(patch)
    await f.pickAccount(f.target)
    assert.deepEqual(f.calls, [])
  }
})

test('reasoning changes only the current model; unsupported and duplicate efforts are no-ops', async () => {
  const f = fixture()
  await f.changeEffort('low'); await f.changeEffort('invalid'); await f.changeEffort('high')
  assert.deepEqual(f.calls, [['model', { provider: 'chatgpt-session', model: 'standard', reasoningEffort: 'high' }]])
})

test('explicit model choice reports partial failure after binding with no retry', async () => {
  const f = fixture({ failModel: true })
  await f.choose(f.target, 'chatgpt-session', { id: 'standard' })
  assert.deepEqual(f.calls, [['bind', 'target'], ['model', { provider: 'chatgpt-session', model: 'standard' }]])
  assert.deepEqual(f.notices, ['pickerPartial synthetic failure'])
})
