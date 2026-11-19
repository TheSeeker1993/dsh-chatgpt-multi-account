import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'

const settle = () => new Promise(resolve => setImmediate(resolve))
const source = readFileSync(new URL('../client/index.js', import.meta.url), 'utf8')
const nativeIds = ['gpt-6-astra', 'gpt-6.1-sol', 'gpt-6-sol', 'gpt-6-luna', 'gpt-5.6-sol', 'gpt-5.6-terra', 'gpt-5.6-luna']
const extensions = ['gpt-6.2-sol', 'gpt-6.2-astra', 'gpt-6.1-terra']
const models = [...nativeIds, ...extensions].map(id => ({ id }))
const report = rows => ({ checkedAt: 1, error: null, models: rows })
const listed = (...ids) => report(ids.map(id => ({ id, visibility: 'list' })))
const response = data => ({ ok: true, json: async () => data })
function fixture(fetch) {
  const slots = [], effects = []
  let cursor = 0, definition, now = 1000
  const React = {
    createContext(value) { return { value } },
    createElement() { return null },
    useRef(initial) { const i = cursor++; return slots[i] ??= { current: initial } },
    useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = initial; return [slots[i], v => { slots[i] = typeof v === 'function' ? v(slots[i]) : v }] },
    useEffect(effect, deps) { const i = cursor++; if (!slots[i] || deps.some((v, j) => v !== slots[i].deps[j])) effects.push(() => { slots[i]?.cleanup?.(); slots[i] = { deps, cleanup: effect() } }) },
  }
  const context = vm.createContext({ window: { __ModuleLoader__: { load(v) { definition = v } } }, EventTarget, Event, AbortController, fetch, Date: { now: () => now } })
  const marker = '    function UnifiedPicker('
  assert.equal(source.split(marker).length, 2)
  vm.runInContext(source.replace(marker, '    globalThis.helpers = {useAvailableCatalog, invalidateCatalog, filterAvailableModels};\n' + marker), context)
  definition.factory(() => React)
  return { ...context.helpers,
    render(enabled = true, accountId = 'a', configured = true) { cursor = 0; const ids = context.helpers.useAvailableCatalog(enabled, accountId, configured).ids; effects.splice(0).forEach(effect => effect()); return ids },
    advance(ms) { now += ms },
    unmount() { slots.forEach(slot => slot?.cleanup?.()) },
  }
}
const ids = value => Array.from(value)
const visible = (f, available, current) => Array.from(f.filterAvailableModels(models, available, current), row => row.id)

test('closed, other tab, unconfigured and missing accounts never request; open GET explicitly names preview account', async () => {
  const calls = []
  const g = fixture(async (path, options) => { calls.push({ path, options }); return response(listed(extensions[0])) })
  calls.length = 0
  g.render(false); g.render(true, null); g.render(true, 'signed-out', false)
  assert.equal(calls.length, 0)
  g.render(true, 'preview / account'); await settle()
  assert.equal(calls.length, 1)
  assert.equal(calls[0].path, 'api/chatgpt-catalog-report?accountId=preview%20%2F%20account')
  assert.equal(calls[0].options.method, 'GET')
  assert.equal(calls[0].options.body, undefined)
  assert.equal(calls[0].options.cache, 'no-store')
  assert.equal(calls[0].options.credentials, 'same-origin')
  assert.deepEqual(ids(g.render(true, 'preview / account')), [extensions[0]])
  g.unmount()
  assert.equal(calls[0].options.signal.aborted, false)
  assert.match(source, /useAvailableCatalog\(open && tab === 'gpt', previewAccount\?\.id, previewAccount\?\.configured\)/)
  assert.match(source, /previewIsCurrent \? state\.current\?\.model : null/)
})

test('only three extensions are filtered; visibility alone decides availability, never native flags', async () => {
  const f = fixture(async () => response(report([
    ...nativeIds.map(id => ({ id, visibility: 'hide' })),
    { id: extensions[0], visibility: 'list', toolMode: 'unsupported', responsesLite: true, experimentalToolNames: [] },
    { id: extensions[1], visibility: 'hide', toolMode: 'function', responsesLite: false },
    { id: extensions[2], visibility: null },
  ])))
  assert.deepEqual(visible(f, f.render()), nativeIds)
  await settle()
  assert.deepEqual(visible(f, f.render()), [...nativeIds, extensions[0]])
  f.unmount()
})

test('successful responses persist for the window lifetime; invalidated lookups can retry after errors', async () => {
  const calls = [], replies = [listed(...extensions), Error('offline'), listed(extensions[1])]
  const f = fixture(async (_path, options) => { calls.push(options); const reply = replies.shift(); if (reply instanceof Error) throw reply; return response(reply) })
  f.render(); await settle()
  f.advance(3600000); f.render(false); assert.deepEqual(ids(f.render()), extensions)
  assert.equal(calls.length, 1)
  f.invalidateCatalog('a'); await settle()
  assert.deepEqual(ids(f.render()), [])
  f.render(false); f.render(); await settle()
  assert.deepEqual(ids(f.render()), [extensions[1]])
  f.unmount()
})

test('account switch isolates late responses, remount reuses cache, invalidation aborts pending work', async () => {
  const pending = []
  const f = fixture((path, options) => new Promise(resolve => pending.push({ path, options, resolve })))
  f.render(true, 'a')
  f.render(false, 'a'); f.render(true, 'a')
  assert.equal(pending.length, 1)
  assert.deepEqual(ids(f.render(true, 'b')), [])
  assert.equal(pending[0].options.signal.aborted, false)
  pending[1].resolve(response(listed(extensions[1]))); await settle()
  assert.deepEqual(ids(f.render(true, 'b')), [extensions[1]])
  pending[0].resolve(response(listed(extensions[0]))); await settle()
  assert.deepEqual(ids(f.render(true, 'b')), [extensions[1]])
  assert.deepEqual(ids(f.render(true, 'a')), [extensions[0]])
  f.invalidateCatalog('a')
  f.unmount(); f.invalidateCatalog('a')
  assert.equal(pending[2].options.signal.aborted, true)
  pending[2].resolve(response(listed(...extensions))); await settle()
  assert.deepEqual(ids(f.render(false, 'a')), [])
  const g = fixture(async () => response(listed()))
  assert.deepEqual(ids(g.render(false, 'b')), [])
  g.unmount()
})

test('lookup failure silently retains current 6.2 only for matching session account, and never hides native seven', async () => {
  const f = fixture(async () => { throw Error('offline') })
  f.render(); await settle()
  const available = f.render()
  assert.deepEqual(visible(f, available, extensions[0]), [...nativeIds, extensions[0]])
  assert.deepEqual(visible(f, available, null), nativeIds)
  assert.match(source, /state\.current\?\.provider === 'chatgpt-session' && previewAccount\?\.id === selectedId/)
  f.unmount()
})
