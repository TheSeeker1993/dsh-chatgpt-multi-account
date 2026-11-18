import assert from 'node:assert/strict'
import { test } from 'node:test'
import { commonProfiles, MODEL_IDS } from '../multi/routing.js'

const BASE_IDS = ['gpt-6-astra', 'gpt-6.1-sol', 'gpt-6-sol', 'gpt-6-luna', 'gpt-5.6-sol', 'gpt-5.6-terra', 'gpt-5.6-luna']
const EXTENSIONS = [
  ['gpt-6.2-sol', 'GPT-6.2 Sol', 500000, 2, 10, 0.1, 2.5],
  ['gpt-6.2-astra', 'GPT-6.2 Astra', 272000, 8, 40, 0.4, 10],
  ['gpt-6.1-terra', 'GPT-6.1 Terra', 500000, 1, 5, 0.05, 1.25],
]
function fixture(extra = []) {
  const catalog = BASE_IDS.map(id => ({ id, name: id, provider: 'openai-codex', api: 'openai-codex-responses',
    baseUrl: 'https://chatgpt.com/backend-api', type: 'chat', reasoning: true,
    input: ['text', 'image'], contextWindow: 500000, maxTokens: 128000,
    cost: { input: 2, output: 10, cacheRead: 0.1, cacheWrite: 2.5 },
    compat: { supportsOpenAIGrammarTools: true },
    inputLimits: { images: { resize: { maxWidth: 2000, maxHeight: 2000, maxBytes: 4718592, jpegQuality: 80 } } },
    thinkingLevelMap: { minimal: 'low', max: 'max' },
  })).concat(extra)
  const native = { getModels: () => catalog, stream: (...args) => args, streamSimple: (...args) => args }
  const models = commonProfiles(native, () => ({})).get('openai-codex').piProvider.getModels()
  return { catalog, models, native }
}

test('three finite extensions use exact IDs, observed contexts and explicit API reference prices', () => {
  const { catalog, models } = fixture()
  const template = catalog.find(model => model.id === 'gpt-6.1-sol')
  assert.deepEqual(models.map(model => model.id), MODEL_IDS)
  assert.equal(models.length, 10)
  for (const [id, name, contextWindow, input, output, cacheRead, cacheWrite] of EXTENSIONS) {
    const model = models.find(model => model.id === id)
    assert.equal(model.name, name)
    assert.equal(model.contextWindow, contextWindow)
    assert.equal(model.maxTokens, 128000)
    assert.equal(model.api, template.api)
    assert.equal(model.provider, template.provider)
    assert.equal(model.baseUrl, template.baseUrl)
    assert.deepEqual(model.input, ['text', 'image'])
    assert.deepEqual(model.compat, template.compat)
    assert.deepEqual(model.inputLimits, template.inputLimits)
    assert.deepEqual(model.cost, { input, output, cacheRead, cacheWrite,
      tiers: [{ inputTokensAbove: 272000, input: input * 2, output: output * 1.5, cacheRead: cacheRead * 2, cacheWrite: cacheWrite * 2 }] })
    assert.deepEqual(model.thinkingLevelMap, { off: null, minimal: null, low: 'low', medium: 'medium', high: 'high', xhigh: 'xhigh', max: null })
    assert.ok(Object.isFrozen(model))
    assert.ok(Object.isFrozen(model.input))
    assert.ok(Object.isFrozen(model.cost))
    assert.ok(Object.isFrozen(model.cost.tiers))
    assert.ok(Object.isFrozen(model.cost.tiers[0]))
    assert.ok(Object.isFrozen(model.thinkingLevelMap))
  }
  assert.ok(Object.isFrozen(models))
})

test('original seven retain native metadata without changing native objects or transport', () => {
  const { catalog, models, native } = fixture([{ id: 'gpt-5.5' }, { id: 'gpt-5.3-codex-spark' }, { id: 'unrelated-model' }])
  for (const original of catalog.slice(0, BASE_IDS.length)) {
    const { thinkingLevelMap, ...expected } = original
    const { thinkingLevelMap: override, ...actual } = models.find(model => model.id === original.id)
    assert.deepEqual(actual, expected)
    assert.deepEqual(original.thinkingLevelMap, { minimal: 'low', max: 'max' })
    assert.equal(override.minimal, null)
  }
  assert.equal(native.getModels().length, 10)
  assert.equal(models.some(model => ['gpt-5.5', 'gpt-5.3-codex-spark', 'unrelated-model'].includes(model.id)), false)
  const profile = commonProfiles(native, () => ({})).get('openai-codex')
  assert.deepEqual(profile.piProvider.stream('exact-model-id', { arbitrary: true }), ['exact-model-id', { arbitrary: true }])
  assert.deepEqual(profile.piProvider.streamSimple('exact-model-id'), ['exact-model-id'])
})

test('native definitions take precedence when installed provider gains extension IDs', () => {
  const nativeExtension = { id: 'gpt-6.2-sol', name: 'Updated native Sol', contextWindow: 600000, maxTokens: 64000,
    cost: { input: 3, output: 11, cacheRead: 0.2, cacheWrite: 3 }, marker: 'native' }
  const { models } = fixture([nativeExtension])
  const { thinkingLevelMap, ...actual } = models.find(model => model.id === nativeExtension.id)
  assert.deepEqual(actual, nativeExtension)
  assert.equal(Object.hasOwn(nativeExtension, 'thinkingLevelMap'), false)
})

test('missing original models still fail instead of being synthesized', () => {
  const { catalog } = fixture()
  for (const id of BASE_IDS) {
    assert.throws(() => commonProfiles({ getModels: () => catalog.filter(model => model.id !== id) }, () => ({})), { code: 'UNKNOWN_MODEL' })
  }
})
