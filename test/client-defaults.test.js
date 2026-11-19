import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'

const plain = value => JSON.parse(JSON.stringify(value))
const settle = () => new Promise(resolve => setImmediate(resolve))
function fixture(fetch) {
  const slots = [], effects = []
  let cursor = 0, definition, tree
  const react = {
    createContext(value) { return { value } },
    createElement(type, props, ...children) { return { type, props: props ?? {}, children: children.flat(Infinity).filter(Boolean) } },
    useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = initial; return [slots[i], v => { slots[i] = typeof v === 'function' ? v(slots[i]) : v }] },
    useRef(initial) { const i = cursor++; if (!(i in slots)) slots[i] = { current: initial }; return slots[i] },
    useEffect(effect, deps) { const i = cursor++; if (!slots[i] || deps.some((v, j) => v !== slots[i].deps[j])) effects.push(() => { slots[i]?.cleanup?.(); slots[i] = { deps, cleanup: effect() } }) },
  }
  const context = vm.createContext({ window: { __ModuleLoader__: { load(v) { definition = v } } }, EventTarget, Event, AbortController, fetch })
  const source = readFileSync(new URL('../client/index.js', import.meta.url), 'utf8')
  const marker = '    function UnifiedPicker('
  assert.equal(source.split(marker).length, 2)
  vm.runInContext(source.replace(marker, '    globalThis.helpers = {request, newChatCombo, defaultsMatch, NewChatDefaults};\n' + marker), context)
  definition.factory(() => react)
  return { ...context.helpers, render(props) { cursor = 0; tree = context.helpers.NewChatDefaults({ t: key => key, ...props }); effects.splice(0).forEach(f => f()); return tree.children.find(n => n.type === 'input') }, unmount() { slots.forEach(v => v?.cleanup?.()) } }
}
const combo = { accountId: 'preview', model: 'gpt-6.1-sol', reasoningEffort: 'low' }
const saved = { enabled: true, available: true, ...combo }
const response = data => ({ ok: true, json: async () => data })

test('native current model only, preview account and exact saved match', () => {
  const f = fixture(() => { throw Error('no network') })
  const models = [{ id: combo.model, reasoning: { efforts: [{ id: 'low' }] } }]
  const account = { id: 'preview', configured: true }
  assert.deepEqual(plain(f.newChatCombo({ provider: 'chatgpt-session', model: combo.model }, models, account, 'low', 'gpt')), combo)
  for (const current of [null, { provider: 'other', model: combo.model }, { provider: 'chatgpt-session', model: 'missing' }]) assert.equal(f.newChatCombo(current, models, account, 'low', 'gpt'), null)
  assert.equal(f.defaultsMatch(saved, combo), true)
  for (const key of ['accountId', 'model', 'reasoningEffort']) assert.equal(f.defaultsMatch(saved, { ...combo, [key]: 'different' }), false)
  assert.equal(f.defaultsMatch({ ...saved, enabled: false }, combo), false)
  assert.equal(f.newChatCombo({ provider: 'chatgpt-session', model: combo.model }, models, account, 'low', 'other'), null)
})

test('GET is authenticated no-store; no automatic saves; exact save/disable and CSRF', async () => {
  const calls = []
  const f = fixture(async (path, options) => { calls.push({ path, ...plain(options) }); return response(options.method === 'GET' ? { ...saved, enabled: false, csrfToken: 'a'.repeat(64) } : JSON.parse(options.body).action === 'disable' ? { ...saved, enabled: false } : saved) })
  const props = { open: true, combo }
  assert.equal(f.render(props).props.disabled, true)
  await settle()
  let input = f.render(props)
  assert.equal(calls.length, 1)
  assert.equal(calls[0].method, 'GET'); assert.equal(calls[0].cache, 'no-store'); assert.equal(calls[0].credentials, 'same-origin')
  assert.equal(input.props.checked, false)
  await input.props.onChange()
  assert.deepEqual(JSON.parse(calls[1].body), { action: 'save', ...combo })
  assert.equal(calls[1].headers['x-chatgpt-defaults-csrf'], 'a'.repeat(64))
  input = f.render(props); assert.equal(input.props.checked, true)
  await input.props.onChange()
  assert.deepEqual(JSON.parse(calls[2].body), { action: 'disable' })
  assert.equal(f.render(props).props.checked, false)
  f.render({ ...props, combo: { ...combo, accountId: 'different' } })
  assert.equal(calls.length, 3)
  f.unmount()
})

