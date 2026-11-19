import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'

const source = readFileSync(new URL('../client/index.js', import.meta.url), 'utf8')
const start = source.indexOf('    function ResetChoiceCard(')
const end = source.indexOf('    Object.assign(copy.ru, {', start)
assert.ok(start >= 0 && end > start)
const cardSource = source.slice(start, end)

test('temporary picker lock blocks activation without native disabled dimming', () => {
  const Card = vm.runInNewContext(cardSource + '\nResetChoiceCard', {
    SimpleTheme: {},
    React: { useContext: () => false, useRef: current => ({ current }), useEffect() {} },
    h: (_, props) => props,
  })
  let clicks = 0
  const onClick = () => clicks++
  const locked = Card({ blocked: true, onClick })
  assert.equal(Boolean(locked.disabled), false)
  assert.equal(locked['aria-disabled'], true)
  locked.onClick({})
  const unavailable = Card({ disabled: true, onClick })
  assert.equal(unavailable.disabled, true)
  unavailable.onClick({})
  assert.equal(clicks, 0)
  Card({ onClick }).onClick({})
  assert.equal(clicks, 1)
})
