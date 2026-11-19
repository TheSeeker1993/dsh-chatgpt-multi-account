import test from 'node:test'
import assert from 'node:assert/strict'
import { catalogIdentity, confirmedCatalogModel, createCatalogRegistry } from '../multi/catalog-registration.js'
import { createCatalogReporter } from '../multi/catalog-report.js'
import { createRoutingAdapter, MODEL_IDS } from '../multi/routing.js'

const ID = 'gpt-synthetic-catalog'
const fixture = () => ({ slug: ID, visibility: 'list', tool_mode: 'direct', use_responses_lite: false,
  dsh_adapter_compatibility: { version: 1, api: 'openai-codex-responses', auth: 'openai-codex-oauth',
    base_url: 'https://chatgpt.com/backend-api', endpoint: '/codex/responses', streaming: 'sse',
    tools: 'json-schema-function', tool_results: 'function-call-output', replay: 'codex-responses-v1', max_output_tokens: 'client-omitted' },
  context_window: 256000, max_output_tokens: 64000, input_modalities: ['text'],
  supported_reasoning_levels: [{ effort: 'low' }, { effort: 'high' }], default_reasoning_level: 'low' })

const identity = id => catalogIdentity(id, `issuer-${id}`)

test('exact complete positive claim builds fixed immutable model; never uses remote URL, headers, compat or cost', () => {
  const row = { ...fixture(), base_url: 'https://invalid.test', headers: { Authorization: 'sentinel' }, compat: { tools: false }, cost: { input: 100 } }
  const model = confirmedCatalogModel(row)
  assert.equal(model.id, ID)
  assert.equal(model.baseUrl, 'https://chatgpt.com/backend-api')
  assert.equal(model.api, 'openai-codex-responses')
  assert.equal(model.provider, 'openai-codex')
  assert.equal(model.contextWindow, 256000)
  assert.equal(model.maxTokens, 64000)
  assert.deepEqual(model.input, ['text'])
  assert.deepEqual(model.thinkingLevelMap, { off: null, minimal: null, max: null, low: 'low', medium: null, high: 'high', xhigh: null })
  assert.equal(model.cost.input, 0)
  assert.equal(model.headers, undefined)
  assert.equal(model.compat, undefined)
  assert.ok([model, model.input, model.cost, model.thinkingLevelMap].every(Object.isFrozen))
  for (const key of Object.keys(row.dsh_adapter_compatibility)) {
    const invalid = fixture(); delete invalid.dsh_adapter_compatibility[key]
    assert.equal(confirmedCatalogModel(invalid), undefined, key)
  }
  for (const overrides of [
    { dsh_adapter_compatibility: undefined }, { use_responses_lite: true }, { tool_mode: 'code_mode_only' }, { visibility: 'hidden' },
    { input_modalities: ['text', 'audio'] }, { input_modalities: ['image'] }, { context_window: 10 }, { max_output_tokens: null },
    { supported_reasoning_levels: [{ effort: 'medium' }] }, { default_reasoning_level: 'xhigh' }, { slug: 'gpt-../../example' },
    { dsh_adapter_compatibility: { ...row.dsh_adapter_compatibility, base_url: 'https://example.invalid' } },
    { dsh_adapter_compatibility: { ...row.dsh_adapter_compatibility, endpoint: '/responses' } },
  ]) assert.equal(confirmedCatalogModel({ ...row, ...overrides }), undefined, JSON.stringify(overrides))
})

test('account/issuer-specific admission uses immutable canonical profiles and cannot modify fixed models', () => {
  const registry = createCatalogRegistry(MODEL_IDS), model = confirmedCatalogModel(fixture())
  assert.deepEqual([...registry.replace('a', identity('a'), [model, { ...model, id: MODEL_IDS[0] }])], [ID])
  assert.equal(registry.allowed('a', identity('a'), ID), true)
  assert.equal(registry.allowed('b', identity('b'), ID), false)
  assert.equal(registry.allowed('a', identity('b'), ID), false)
  assert.deepEqual([...registry.replace('b', identity('b'), [{ ...model, contextWindow: 123 }])], [])
  assert.deepEqual([...registry.replace('b', identity('b'), [model])], [ID])
  assert.equal(registry.allowed('b', identity('b'), ID), true)
  assert.equal(registry.version, 2)
  assert.deepEqual(registry.models(), [model])
  registry.replace('a', identity('a'), [])
  assert.equal(registry.allowed('a', identity('a'), ID), false)
  assert.equal(registry.allowed('b', identity('b'), ID), true)
})

