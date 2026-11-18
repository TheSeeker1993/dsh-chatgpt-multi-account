import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'

const settle = () => new Promise(resolve => setImmediate(resolve))
const plain = value => JSON.parse(JSON.stringify(value))
function fixture(fetch) {
  const slots = [], timers = new Map(), events = new EventTarget()
  let cursor = 0, effects = [], definition, clock = 100000, nextTimer = 0
  const react = {
    createElement(type, props, ...children) { return { type, props: props ?? {}, children: children.flat(Infinity).filter(v => v != null && v !== false) } },
    useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = initial; return [slots[i], v => { slots[i] = typeof v === 'function' ? v(slots[i]) : v }] },
    useRef(initial) { const i = cursor++; if (!(i in slots)) slots[i] = { current: initial }; return slots[i] },
    useCallback(fn, deps) { const i = cursor++; if (!slots[i] || deps.some((v,j) => v !== slots[i].deps[j])) slots[i] = { fn, deps }; return slots[i].fn },
    useEffect(fn, deps) { const i = cursor++; if (!slots[i] || deps.some((v,j) => v !== slots[i].deps[j])) effects.push(() => { slots[i]?.cleanup?.(); slots[i] = { deps, cleanup: fn() } }) },
  }
  class Clock extends Date { static now() { return clock } }
  const context = vm.createContext({
    window: { __ModuleLoader__: { load(v) { definition = v } }, addEventListener: events.addEventListener.bind(events), removeEventListener: events.removeEventListener.bind(events) },
    EventTarget, Event, AbortController, fetch, Date: Clock,
    setInterval(fn) { const id = ++nextTimer; timers.set(id, fn); return id }, clearInterval(id) { timers.delete(id) },
  })
  const source = readFileSync(new URL('../client/index.js', import.meta.url), 'utf8')
  const marker = '    const SUBAGENT_SETTINGS'
  vm.runInContext(source.replace(marker, '    globalThis.helpers = { request, useAccountCatalog, catalogCandidates, CatalogStatus };\n' + marker), context)
  definition.factory(() => react)
  return { ...context.helpers,
    render(accountId = 'a', active = true) { cursor = 0; const value = context.helpers.useAccountCatalog(accountId, active); const pending = effects; effects = []; pending.forEach(fn => fn()); return value },
    tick(ms) { clock += ms; [...timers.values()].forEach(fn => fn()) },
    unmount() { slots.forEach(v => v?.cleanup?.()) },
    timers,
  }
}
const response = value => ({ ok: true, json: async () => value })
const model = { id: 'new-model', name: 'New model', compatible: true, reasoning: { efforts: [{ id: 'max', name: 'Maximum' }], defaultEffort: 'max' } }
const view = accountId => ({ accountId, models: [model], checkedAt: 100000, freshness: 'fresh', error: null })

test('account scoped fresh GET on every open/preview, dedup and cleanup', async () => {
  const calls = []
  let finish
  const f = fixture((path, options) => { calls.push({ path, options }); return new Promise(resolve => { finish = resolve }) })
  f.render(); const pending = f.render()
  void pending.refresh(); // in-flight refresh must not dispatch twice
  assert.equal(calls.length, 1)
  finish(response(view('a'))); await settle()
  assert.deepEqual(plain(f.render().data.models), [model])
  f.render('b'); assert.equal(calls[0].options.signal.aborted, true)
  assert.equal(calls[1].path, 'api/chatgpt-models?accountId=b')
  finish(response(view('b'))); await settle()
  f.render('b', false); f.render('b', true)
  assert.equal(calls.length, 3)
  assert.equal(calls[2].options.method, 'GET')
  assert.equal(calls[2].options.cache, 'no-store')
  f.unmount(); assert.equal(calls[2].options.signal.aborted, true); assert.equal(f.timers.size, 0)
})

test('network rejection keeps last known account list stale, disables candidates and safely retries', async () => {
  let calls = 0
  const f = fixture(async () => { if (++calls === 2) throw Error('offline'); return response(view('a')) })
  f.render(); await settle()
  assert.equal(f.catalogCandidates(f.render().data).length, 1)
  f.tick(300000); await settle()
  const stale = f.render()
  assert.equal(stale.data.freshness, 'stale')
  assert.equal(stale.data.error, 'offline')
  assert.deepEqual(plain(stale.data.models), [model])
  assert.equal(f.catalogCandidates(stale.data).length, 0)
  await stale.refresh(); assert.equal(calls, 2)
  f.tick(29999); assert.equal(calls, 2)
  f.tick(1); await settle()
  assert.equal(calls, 3); assert.equal(f.render().data.freshness, 'fresh')
  f.unmount()
})

test('server stale/error envelope is visible and nextRetryAt respected', async () => {
  let calls = 0
  const f = fixture(async () => { calls++; return response({ ...view('a'), freshness: 'stale', error: 'MODELS_THROTTLED', nextRetryAt: 190000 }) })
  f.render(); await settle()
  assert.equal(f.render().data.error, 'MODELS_THROTTLED')
  assert.equal(f.catalogCandidates(f.render().data).length, 0)
  f.tick(89999); assert.equal(calls, 1)
  f.tick(1); await settle(); assert.equal(calls, 2)
  f.unmount()
})

test('late previous account response cannot replace current preview; incompatible remains visible but not candidate', async () => {
  const releases = []
  const f = fixture(() => new Promise(resolve => releases.push(resolve)))
  f.render('a'); f.render('b')
  releases[1](response({ ...view('b'), models: [model, { id: 'future', name: 'Future', compatible: false, reason: 'transport' }] })); await settle()
  releases[0](response(view('a'))); await settle()
  const data = f.render('b').data
  assert.equal(data.accountId, 'b'); assert.equal(data.models.length, 2)
  assert.deepEqual(plain(f.catalogCandidates(data)), [model])
  f.unmount()
})

test('manual metadata writes use dedicated CSRF fetched for selected account', async () => {
  const calls = []
  const f = fixture(async (path, options) => { calls.push({ path, options }); return response(options.method === 'GET' ? { ...view('a'), csrfToken: 'a'.repeat(64) } : { ok: true }) })
  await f.request('api/chatgpt-models', { action: 'manual', accountId: 'a', models: [model] })
  assert.equal(calls[0].path, 'api/chatgpt-models?accountId=a')
  assert.equal(calls[1].options.headers['x-chatgpt-models-csrf'], 'a'.repeat(64))
  assert.deepEqual(JSON.parse(calls[1].options.body).models, [model])
})
