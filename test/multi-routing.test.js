import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createRoutingAdapter, SESSION_PROVIDER, commonProfiles } from '../multi/routing.js'

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

const definition = (id, name = id) => ({ id, name, provider: 'openai-codex', api: 'openai-codex-responses',
  input: ['text'], reasoning: true, contextWindow: 123456, maxTokens: 4321,
  cost: { input: 1, output: 2, cacheRead: 0, cacheWrite: 0 },
  thinkingLevelMap: { minimal: null, low: 'native-low', xhigh: null }, compat: { supportsStore: false } })

test('common profiles preserve independent native records and capabilities without an allowlist', () => {
  const fresh = definition('synthetic-fresh-sol')
  const models = commonProfiles({ getModels: () => [null, { id: 'broken' }, fresh] }, () => ({})).get('openai-codex').piProvider.getModels()
  assert.deepEqual(models, [fresh])
  assert.ok(Object.isFrozen(models[0].thinkingLevelMap))
  assert.ok(!Object.isFrozen(fresh.thinkingLevelMap), 'do not freeze shared native records')
  assert.equal(commonProfiles({ getModels: () => [] }, () => ({})).get('openai-codex').piProvider.getModels().length, 0)
})

function dynamicFixture({ global = {}, account } = {}) {
  let models = [{ ...definition('synthetic-fresh-sol', 'old'), ...global }]
  const events = []
  const catalog = { version: 1, knownModels: () => models, available: async (accountId, id) => {
    events.push(`available:${accountId}:${id}`)
    if (accountId !== 'a' || id !== models[0].id) throw Object.assign(Error('unavailable'), { code: 'MODEL_UNAVAILABLE' })
    return account ? { ...models[0], ...account } : models[0]
  } }
  const adapter = createRoutingAdapter({ LlmAdapter: class {}, catalog,
    metadataAdapter: () => { const captured = models[0]; return {
      listModels: async () => [captured], resolveModel: async () => captured,
      prepareCall: async () => ({ model: captured }),
    } },
    makeAccountAdapter: (store, captured) => ({ prepareCall: async (_provider, id) => ({
      stream: async function* (options) { events.push({ id, captured, store, options }); yield captured.name; yield captured.name },
    }) }),
  }, { credentialStore: id => ({ id }), acquireSession: async sessionId => ({ accountId: sessionId,
    release() { events.push(`release:${sessionId}`) } }) })
  return { adapter, events, update() { models = [definition('synthetic-fresh-sol', 'new')]; /* another view may reuse version 1 */ } }
}
const dynamicRequest = account => ({ ...request(account), model: 'synthetic-fresh-sol', reasoningEffort: 'low' })

test('fresh synthetic model reaches metadata and exact native dispatch; availability stays account scoped', async () => {
  const { adapter, events } = dynamicFixture()
  assert.equal((await adapter.listModels())[0].id, 'synthetic-fresh-sol')
  assert.equal((await adapter.resolveModel(SESSION_PROVIDER, 'synthetic-fresh-sol')).provider, SESSION_PROVIDER)
  const prepared = await adapter.prepareCall(SESSION_PROVIDER, 'synthetic-fresh-sol')
  assert.deepEqual(await Array.fromAsync(prepared.stream(dynamicRequest('a'))), ['old', 'old'])
  assert.equal(events.find(e => typeof e === 'object').id, 'synthetic-fresh-sol')
  await assert.rejects(Array.fromAsync(adapter.stream(dynamicRequest('b'))), { code: 'MODEL_UNAVAILABLE' })
  assert.equal(events.at(-1), 'release:b')
  assert.equal(events.filter(e => typeof e === 'object').length, 1)
})