test('operation lock, errors, unavailable and stale unmounted completion', async () => {
  let finish, posts = 0
  const f = fixture(async (_path, options) => {
    if (options.method === 'GET') return response({ ...saved, csrfToken: 'b'.repeat(64) })
    posts++; return new Promise(resolve => { finish = resolve })
  })
  const props = { open: true, combo }
  f.render(props); await settle()
  const input = f.render(props)
  const first = input.props.onChange(); await input.props.onChange()
  assert.equal(posts, 1); assert.equal(f.render(props).props.disabled, true)
  finish({ ok: false, status: 503, json: async () => ({ error: 'DEFAULTS_UNAVAILABLE' }) }); await first
  assert.equal(f.render(props).props.disabled, true)
  assert.equal(f.render(props).props.checked, false)
  f.render({ ...props, open: false }); f.render(props); await settle()
  const pending = f.render(props).props.onChange()
  f.unmount(); finish(response(saved)); await pending
  const unavailable = fixture(async () => response({ ...saved, available: false }))
  unavailable.render({ ...props, combo: null }); await settle(); assert.equal(unavailable.render({ ...props, combo: null }).props.disabled, true)
})

test('singular backend CSRF error clears token for next explicit operation', async () => {
  const methods = []
  let reject = true
  const f = fixture(async (_path, options) => {
    methods.push(options.method)
    if (options.method === 'GET') return response({ ...saved, csrfToken: 'c'.repeat(64) })
    if (reject) { reject = false; return { ok: false, status: 403, json: async () => ({ error: 'DEFAULT_CSRF_INVALID' }) } }
    return response(saved)
  })
  await assert.rejects(f.request('api/chatgpt-defaults', { action: 'disable' }), /DEFAULT_CSRF_INVALID/)
  await f.request('api/chatgpt-defaults', { action: 'disable' })
  assert.deepEqual(methods, ['GET', 'POST', 'GET', 'POST'])
})

test('an unavailable saved account can be explicitly replaced, never automatically', async () => {
  const calls = []
  const f = fixture(async (_path, options) => {
    calls.push(options)
    return response(options.method === 'GET' ? { ...saved, accountId: 'removed', available: false, csrfToken: 'd'.repeat(64) } : saved)
  })
  const props = { open: true, combo }
  f.render(props); await settle()
  const input = f.render(props)
  assert.equal(calls.length, 1)
  assert.equal(input.props.checked, false)
  assert.equal(input.props.disabled, false)
  await input.props.onChange()
  assert.deepEqual(JSON.parse(calls[1].body), { action: 'save', ...combo })
  assert.equal(f.render(props).props.checked, true)
})

test('malformed CSRF token never authorizes POST', async () => {
  const methods = []
  const f = fixture(async (_path, options) => { methods.push(options.method); return response({ ...saved, csrfToken: 'A'.repeat(64) }) })
  await assert.rejects(f.request('api/chatgpt-defaults', { action: 'disable' }), /DEFAULT_CSRF_INVALID/)
  assert.deepEqual(methods, ['GET'])
})

test('POST obtains CSRF from GET before sending', async () => {
  const calls = []
  const f = fixture(async (_path, options) => { calls.push(options); return response(options.method === 'GET' ? { ...saved, csrfToken: 'c'.repeat(64) } : saved) })
  await f.request('api/chatgpt-defaults', { action: 'save', ...combo })
  assert.deepEqual(calls.map(c => c.method), ['GET', 'POST'])
  assert.equal(calls[1].headers['x-chatgpt-defaults-csrf'], 'c'.repeat(64))
})