test('catalog admits only after a successful issuer-checked GET; cached rows and successful revocation fail closed', async t => {
  const registry = createCatalogRegistry(MODEL_IDS)
  let issuer = 'issuer-a', now = 10000, rows = [fixture()], calls = 0, release = 0, switchIssuer = false
  const accounts = { assertAccount: () => {},
    acquireAccount: async () => ({ replayIdentity: catalogIdentity('a', issuer), release: () => { release++ } }),
    recordStore: () => ({ readRecord: async () => ({ kind: 'grant', payload: { type: 'oauth', accountId: issuer,
      access: 'synthetic', refresh: 'synthetic', expires: 100000000 } }) }),
  }
  const reporter = createCatalogReporter({ accounts, registry, now: () => now, fetch: async () => {
    calls++
    if (switchIssuer) issuer = 'changed'
    return Response.json({ models: rows })
  } })
  t.after(() => reporter.dispose())
  const first = await reporter.report('a')
  assert.equal(first.models[0].registration, 'registered')
  assert.equal(first.models[0].maxTokens, 64000)
  assert.equal(first.models[0].dsh_adapter_compatibility, undefined)
  assert.equal(registry.allowed('a', identity('a'), ID), true)
  issuer = 'changed'
  assert.equal((await reporter.report('a')).error, 'CATALOG_ACCOUNT_CHANGED')
  assert.equal(calls, 1)
  assert.equal(registry.allowed('a', catalogIdentity('a', issuer), ID), false)
  issuer = 'issuer-a'; now += 10000; rows = [fixture(), { ...fixture(), use_responses_lite: true }]
  assert.equal((await reporter.report('a')).models[0].registration, 'unconfirmed')
  assert.equal(registry.allowed('a', identity('a'), ID), false)
  now += 10000; rows = [fixture()]; switchIssuer = true
  assert.equal((await reporter.report('a')).error, 'CATALOG_ACCOUNT_CHANGED')
  assert.equal(registry.allowed('a', identity('a'), ID), false)
  assert.equal(release, 3)
})

test('session route resolves admitted metadata but starts no delegate for unauthorized account or replaced issuer', async () => {
  const registry = createCatalogRegistry(MODEL_IDS), model = confirmedCatalogModel(fixture())
  registry.replace('a', identity('a'), [model])
  let account = 'b', issuer = identity('b'), released = 0, calls = 0
  const adapter = createRoutingAdapter({ LlmAdapter: class {}, registry,
    metadataAdapter: { resolveModel: async (_provider, _id) => model, listModels: async () => [model, { id: MODEL_IDS[0] }] },
    makeAccountAdapter: store => {
      assert.equal(store, 'a'); calls++
      return { async prepareCall(provider, id) {
        assert.equal(provider, 'openai-codex'); assert.equal(id, ID)
        return { stream: async function* (req) {
          assert.equal(req.provider, 'openai-codex'); assert.equal(req.model, ID); yield { type: 'finish' }
        } }
      } }
    },
  }, { acquireSession: async () => ({ accountId: account, replayIdentity: issuer, release: () => { released++ } }),
    credentialStore: id => id })
  assert.equal((await adapter.resolveModel('chatgpt-session', ID)).id, ID)
  assert.deepEqual(await adapter.listModels(), [{ ...model, provider: 'chatgpt-session' }, { id: MODEL_IDS[0], provider: 'chatgpt-session' }])
  const attempt = () => adapter.stream({ provider: 'chatgpt-session', sessionId: 'synthetic', model: ID, messages: [] }).next()
  await assert.rejects(attempt(), { code: 'UNKNOWN_MODEL' })
  account = 'a'
  await assert.rejects(attempt(), { code: 'UNKNOWN_MODEL' })
  assert.equal(released, 2); assert.equal(calls, 0)
  issuer = identity('a')
  const stream = adapter.stream({ provider: 'chatgpt-session', sessionId: 'synthetic', model: ID, messages: [] })
  assert.deepEqual(await stream.next(), { value: { type: 'finish' }, done: false })
  await stream.next()
  assert.equal(released, 3); assert.equal(calls, 1)
})