test('catalog replacement preserves prepared and running snapshots but next dispatch sees new definition', async () => {
  const { adapter, update } = dynamicFixture()
  const prepared = await adapter.prepareCall(SESSION_PROVIDER, 'synthetic-fresh-sol')
  const iterator = adapter.stream(dynamicRequest('a'))
  assert.equal((await iterator.next()).value, 'old')
  update()
  assert.equal((await adapter.listModels())[0].name, 'new')
  assert.equal((await iterator.next()).value, 'old')
  await iterator.return()
  assert.deepEqual(await Array.fromAsync(prepared.stream(dynamicRequest('a'))), ['old', 'old'])
  assert.deepEqual(await Array.fromAsync(adapter.stream(dynamicRequest('a'))), ['new', 'new'])
})

test('native per-model reasoning map rejects unsupported effort before dispatch and releases lease', async () => {
  const { adapter, events } = dynamicFixture()
  await assert.rejects(Array.fromAsync(adapter.stream({ ...dynamicRequest('a'), reasoningEffort: 'xhigh' })), { code: 'UNSUPPORTED_REASONING_EFFORT' })
  assert.equal(events.at(-1), 'release:a')
  assert.equal(events.filter(e => typeof e === 'object').length, 0)
})

test('prepared global metadata cannot widen account reasoning, inputs or capacities', async () => {
  const global = { contextWindow: 500000, maxTokens: 30000, input: ['text', 'image'],
    thinkingLevelMap: { low: 'old-wire-low', high: 'old-wire-high', off: null } }
  const account = { contextWindow: 100000, maxTokens: 10000, input: ['text'],
    thinkingLevelMap: { off: null, minimal: null, low: 'new-wire-low', medium: null, high: null, xhigh: null, max: null },
    cost: { input: 999 }, compat: { supportsStore: true } }
  const { adapter, events } = dynamicFixture({ global, account })
  const prepared = await adapter.prepareCall(SESSION_PROVIDER, 'synthetic-fresh-sol')
  assert.equal(prepared.model.contextWindow, 500000)
  await assert.rejects(Array.fromAsync(prepared.stream({ ...dynamicRequest('a'), reasoningEffort: 'high' })), { code: 'UNSUPPORTED_REASONING_EFFORT' })
  assert.equal(events.at(-1), 'release:a')
  assert.equal(events.filter(e => typeof e === 'object').length, 0)
  await Array.fromAsync(prepared.stream(dynamicRequest('a')))
  const dispatched = events.find(e => typeof e === 'object').captured
  assert.equal(dispatched.contextWindow, 100000)
  assert.equal(dispatched.maxTokens, 10000)
  assert.deepEqual(dispatched.input, ['text'])
  assert.equal(dispatched.thinkingLevelMap.low, 'old-wire-low')
  assert.equal(dispatched.thinkingLevelMap.high, null)
  assert.deepEqual(dispatched.cost, definition('synthetic-fresh-sol').cost)
  assert.deepEqual(dispatched.compat, { supportsStore: false })
  assert.ok(Object.isFrozen(dispatched))
  assert.deepEqual(global.input, ['text', 'image'])
})

test('later wider account metadata never widens previously prepared capabilities', async () => {
  const { adapter, events } = dynamicFixture({
    global: { contextWindow: 50000, maxTokens: 4000, thinkingLevelMap: { high: null } },
    account: { contextWindow: 500000, maxTokens: 10000, input: ['text', 'image'], thinkingLevelMap: { high: 'high' } },
  })
  const prepared = await adapter.prepareCall(SESSION_PROVIDER, 'synthetic-fresh-sol')
  await assert.rejects(Array.fromAsync(prepared.stream({ ...dynamicRequest('a'), reasoningEffort: 'high' })), { code: 'UNSUPPORTED_REASONING_EFFORT' })
  await Array.fromAsync(prepared.stream(dynamicRequest('a')))
  const dispatched = events.find(e => typeof e === 'object').captured
  assert.equal(dispatched.contextWindow, 50000)
  assert.equal(dispatched.maxTokens, 4000)
  assert.deepEqual(dispatched.input, ['text'])
})
