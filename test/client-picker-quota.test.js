import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'

const source = readFileSync(new URL('../client/index.js', import.meta.url), 'utf8')
const start = source.indexOf('      const loadQuota = React.useCallback(async (ids')
const end = source.indexOf('      const loadResets =', start)
assert.ok(start >= 0 && end > start)

function fixture() {
  const requests = []
  let quotas = {}
  const load = vm.runInNewContext(source.slice(start, end) + '\nloadQuota', {
    React: { useCallback: fn => fn }, quotaRequests: { current: new Map() },
    request: (_url, body) => new Promise(resolve => requests.push({ resolve, body })),
    setQuotas: update => { quotas = update(quotas) },
  })
  return { load, requests, quota: () => quotas.a }
}

test('opening replaces an aborted quota request and ignores its late result', async () => {
  const { load, requests, quota } = fixture()
  const old = new AbortController()
  const closed = load(['a'], false, old.signal)
  old.abort()
  const opened = load(['a'], false, new AbortController().signal)
  assert.equal(requests.length, 2)
  requests[1].resolve(42); await opened
  requests[0].resolve(7); await closed
  assert.equal(quota(), 42)
})

test('manual refresh supersedes a read and joins an existing refresh', async () => {
  const { load, requests, quota } = fixture()
  const read = load(['a'])
  const refresh = load(['a'], true)
  let joinedFinished = false
  const joined = load(['a'], true).then(() => { joinedFinished = true })
  assert.equal(requests.length, 2)
  assert.equal(typeof requests[1].body, 'object')
  requests[0].resolve(7); await read
  assert.equal(joinedFinished, false)
  assert.equal(quota(), undefined)
  requests[1].resolve(42); await Promise.all([refresh, joined])
  assert.equal(quota(), 42)
})
