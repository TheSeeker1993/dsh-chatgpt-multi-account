import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'

const source = readFileSync(new URL('../client/index.js', import.meta.url), 'utf8')
const start = source.indexOf('    function settingsAccountsNewestFirst(')
const end = source.indexOf('    function GptLinkSection(', start)
assert.ok(start >= 0 && end > start)
const newestFirst = vm.runInNewContext(source.slice(start, end) + '\nsettingsAccountsNewestFirst')
const ids = list => Array.from(list, entry => entry.id)

test('settings account sorting is newest first and leaves the shared snapshot untouched', () => {
  const input = [{ id: 'middle', createdAt: 20 }, { id: 'old', createdAt: 10 }, { id: 'new', createdAt: 30 }]
  const output = newestFirst(input)
  assert.deepEqual(ids(output), ['new', 'middle', 'old'])
  assert.deepEqual(ids(input), ['middle', 'old', 'new'])
  assert.notEqual(output, input)
})

test('older hosts use copied reverse insertion order; equal creation times prefer the latest insertion', () => {
  const old = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
  assert.deepEqual(ids(newestFirst(old)), ['c', 'b', 'a'])
  assert.deepEqual(ids(old), ['a', 'b', 'c'])
  assert.deepEqual(ids(newestFirst([{ id: 'a', createdAt: 5 }, { id: 'b', createdAt: 5 }])), ['b', 'a'])
})

test('the sorted copy is used only by Settings, not the picker or defaults', () => {
  assert.equal((source.match(/settingsAccountsNewestFirst\(snapshot\.accounts\)/g) ?? []).length, 1)
  const settings = source.slice(source.indexOf('    function GptLinkSection('), source.indexOf('    function SessionAccountSelector('))
  assert.match(settings, /settingsAccountsNewestFirst\(snapshot\.accounts\)\.map/)
  assert.ok(settings.indexOf('h(AdminModeSetting') < settings.indexOf('settingsAccountsNewestFirst'), 'activation is discoverable before a long account list')
})
