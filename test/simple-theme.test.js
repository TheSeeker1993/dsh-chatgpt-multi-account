import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'

const source = readFileSync(new URL('../client/index.js', import.meta.url), 'utf8')
const preferenceSource = source.slice(source.indexOf('    function displayPreference('), source.indexOf('    Object.assign(copy.ru, { adminMode:'))

function preferences(items = new Map()) {
  const window = new EventTarget()
  window.localStorage = { getItem: key => items.get(key), setItem: (key, value) => items.set(key, value) }
  const React = { useSyncExternalStore(_subscribe, read) { return read() } }
  return vm.runInNewContext(preferenceSource + '\n;({ developerMode, advancedActivation })', { window, Event, EventTarget, React })
}

test('advanced access is separate, off by default, and cannot be granted by the legacy mode key', () => {
  const items = new Map([['dsh-chatgpt-multi-account:developer-mode', '1']])
  const state = preferences(items)
  assert.equal(state.developerMode.useEnabled(), true)
  assert.equal(state.advancedActivation.useEnabled(), false)
  state.advancedActivation.write(true)
  assert.equal(state.advancedActivation.useEnabled(), true)
  state.developerMode.write(false)
  assert.equal(state.advancedActivation.useEnabled(), true, 'picker off does not revoke access')
  const remount = preferences(items)
  assert.equal(remount.advancedActivation.useEnabled(), true)
  assert.equal(remount.developerMode.useEnabled(), false)
})

test('basic functionality shares the existing advanced skin and gates only advanced controls', () => {
  assert.doesNotMatch(source, /SimpleTheme|data-gl-simple|gl-static-quota/)
  assert.match(source, /const simple = !\(activated && modeEnabled\)/)
  assert.match(source, /const showResets = !simple/)
  assert.match(source, /activated \? h\('label', \{ className: 'gl-new-chat-defaults gl-picker-admin-switch'/)
  assert.match(source, /Math\.min\(440, window\.innerWidth - edge \* 2\)/)
})

test('visible native-switch companions support checked, focus-visible, reduced-motion and high-contrast states', () => {
  assert.match(source, /input:checked \+ \.gl-switch-track/)
  assert.match(source, /input:focus-visible \+ \.gl-switch-track/)
  assert.match(source, /@media\(forced-colors:active\)/)
  assert.match(source, /@media\(prefers-reduced-motion:reduce\)\{\.gl-switch-track::before/)
  assert.match(source, /width:32px;height:20px/)
  assert.match(source, /min-height:30px/)
  assert.equal((source.match(/className: 'gl-switch-track', 'aria-hidden': true/g) ?? []).length, 3)
})
