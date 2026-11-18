import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'

// Execute the real client module factory, without applying the plugin or rendering UI.
function loadSetup(react = { createElement() { return null } }) {
  const source = readFileSync(new URL('../client/index.js', import.meta.url), 'utf8')
  const marker = '    function SubagentSetup('
  assert.equal(source.split(marker).length, 2, 'production setup exposure marker must occur once')
  let definition
  const context = vm.createContext({
    window: { __ModuleLoader__: { load(value) { definition = value } } },
    EventTarget,
    Event, AbortController, setInterval, clearInterval,
  })
  vm.runInContext(source.replace(marker,
    '    globalThis.__setup = {readSubagentSettings, configureSubagentModels, SubagentSetup};\n' + marker), context,
  { filename: 'client/index.js' })
  assert.equal(typeof definition?.factory, 'function')
  definition.factory(name => {
    assert.equal(name, 'react')
    return react
  })
  return context.__setup
}

// Values crossing the vm boundary have different prototypes.
const plain = value => JSON.parse(JSON.stringify(value))
// Minimal deterministic hook renderer: effects run after render, refs/state persist.
function setupView(remote) {
  const slots = []
  let cursor = 0
  let effects = []
  const react = {
    createElement(type, props, ...children) { return { type, props: props ?? {}, children: children.flat(Infinity).filter(value => value != null && value !== false) } },
    useState(initial) {
      const index = cursor++
      if (!(index in slots)) slots[index] = initial
      return [slots[index], value => { slots[index] = typeof value === 'function' ? value(slots[index]) : value }]
    },
    useRef(initial) {
      const index = cursor++
      if (!(index in slots)) slots[index] = { current: initial }
      return slots[index]
    },
    useEffect(effect, deps) {
      const index = cursor++
      if (!slots[index] || deps.some((value, i) => value !== slots[index][i])) effects.push(effect)
      slots[index] = deps
    },
  }
  const { SubagentSetup } = loadSetup(react)
  let tree
  const render = (catalog = { freshness: 'fresh', models: models.map(id => ({ id, compatible: true })) }) => {
    cursor = 0
    tree = SubagentSetup({ remote, catalog, t: key => key })
    const pending = effects; effects = []
    pending.forEach(effect => effect())
    return tree
  }
  const nodes = (node = tree) => typeof node === 'object' ? [node, ...node.children.flatMap(child => nodes(child))] : []
  return {
    render,
    button(label) { return nodes().find(node => node.type === 'button' && node.children.includes(label)) },
    has(label, role) { return nodes().some(node => (!role || node.props.role === role) && node.children.includes(label)) },
  }
}
const settle = () => new Promise(resolve => setImmediate(resolve))

const namespace = 'subagent-model-selection-settings'
const models = ['gpt-6-astra', 'gpt-6.1-sol', 'gpt-6-sol', 'gpt-6-luna', 'gpt-5.6-sol', 'gpt-5.6-terra', 'gpt-5.6-luna', 'gpt-5.5', 'gpt-5.3-codex-spark']
const routes = () => models.map(model => ({ provider: 'chatgpt-session', model }))
const descriptor = (allowedModels = [], enabled = false, revision = 3) => ({ ns: namespace, revision, value: { enabled, allowedModels } })
const described = (entry = descriptor(), writable = true) => ({ ok: true, value: { writable, namespaces: [entry] } })

function mockRemote(initial) {
  let current = initial
  const calls = { describe: 0, mutate: [] }
  return {
    calls,
    set(value) { current = value },
    settings: {
      async describe() { calls.describe++; return current },
      async mutate(ns, operations, revision) {
        calls.mutate.push(plain([ns, operations, revision]))
        const old = current.value.namespaces.find(entry => entry.ns === ns)
        current = described(descriptor(plain(operations[1].value), operations[0].value, old.revision + 1))
        return { ok: true }
      },
    },
  }
}

