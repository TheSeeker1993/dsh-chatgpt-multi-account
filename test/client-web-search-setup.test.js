import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'

const source = readFileSync(new URL('../client/index.js', import.meta.url), 'utf8')
const start = source.indexOf('    const AUTO_WEB_SEARCH =')
const end = source.indexOf('    function WebSearchSetup(', start)
assert.ok(start >= 0 && end > start)
const { readWebSearchSetup, enableWebSearchSetup } = vm.runInNewContext(source.slice(start, end) + '\n({ readWebSearchSetup, enableWebSearchSetup })')
const auto = 'model-aware-search'
const deepseek = 'deepseek-search-api'
const ok = value => ({ ok: true, value })
function fixture() {
  const calls = []
  const config = { provider: deepseek, base: undefined, revision: 3, writable: true, available: true, fetchProvider: 'http' }
  const remote = {
    web: { listProviders: async () => ok({ search: [{ id: deepseek, title: 'DeepSeek Search API' }, ...(config.available ? [{ id: auto }] : [])], fetch: [] }) },
    settings: {
      describe: async () => ok({ writable: config.writable, namespaces: [{ ns: 'web', revision: config.revision,
        value: { searchProvider: config.provider, fetchProvider: config.fetchProvider }, base: { searchProvider: config.base } }] }),
      mutate: async (ns, ops, revision) => {
        calls.push(JSON.parse(JSON.stringify({ ns, ops, revision })))
        config.provider = ops[0].op === 'unset' ? config.base : ops[0].value
        config.revision++
        return ok({})
      },
    },
  }
  return { config, remote, calls }
}

test('web search status is read-only and distinguishes the native automatic option', async () => {
  const f = fixture()
  assert.equal((await readWebSearchSetup(f.remote)).title, 'DeepSeek Search API')
  f.config.provider = undefined
  const state = await readWebSearchSetup(f.remote)
  assert.equal(state.provider, null)
  assert.equal(state.title, null)
  assert.equal(state.available, true)
  assert.deepEqual(f.calls, [])
})

test('explicit enable writes only the search provider and verifies the result', async () => {
  const f = fixture()
  const state = await readWebSearchSetup(f.remote)
  const saved = await enableWebSearchSetup(f.remote, state)
  assert.equal(saved.provider, auto)
  assert.equal(f.config.fetchProvider, 'http')
  assert.deepEqual(f.calls, [{ ns: 'web', ops: [{ op: 'set', path: ['searchProvider'], value: auto }], revision: 3 }])
  await enableWebSearchSetup(f.remote, saved)
  assert.equal(f.calls.length, 1)
})

test('enable adopts the composed Auto provider without redundant override', async () => {
  const f = fixture(); f.config.base = auto
  await enableWebSearchSetup(f.remote, await readWebSearchSetup(f.remote))
  assert.deepEqual(f.calls, [{ ns: 'web', ops: [{ op: 'unset', path: ['searchProvider'] }], revision: 3 }])
})

test('changed selection, revision or base, missing provider, and read-only settings prevent the write', async () => {
  for (const [patch, code] of [[{ revision: 4 }, 'webSearchConflict'], [{ provider: 'other' }, 'webSearchConflict'],
    [{ base: auto }, 'webSearchConflict'], [{ available: false }, 'webSearchUnavailable'], [{ writable: false }, 'setupReadOnly']]) {
    const f = fixture()
    const state = await readWebSearchSetup(f.remote)
    Object.assign(f.config, patch)
    await assert.rejects(enableWebSearchSetup(f.remote, state), { message: code })
    assert.deepEqual(f.calls, [])
  }
})

test('save conflicts and unverified saves do not retry or report success', async () => {
  for (const [result, code] of [[{ ok: false, error: { code: 'settings/conflict' } }, 'webSearchConflict'], [ok({}), 'webSearchSaveUnknown']]) {
    const f = fixture()
    let attempts = 0
    f.remote.settings.mutate = async () => { attempts++; return result }
    await assert.rejects(enableWebSearchSetup(f.remote, await readWebSearchSetup(f.remote)), { message: code })
    assert.equal(attempts, 1)
  }
})
