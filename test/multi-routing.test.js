import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createRoutingAdapter, SESSION_PROVIDER, commonProfiles, MODEL_IDS } from '../multi/routing.js'

function fixture({ fail = false } = {}) {
  const events = []
  const bindings = new Map([['s1', 'a'], ['s2', 'b']])
  const metadataAdapter = {
    prepareCall: async (_p, id) => ({ model: { provider: 'openai-codex', id, name: id } }),
    resolveModel: async (_p, id) => ({ provider: 'openai-codex', id, name: id }),
    listModels: async () => [{ provider: 'openai-codex', id: 'model' }],
    providerRetryPolicy: () => ({}),
  }
  const adapter = createRoutingAdapter({
    LlmAdapter: class {}, metadataAdapter,
    makeAccountAdapter: store => ({
      prepareCall: async (_p, model) => ({
        stream: async function* (options) {
          events.push({ store, model, options })
          if (fail) throw new Error('provider failed')
          yield { account: store.id }
          yield { type: 'finish', replayState: { response: { id: 'native-response' }, blocks: [] } }
        },
      }),
    }),
  }, {
    credentialStore: id => ({ id }),
    acquireSession: async id => {
      if (!bindings.has(id)) throw Object.assign(new Error('select account'), { code: 'SESSION_ACCOUNT_REQUIRED' })
      const accountId = bindings.get(id)
      events.push(`acquire:${id}:${accountId}`)
      return { accountId, release: () => events.push(`release:${id}:${accountId}`) }
    },
  })
  return { adapter, bindings, events }
}
const request = id => Object.freeze({ provider: SESSION_PROVIDER, model: 'model', sessionId: id,
  messages: Object.freeze([{ role: 'assistant', source: Object.freeze({ kind: 'model', provider: SESSION_PROVIDER, model: 'model', replayState: { version: 1 } }), content: [] }]) })

test('parallel sessions use separate stores and preserve durable request', async () => {
  const { adapter, events } = fixture()
  const original = request('s1')
  const [a, b] = await Promise.all([Array.fromAsync(adapter.stream(original)), Array.fromAsync(adapter.stream(request('s2')))])
  assert.equal(a[0].account, 'a')
  assert.equal(b[0].account, 'b')
  assert.equal(original.provider, SESSION_PROVIDER)
  assert.equal(original.messages[0].source.provider, SESSION_PROVIDER)
  const dispatch = events.filter(e => typeof e === 'object')
  assert.equal(dispatch[0].options.provider, 'openai-codex')
  assert.equal(dispatch[0].options.messages[0].source.provider, 'openai-codex')
  assert.equal(events.filter(e => typeof e === 'string' && e.startsWith('release')).length, 2)
})

test('binding is captured once and lease releases on early consumer return', async () => {
  const { adapter, bindings, events } = fixture()
  const iterator = adapter.stream(request('s1'))[Symbol.asyncIterator]()
  assert.equal((await iterator.next()).value.account, 'a')
  bindings.set('s1', 'b')
  await iterator.return()
  assert.equal(events.at(-1), 'release:s1:a')
  assert.equal(events.filter(e => typeof e === 'object').length, 1)
})

test('provider errors release lease and missing selection never dispatches', async () => {
  const { adapter, events } = fixture({ fail: true })
  await assert.rejects(Array.fromAsync(adapter.stream(request('s1'))), /provider failed/)
  assert.equal(events.at(-1), 'release:s1:a')
  await assert.rejects(Array.fromAsync(adapter.stream(request('unbound'))), { code: 'SESSION_ACCOUNT_REQUIRED' })
  await assert.rejects(Array.fromAsync(adapter.stream({ ...request('s1'), sessionId: undefined })), { code: 'SESSION_ACCOUNT_REQUIRED' })
  assert.equal(events.filter(e => typeof e === 'object').length, 1)
})

test('abort after acquisition releases without provider dispatch', async () => {
  const controller = new AbortController()
  let released = false
  const adapter = createRoutingAdapter({ LlmAdapter: class {}, metadataAdapter: {}, makeAccountAdapter: () => { throw Error('must not dispatch') } }, {
    acquireSession: async () => { controller.abort(); return { accountId: 'a', release() { released = true } } },
  })
  await assert.rejects(Array.fromAsync(adapter.stream({ ...request('s1'), signal: controller.signal })), { name: 'AbortError' })
  assert.equal(released, true)
})

test('native replay is account-tagged and stripped after account switch', async () => {
  const { adapter, events, bindings } = fixture()
  const chunks = await Array.fromAsync(adapter.stream(request('s1')))
  const replayState = chunks.at(-1).replayState
  assert.equal(replayState.response.gptLinkAccount, 'a')
  const history = { ...request('s1'), messages: [{ role: 'assistant', content: [], source: {
    kind: 'model', provider: SESSION_PROVIDER, model: 'model', replayState,
  } }] }
  await Array.fromAsync(adapter.stream(history))
  assert.deepEqual(events.filter(e => typeof e === 'object').at(-1).options.messages[0].source.replayState.response, { id: 'native-response' })
  bindings.set('s1', 'b')
  await Array.fromAsync(adapter.stream(history))
  assert.equal(events.filter(e => typeof e === 'object').at(-1).options.messages[0].source.replayState, undefined)
})

test('catalog/prepare metadata exposes outer route without account lookup', async () => {
  const { adapter } = fixture()
  assert.equal((await adapter.prepareCall(SESSION_PROVIDER, 'model')).model.provider, SESSION_PROVIDER)
  assert.equal((await adapter.listModels())[0].provider, SESSION_PROVIDER)
})

test('common profile narrows catalog and provides immutable effort overrides', () => {
  const native = { getModels: () => MODEL_IDS.map(id => ({ id, provider: 'openai-codex', reasoning: true })) }
  const profile = commonProfiles(native, () => ({})).get('openai-codex')
  assert.equal(profile.piProvider.getModels().length, MODEL_IDS.length)
  assert.equal(profile.piProvider.getModels()[0].thinkingLevelMap.minimal, null)
  assert.equal(profile.piProvider.getModels()[0].thinkingLevelMap.xhigh, 'xhigh')
  assert.ok(Object.isFrozen(profile))
  assert.throws(() => commonProfiles({ getModels: () => [] }, () => ({})), { code: 'UNKNOWN_MODEL' })
})