test('production setup reads provided catalog candidates without mutation', async () => {
  const setup = loadSetup()
  const entry = descriptor(routes(), true)
  const remote = mockRemote(described(entry))
  assert.deepEqual(plain(await setup.readSubagentSettings(remote, models)), { descriptor: entry, writable: true, configured: true })
  assert.equal(remote.calls.describe, 1)
  assert.equal(remote.calls.mutate.length, 0)
})

test('setup enables all nine while preserving unknown/unavailable routes, metadata and order', async () => {
  const setup = loadSetup()
  const existing = [
    { provider: 'unavailable-provider', model: 'unknown-model', extra: 'preserve' },
    { provider: 'chatgpt-session', model: models[2] },
    { provider: 'other', model: models[0] },
    { provider: 'chatgpt-session', model: 'future-model' },
  ]
  const original = structuredClone(existing)
  const remote = mockRemote(described(descriptor(existing)))
  const result = await setup.configureSubagentModels(remote, models)
  const expected = [...existing, ...routes().filter(route => route.model !== models[2])]
  assert.deepEqual(remote.calls.mutate, [[namespace, [
    { op: 'set', path: ['enabled'], value: true },
    { op: 'set', path: ['allowedModels'], value: expected },
  ], 3]])
  assert.deepEqual(existing, original, 'do not modify the settings snapshot')
  assert.equal(result.configured, true)
  assert.equal(result.descriptor.revision, 4)
  assert.equal(remote.calls.describe, 2, 'confirm persisted state after saving')
  await setup.configureSubagentModels(remote, models)
  assert.equal(remote.calls.mutate.length, 1, 'already configured is a no-op')
})

test('previous seven enabled routes retain existing permissions and append exactly two new models', async () => {
  const setup = loadSetup()
  const existing = [
    { provider: 'openai-codex', model: 'gpt-5.5', metadata: 'keep' },
    ...routes().slice(0, 7),
    { provider: 'other', model: 'custom', metadata: { allowed: true } },
  ]
  const original = structuredClone(existing)
  const remote = mockRemote(described(descriptor(existing, true)))
  assert.equal((await setup.readSubagentSettings(remote, models)).configured, false)
  const result = await setup.configureSubagentModels(remote, models)
  assert.deepEqual(remote.calls.mutate, [[namespace, [
    { op: 'set', path: ['enabled'], value: true },
    { op: 'set', path: ['allowedModels'], value: [...existing,
      { provider: 'chatgpt-session', model: 'gpt-5.5' },
      { provider: 'chatgpt-session', model: 'gpt-5.3-codex-spark' }] },
  ], 3]])
  assert.deepEqual(existing, original)
  assert.equal(result.configured, true)
  await setup.configureSubagentModels(remote, models)
  assert.equal(remote.calls.mutate.length, 1)
})

test('disabled complete allow-list still requires enabling, without duplicate models', async () => {
  const setup = loadSetup()
  const remote = mockRemote(described(descriptor(routes(), false)))
  assert.equal((await setup.readSubagentSettings(remote, models)).configured, false)
  await setup.configureSubagentModels(remote, models)
  assert.deepEqual(remote.calls.mutate[0][1][1].value, routes())
  assert.equal(remote.calls.mutate[0][1][0].value, true)
})

test('action reads fresh state and revision rather than overwriting the displayed snapshot', async () => {
  const setup = loadSetup()
  const remote = mockRemote(described(descriptor([], false, 3)))
  await setup.readSubagentSettings(remote, models)
  const added = { provider: 'concurrent-provider', model: 'new-route' }
  remote.set(described(descriptor([added], false, 19)))
  await setup.configureSubagentModels(remote, models)
  assert.equal(remote.calls.mutate[0][2], 19)
  assert.deepEqual(remote.calls.mutate[0][1][1].value, [added, ...routes()])
})

