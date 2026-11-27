import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'

const source = readFileSync(new URL('../client/index.js', import.meta.url), 'utf8')
const start = source.indexOf('    function AdminModeSetting(')
const end = source.indexOf('    function settingsAccountsNewestFirst(', start)
assert.ok(start >= 0 && end > start)
const code = source.slice(start, end)
function fixture({ activated = false, failMode = false, failAccess = false } = {}) {
  const writes = [], failures = []
  const Setting = vm.runInNewContext(code + '\nAdminModeSetting', {
    React: { useState: () => [false, value => failures.push(value)], useId: () => 'activation-hint' },
    advancedActivation: { useEnabled: () => activated, write: value => { if (failAccess) throw Error('storage'); writes.push(['activation', value]) } },
    developerMode: { write: value => { if (failMode) throw Error('storage'); writes.push(['mode', value]) } },
    text: (_, key) => key,
    h: (type, props, ...children) => ({ type, props: props ?? {}, children }),
  })
  const tree = Setting({ t: null })
  const input = tree.children[0].children[0]
  return { tree, input, writes, failures }
}

test('settings activation is an accessible labelled switch with its own explained persistent permission', () => {
  const f = fixture()
  assert.equal(f.tree.props['data-gl-advanced-activation'], true)
  assert.equal(f.input.props.role, 'switch')
  assert.equal(f.input.props.checked, false)
  assert.equal(f.input.props['aria-describedby'], 'activation-hint')
  assert.equal(f.tree.children[0].children[1].props['aria-hidden'], true)
  assert.equal(f.tree.children[1].props.id, 'activation-hint')
})

test('first Settings activation enables the mode before granting picker access, and deactivation revokes both', () => {
  const f = fixture()
  f.input.props.onChange({ target: { checked: true } })
  f.input.props.onChange({ target: { checked: false } })
  assert.deepEqual(f.writes, [['mode', true], ['activation', true], ['mode', false], ['activation', false]])
})

test('storage failure cannot grant access after a failed mode write and remains visible', () => {
  const f = fixture({ failMode: true })
  f.input.props.onChange({ target: { checked: true } })
  assert.deepEqual(f.writes, [])
  assert.deepEqual(f.failures, [true])
  const access = fixture({ failAccess: true })
  access.input.props.onChange({ target: { checked: true } })
  assert.deepEqual(access.writes, [['mode', true]])
  assert.deepEqual(access.failures, [true])
})
