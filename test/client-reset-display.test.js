import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'

const source = readFileSync(new URL('../client/index.js', import.meta.url), 'utf8')
const preference = source.slice(source.indexOf('    const resetDisplayKey ='), source.indexOf('    const useResetDisplay ='))

test('reset display is off initially, persists across mounts and notifies subscribers', () => {
  const items = new Map()
  const mount = () => {
    const window = new EventTarget()
    window.localStorage = { getItem: key => items.get(key), setItem: (key, value) => items.set(key, value) }
    return vm.runInNewContext(preference + '\n({ readResetDisplay, writeResetDisplay, subscribeResetDisplay })', { window, EventTarget, Event })
  }
  const first = mount()
  assert.equal(first.readResetDisplay(), false)
  const changes = []
  const unsubscribe = first.subscribeResetDisplay(() => changes.push(first.readResetDisplay()))
  first.writeResetDisplay(true)
  const second = mount()
  assert.equal(second.readResetDisplay(), true)
  first.writeResetDisplay(false)
  assert.equal(second.readResetDisplay(), false)
  unsubscribe()
  first.writeResetDisplay(true)
  assert.deepEqual(changes, [true, false])
})