test('revision conflict is surfaced once without retry or a stale follow-up write', async () => {
  const setup = loadSetup()
  const remote = mockRemote(described())
  remote.settings.mutate = async (...args) => {
    remote.calls.mutate.push(plain(args))
    remote.set(described(descriptor([{ provider: 'other', model: 'concurrent' }], false, 4)))
    return { ok: false, error: { code: 'settings/conflict' } }
  }
  await assert.rejects(setup.configureSubagentModels(remote, models), /setupConflict/)
  assert.equal(remote.calls.describe, 1)
  assert.equal(remote.calls.mutate.length, 1)
  assert.equal(remote.calls.mutate[0][2], 3)
})

test('unavailable and malformed settings refuse safely before any write', async t => {
  const setup = loadSetup()
  const cases = [
    ['unavailable', { ok: false }],
    ['missing namespace', { ok: true, value: { writable: true, namespaces: [] } }],
    ['malformed namespaces', { ok: true, value: { writable: true, namespaces: null } }],
    ['invalid revision', described({ ...descriptor(), revision: '3' })],
    ['invalid enabled', described({ ...descriptor(), value: { enabled: 'yes', allowedModels: [] } })],
    ['invalid list', described({ ...descriptor(), value: { enabled: false, allowedModels: {} } })],
    ['invalid route', described(descriptor([{ provider: 'other', model: null }]))],
    ['null route', described(descriptor([null]))],
  ]
  for (const [name, value] of cases) await t.test(name, async () => {
    const remote = mockRemote(value)
    await assert.rejects(setup.configureSubagentModels(remote, models))
    assert.equal(remote.calls.mutate.length, 0)
  })
  const remote = mockRemote(described())
  remote.settings.describe = async () => { throw new Error('offline') }
  await assert.rejects(setup.configureSubagentModels(remote, models), /offline/)
  assert.equal(remote.calls.mutate.length, 0)
  await assert.rejects(setup.configureSubagentModels({}))
})

test('read-only settings remain readable but cannot be changed, even if configured', async () => {
  const setup = loadSetup()
  for (const complete of [false, true]) {
    const remote = mockRemote(described(descriptor(complete ? routes() : [], complete), false))
    assert.equal((await setup.readSubagentSettings(remote, models)).writable, false)
    await assert.rejects(setup.configureSubagentModels(remote, models), /setupReadOnly/)
    assert.equal(remote.calls.mutate.length, 0)
  }
})

test('post-save concurrent changes fail verification without retries or false success', async () => {
  const setup = loadSetup()
  const remote = mockRemote(described())
  remote.settings.mutate = async (...args) => {
    remote.calls.mutate.push(plain(args))
    remote.set(described(descriptor([], false, 5)))
    return { ok: true }
  }
  await assert.rejects(setup.configureSubagentModels(remote, models), /setupConflict/)
  assert.equal(remote.calls.describe, 2)
  assert.equal(remote.calls.mutate.length, 1)

  const view = setupView(remote)
  view.render(); await settle(); view.render()
  view.button('setupAction').props.onClick(); view.render()
  await view.button('setupApply').props.onClick(); view.render()
  assert.equal(view.has('setupConflict', 'alert'), true)
  assert.equal(view.has('setupSaved', 'status'), false)
  assert.equal(view.has('setupReady', 'status'), false)
  assert.equal(remote.calls.mutate.length, 2, 'one save per separately confirmed action')
})

test('setup UI only reads on mount; opening and cancelling confirmation never writes', async () => {
  const remote = mockRemote(described())
  const view = setupView(remote)
  view.render()
  view.render()
  assert.equal(view.has('loading', 'status'), true)
  assert.equal(view.button('setupAction').props.disabled, true)
  await settle(); view.render()
  assert.equal(remote.calls.describe, 1)
  assert.equal(remote.calls.mutate.length, 0)
  assert.equal(view.has('setupNeeded', 'status'), true)
  view.button('setupAction').props.onClick(); view.render()
  assert.ok(view.button('setupApply'))
  assert.equal(view.has('setupConfirm'), true)
  assert.equal(remote.calls.mutate.length, 0)
  view.button('cancel').props.onClick(); view.render()
  assert.equal(view.button('setupApply'), undefined)
  assert.equal(remote.calls.mutate.length, 0)
})

