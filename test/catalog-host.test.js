import test from 'node:test'
import assert from 'node:assert/strict'
import { createCatalogAuthenticator, installCatalogEndpoint, installModelCatalog, catalogMetadata } from '../multi/catalog-host.js'
import { ModelCatalog } from '../multi/catalog.js'

const defer = () => { let resolve; const promise = new Promise(r => { resolve = r }); return { promise, resolve } }

test('catalog auth drains native credential persistence even when getAuth aborts first', async () => {
  const started = defer(), persisted = defer(), controller = new AbortController()
  let finished = false
  const accounts = { credentialStore: () => ({ read: async () => ({}), list: async () => [], delete: async () => {}, modify: async () => { started.resolve(); await persisted.promise } }) }
  const authenticate = createCatalogAuthenticator(accounts, {
    openaiCodexProvider: () => ({}),
    createModels: ({ credentials, authContext }) => ({ setProvider() {}, async getAuth(provider, { signal }) {
      assert.equal(provider, 'openai-codex'); assert.equal(await authContext.env('ANY'), undefined)
      void credentials.modify(provider, () => ({}))
      await new Promise((_, reject) => signal.addEventListener('abort', () => reject(new Error('secret native error')), { once: true }))
    } }),
  })
  const work = authenticate('one', controller.signal).finally(() => { finished = true })
  await started.promise; controller.abort(); await Promise.resolve(); await Promise.resolve()
  assert.equal(finished, false)
  persisted.resolve(); await assert.rejects(work); assert.equal(finished, true)
})

test('catalog auth verifies same grant and returns only private auth material plus hash', async () => {
  const grant = { access: 'synthetic-access', refresh: 'synthetic-refresh', accountId: 'issuer' }
  const accounts = { credentialStore: () => ({ read: async () => grant }) }
  const deps = { openaiCodexProvider: () => ({}), createModels: () => ({ setProvider() {}, getAuth: async () => ({ auth: { apiKey: grant.access } }) }) }
  const result = await createCatalogAuthenticator(accounts, deps)('local')
  assert.equal(result.access, grant.access); assert.equal(result.accountId, 'issuer'); assert.match(result.identity, /^[0-9a-f]{64}$/)
  assert.ok(!result.identity.includes(grant.refresh))
  deps.createModels = () => ({ setProvider() {}, getAuth: async () => ({ auth: { apiKey: 'different' } }) })
  await assert.rejects(createCatalogAuthenticator(accounts, deps)('local'), { code: 'CATALOG_AUTH_INVALID' })
})

test('principal identity survives OAuth rotation but changes for another user or workspace', async () => {
  const jwt = value => `synthetic.${Buffer.from(JSON.stringify(value)).toString('base64url')}.signature`
  const token = (sub, org, nonce) => jwt({ sub, exp: nonce, iat: nonce - 1, jti: `rotating-${nonce}`,
    'https://api.openai.com/auth': { chatgpt_user_id: `user-${sub}`, organization_id: org, workspace_id: 'workspace' } })
  let grant = { accountId: 'issuer', access: token('first', 'org-one', 1), idToken: token('first', 'org-one', 1), refresh: 'synthetic-refresh-1' }
  const accounts = { credentialStore: () => ({ read: async () => grant }) }
  const deps = { openaiCodexProvider: () => ({}), createModels: () => ({ setProvider() {}, getAuth: async () => ({ auth: { apiKey: grant.access } }) }) }
  const authenticate = createCatalogAuthenticator(accounts, deps)
  const first = await authenticate('local')
  grant = { ...grant, access: token('first', 'org-one', 2), idToken: token('first', 'org-one', 2), refresh: 'synthetic-refresh-2' }
  assert.equal((await authenticate('local')).identity, first.identity)
  grant = { ...grant, access: token('second', 'org-one', 3), idToken: token('second', 'org-one', 3) }
  assert.notEqual((await authenticate('local')).identity, first.identity)
  grant = { ...grant, access: token('first', 'org-two', 4), idToken: token('first', 'org-two', 4) }
  assert.notEqual((await authenticate('local')).identity, first.identity)
  const identity = (await authenticate('local')).identity
  assert.match(identity, /^[a-f0-9]{64}$/)
  assert.ok(!identity.includes('first')); assert.ok(!identity.includes('synthetic'))
  assert.deepEqual(Object.keys(first).sort(), ['access', 'accountId', 'identity'])
})

test('new complete manual model validates and survives metadata-only persistence/reopen', () => {
  const definition = catalogMetadata({ id: 'new-model', name: 'New', contextWindow: 1000, maxTokens: 100,
    input: ['text'], reasoning: false, cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    baseURL: 'https://evil.invalid', headers: { authorization: 'PRIVATE' } })
  const options = { accounts: {}, nativeModels: [], authenticate: async () => {}, fetch: async () => { throw Error('no network') } }
  const first = new ModelCatalog(options)
  first.setManual([definition], { replace: true })
  const persisted = JSON.parse(JSON.stringify(first.manualModels.map(catalogMetadata)))
  const reopened = new ModelCatalog(options)
  reopened.setManual(persisted, { replace: true })
  assert.equal(reopened.knownModels()[0].id, 'new-model')
  assert.ok(!JSON.stringify(persisted).includes('PRIVATE'))
  assert.equal(reopened.cached('one').models?.length ?? 0, 0)
  first.dispose(); reopened.dispose()
})

