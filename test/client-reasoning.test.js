import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'

const source = readFileSync(new URL('../client/index.js', import.meta.url), 'utf8')
function fixture(overrides = {}) {
  const calls = [], drafts = [], errors = []
  const context = vm.createContext({
    busy: false, resetBusy: false, inFlight: { current: false }, previewIsCurrent: true,
    currentModel: { id: 'model', reasoning: { efforts: [{ id: 'low' }, { id: 'high' }] } },
    state: { current: { provider: 'chatgpt-session' } },
    directory: { select: async value => { calls.push(value); return { ok: true } } },
    setSelecting() {}, setError: value => errors.push(value), setCommonEffort: value => drafts.push(value),
    ...overrides,
  })
  const handler = source.slice(source.indexOf('      const changeEffort ='), source.indexOf('      const visibleModels ='))
  vm.runInContext(handler + '\nglobalThis.change = changeEffort', context)
  return { context, calls, drafts, errors }
}
test('reasoning alone saves current model without closing or rebinding', async () => {
  const f = fixture()
  await f.context.change('high')
  assert.deepEqual(JSON.parse(JSON.stringify(f.calls)), [{ provider: 'chatgpt-session', model: 'model', reasoningEffort: 'high' }])
  assert.deepEqual(f.drafts, [null])
  assert.equal(f.context.inFlight.current, false)
})
test('preview and unsupported reasoning remain drafts without selecting an account/model', async () => {
  for (const overrides of [{ previewIsCurrent: false }, { currentModel: null }]) {
    const f = fixture(overrides)
    await f.context.change('high')
    assert.equal(f.calls.length, 0)
    assert.deepEqual(f.drafts, ['high'])
  }
})
test('busy and in-flight reasoning cannot dispatch; failures remain visible', async () => {
  for (const overrides of [{ busy: true }, { resetBusy: true }, { inFlight: { current: true } }]) {
    const f = fixture(overrides); await f.context.change('high')
    assert.equal(f.calls.length, 0); assert.equal(f.drafts.length, 0)
  }
  const f = fixture({ directory: { select: async () => ({ ok: false, error: { message: 'blocked' } }) } })
  await f.context.change('high')
  assert.equal(f.errors.at(-1), 'blocked')
  assert.equal(f.drafts.length, 0)
  assert.equal(f.context.inFlight.current, false)
})