test('setup UI confirms explicitly once, disables busy controls and guards duplicate clicks', async () => {
  const remote = mockRemote(described())
  const view = setupView(remote)
  view.render(); await settle(); view.render()
  view.button('setupAction').props.onClick(); view.render()
  const originalMutate = remote.settings.mutate
  let release
  remote.settings.mutate = async (...args) => {
    await new Promise(resolve => { release = resolve })
    return originalMutate(...args)
  }
  const confirm = view.button('setupApply').props.onClick
  const first = confirm()
  const duplicate = confirm()
  view.render()
  assert.equal(view.has('loading', 'status'), true)
  assert.equal(view.button('setupApply').props.disabled, true)
  assert.equal(view.button('cancel').props.disabled, true)
  await settle()
  assert.equal(typeof release, 'function')
  release(); await Promise.all([first, duplicate]); view.render()
  assert.equal(remote.calls.mutate.length, 1)
  assert.equal(remote.calls.describe, 3, 'mount, fresh action read, persisted-state read')
  assert.equal(view.has('setupSaved', 'status'), true)
  assert.equal(view.has('setupReady', 'status'), true)
  assert.equal(view.button('setupAction').props.disabled, true)
  assert.equal(view.button('setupApply'), undefined)
})

test('setup UI unavailable and read-only states disable configuration without writes', async () => {
  for (const response of [{ ok: false }, described(descriptor(), false)]) {
    const remote = mockRemote(response)
    const view = setupView(remote)
    view.render(); await settle(); view.render()
    assert.equal(view.button('setupAction').props.disabled, true)
    assert.equal(view.has(response.ok ? 'setupReadOnly' : 'setupUnavailable'), true)
    assert.equal(remote.calls.mutate.length, 0)
  }
})

test('failed saves are surfaced without retry or a false success reread', async () => {
  const setup = loadSetup()
  const remote = mockRemote(described())
  remote.settings.mutate = async (...args) => {
    remote.calls.mutate.push(plain(args))
    return { ok: false, error: { code: 'settings/invalid' } }
  }
  await assert.rejects(setup.configureSubagentModels(remote, models), /setupFailed/)
  assert.equal(remote.calls.mutate.length, 1)
  assert.equal(remote.calls.describe, 1)
})

 test('new account catalog model is explicitly added; empty candidates cannot mutate', async () => {
  const setup = loadSetup(), remote = mockRemote(described())
  await assert.rejects(setup.configureSubagentModels(remote, []), /setupUnavailable/)
  assert.equal(remote.calls.mutate.length, 0)
  await setup.configureSubagentModels(remote, ['gpt-99-sol'])
  assert.deepEqual(remote.calls.mutate[0][1][1].value, [{ provider: 'chatgpt-session', model: 'gpt-99-sol' }])
})


test('catalog version change closes confirmation visibly and requires a new explicit consent', async () => {
  const existing = { provider: 'other', model: 'keep', metadata: 'untouched' }
  const remote = mockRemote(described(descriptor([existing])))
  const view = setupView(remote)
  const first = { accountId: 'a', version: 'v1', freshness: 'fresh', models: [{ id: 'new-sol', compatible: true }] }
  const second = { ...first, version: 'v2' }
  view.render(first); await settle(); view.render(first)
  view.button('setupAction').props.onClick(); view.render(first)
  assert.ok(view.button('setupApply'))
  view.render(second)
  assert.equal(view.button('setupApply').props.disabled, true)
  view.render(second)
  assert.equal(view.button('setupApply'), undefined)
  assert.equal(view.has('setupConflict', 'alert'), true)
  assert.equal(remote.calls.mutate.length, 0)
  view.button('setupAction').props.onClick(); view.render(second)
  await view.button('setupApply').props.onClick(); view.render(second)
  assert.equal(remote.calls.mutate.length, 1)
  assert.deepEqual(remote.calls.mutate[0][1][1].value, [existing, { provider: 'chatgpt-session', model: 'new-sol' }])
  assert.equal(view.has('setupSaved', 'status'), true)
})