test('installed credential deletion listener invalidates while account removal guards key()', async () => {
  const listeners = new Map(), cleanups = [], emitted = []
  const schema = { optional() { return this } }
  const z = { object: () => schema, array: () => schema, unknown: () => schema, boolean: () => schema }
  const table = { get: () => undefined, put: async () => {} }
  let removing = false, keyCalls = 0, secretReads = 0
  const accounts = { accounts: new Map([['one', {}], ['legacy', {}]]), key(id) {
    keyCalls++; if (removing) throw Object.assign(new Error('ACCOUNT_NOT_FOUND'), { code: 'ACCOUNT_NOT_FOUND' })
    return `dsh-gpt-link/account-${id}`
  }, credentialStore() { secretReads++; throw new Error('event must not read grants') } }
  const dependencies = {
    '@earendil-works/pi-ai': { createModels: () => { throw new Error('no auth expected') } },
    '@earendil-works/pi-ai/providers/openai-codex': { openaiCodexProvider: () => ({ getModels: () => [] }) },
    '@deepseek-ai/dsh-storage-domain': { defineDomain: value => value, domainTable: value => value }, zod: { z },
  }
  const ctx = { loader: { import: async name => dependencies[name] },
    storageDomain: { open: async () => ({ table: () => table, close: async () => {} }) },
    effect: callback => { cleanups.push(callback()) }, on: (event, callback) => listeners.set(event, callback),
    emit: (...args) => emitted.push(args), connection: { fetch: { register() {} } } }
  const catalog = await installModelCatalog(ctx, accounts)
  catalog.entries.set('one', { models: [{ id: 'synthetic' }], checkedAt: Date.now() })
  catalog.entries.set('legacy', { models: [{ id: 'other' }], checkedAt: Date.now() })
  removing = true
  assert.doesNotThrow(() => listeners.get('credentials/record-updated')('dsh-gpt-link/account-one'))
  assert.deepEqual(catalog.cached('one').models, [])
  assert.equal(catalog.cached('legacy').models[0].id, 'other')
  assert.equal(keyCalls, 0); assert.equal(secretReads, 0)
  assert.deepEqual(emitted.at(-1), ['llm/models-updated', 'chatgpt-session'])
  assert.doesNotThrow(() => listeners.get('credentials/record-updated')('llm-pi-ai/openai-codex'))
  assert.deepEqual(catalog.cached('legacy').models, [])
  for (const cleanup of cleanups) await cleanup()
})

function fixture() {
  let endpoint, saved, refreshes = 0
  const native = { id: 'known', name: 'Native', contextWindow: 123, maxTokens: 10 }
  const catalog = { manualModels: [], knownModels: () => [native], cached: id => ({ accountId: id, models: [], stale: true }),
    refresh: async (id, opts) => { refreshes++; assert.equal(opts.force, true); return { accountId: id, models: [] } },
    setManual(models, { replace }) { this.manualModels = models; this.replace = replace } }
  const ctx = { connection: { fetch: { register: value => { endpoint = value.fetch } } }, settings: { describe: async options => {
    assert.deepEqual(options, { redactSecrets: true })
    return [{ ns: 'chosen', value: { providers: { 'openai-codex': { apiKeyEnv: 'PRIVATE', baseURL: 'https://evil.invalid', models: [{ id: 'known', name: 'Imported', headers: { authorization: 'PRIVATE' } }], modelOverrides: { known: { maxTokens: 20, proxy: 'PRIVATE' } } } } } }]
  } } }
  installCatalogEndpoint(ctx, catalog, { get: () => undefined, put: async (_, value) => { saved = value } })
  const get = async cached => endpoint(new Request(`http://dsh.internal/api/chatgpt-models?accountId=one${cached ? '&cached=1' : ''}`))
  const post = async (body, token, extra = {}) => endpoint(new Request('http://dsh.internal/api/chatgpt-models', { method: 'POST', headers: { 'content-type': 'application/json', 'x-chatgpt-models-csrf': token, origin: 'http://127.0.0.1:62899', ...extra }, body: typeof body === 'string' ? body : JSON.stringify(body) }))
  return { get, post, catalog, saved: () => saved, refreshes: () => refreshes }
}

test('endpoint authenticated GET token and custom header support synthetic origin; cross-site fails', async () => {
  const f = fixture(), response = await f.get(), view = await response.json()
  assert.equal(response.headers.get('cache-control'), 'no-store'); assert.equal(f.refreshes(), 1)
  await f.get(true); assert.equal(f.refreshes(), 1)
  assert.equal((await f.post({ action: 'reset-manual' }, view.csrfToken)).status, 200)
  assert.equal((await f.post({ action: 'reset-manual' }, view.csrfToken, { 'sec-fetch-site': 'cross-site' })).status, 403)
  assert.equal((await f.post({ action: 'reset-manual' }, '0'.repeat(64))).status, 403)
  assert.equal((await f.post(' '.repeat(65537), view.csrfToken)).status, 400)
})

test('explicit namespace import persists only allowlisted validated metadata and replacement semantic', async () => {
  const f = fixture(), { csrfToken } = await (await f.get()).json()
  const result = await f.post({ action: 'import', namespace: 'chosen', mode: 'replace' }, csrfToken)
  assert.equal(result.status, 200)
  assert.deepEqual(f.saved(), { models: [{ id: 'known', name: 'Imported', contextWindow: 123, maxTokens: 20, provider: 'openai-codex', baseUrl: 'https://chatgpt.com/backend-api', api: 'openai-codex-responses', type: 'chat' }], replace: true })
  assert.ok(!JSON.stringify(f.saved()).includes('PRIVATE'))
  assert.equal((await f.post({ action: 'import', namespace: 'missing', mode: 'replace' }, csrfToken)).status, 400)
  await f.post({ action: 'reset-manual' }, csrfToken)
  assert.deepEqual(f.saved(), { models: [], replace: false })
})
