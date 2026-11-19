import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'

const source = readFileSync(new URL('../client/index.js', import.meta.url), 'utf8')

test('simple theme persists separately and skips animated card setup and decoration', () => {
  const storage = new Map()
  const window = new EventTarget()
  let definition, updates = 0, unsubscribe
  window.__ModuleLoader__ = { load(value) { definition = value } }
  window.localStorage = { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) }
  const context = vm.createContext({ window, Event, EventTarget })
  vm.runInContext(source.replace('    function UnifiedPicker(', '    globalThis.ui = { developerMode, MiniCardOrb, ResetChoiceCard };\n    function UnifiedPicker('), context)
  definition.factory(() => ({
    createContext: value => ({ value }),
    createElement: (type, props) => ({ type, props }),
    useContext: () => !context.ui.developerMode.useEnabled(),
    useRef: current => ({ current }),
    useEffect: effect => effect(), // No matchMedia or animation APIs supplied: the lightweight branch must not touch them.
    useSyncExternalStore(subscribe, read) { unsubscribe ??= subscribe(() => updates++); return read() },
  }))
  const { developerMode, MiniCardOrb, ResetChoiceCard } = context.ui
  assert.equal(developerMode.useEnabled(), false)
  developerMode.write(false)
  assert.equal(updates, 1)
  assert.equal(developerMode.useEnabled(), false)

  assert.equal(MiniCardOrb({}), null)
  assert.match(MiniCardOrb({ quota: true }).props.className, /gl-static-quota/)
  assert.equal(ResetChoiceCard({}).type, 'button')
  unsubscribe()
  developerMode.write(true)
  assert.equal(updates, 1)
  assert.doesNotMatch(MiniCardOrb({ quota: true }).props.className, /gl-static-quota/)
})
