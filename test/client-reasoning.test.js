import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'

const source = readFileSync(new URL('../client/index.js', import.meta.url), 'utf8')
function fixture(overrides = {}) {
  const calls = [], errors = []
  const context = vm.createContext({
    busy: false, resetBusy: false, inFlight: { current: false }, levels: [{ id: 'low' }, { id: 'high' }], displayedEffort: 'low',
    currentModel: { id: 'model', reasoning: { efforts: [{ id: 'low' }, { id: 'high' }] } },
    state: { current: { provider: 'chatgpt-session' } },
    directory: { select: async value => { calls.push(value); return { ok: true } } },
    setSelecting() {}, setError: value => errors.push(value),
    ...overrides,
  })
  const handler = source.slice(source.indexOf('      const changeEffort ='), source.indexOf('      const filter = query'))
  vm.runInContext(handler + '\nglobalThis.change = changeEffort', context)
  return { context, calls, errors }
}
test('reasoning alone saves current model without closing or rebinding', async () => {
  const f = fixture()
  await f.context.change('high')
  assert.deepEqual(JSON.parse(JSON.stringify(f.calls)), [{ provider: 'chatgpt-session', model: 'model', reasoningEffort: 'high' }])
  assert.equal(f.context.inFlight.current, false)
})
test('reasoning unavailable in a preview or unsupported by the active model does not dispatch', async () => {
  const preview = fixture({ levels: [] })
  await preview.context.change('high')
  const active = fixture()
  await active.context.change('unsupported')
  assert.equal(preview.calls.length, 0)
  assert.equal(active.calls.length, 0)
})
test('busy and in-flight reasoning cannot dispatch; failures remain visible', async () => {
  for (const overrides of [{ busy: true }, { resetBusy: true }, { inFlight: { current: true } }]) {
    const f = fixture(overrides); await f.context.change('high')
    assert.equal(f.calls.length, 0)
  }
  const f = fixture({ directory: { select: async () => ({ ok: false, error: { message: 'blocked' } }) } })
  await f.context.change('high')
  assert.equal(f.errors.at(-1), 'blocked')
  assert.equal(f.context.inFlight.current, false)
})
