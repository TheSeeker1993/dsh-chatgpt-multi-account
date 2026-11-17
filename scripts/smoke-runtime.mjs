// Run with the installed Electron runtime (ELECTRON_RUN_AS_NODE=1).
// Uses only synthetic credentials; never reads the user's credential store.
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { apply } from '../index.js'
const require = createRequire(join(process.env.DSH_INSTALL_DIR, 'package.json'))
async function runtimeImport(name) {
  if (name.startsWith('@earendil-works/pi-ai')) {
    const root = join(dirname(require.resolve('@deepseek-ai/dsh-llm-pi-ai/package.json')), '../../@earendil-works/pi-ai/dist')
    return import(pathToFileURL(join(root, name === '@earendil-works/pi-ai' ? 'index.js' : 'providers/openai-codex.js')).href)
  }
  return import(pathToFileURL(require.resolve(name)).href)
}
const routes = new Map(), effects = [], records = new Map(), flows = new Map()
const tables = new Map(), listeners = new Map(), searchProviders = new Map(), injections = []
let adapter
const ctx = {
  loader: { import: runtimeImport },
  logger: { warn() {} },
  effect(fn) { const dispose = fn(); if (typeof dispose === 'function') effects.push(dispose) },
  on(name, fn) { listeners.set(name, fn) },
  get() { return undefined },
  agents: { get() { return undefined }, currentInitiator() { return undefined } }, sessions: { get() { return undefined } },
  inject(names, callback) { assert.deepEqual(names, ['web', 'settings']); injections.push(callback(this)) },
  web: { registerSearchProvider(provider) { searchProviders.set(provider.id, provider); return () => searchProviders.delete(provider.id) } },
  settings: { describe() { return [] }, update() { throw new Error('Installation must not change search or fetch settings') } },
  storageDomain: { async open(spec) {
    return { table(name) {
      if (!tables.has(name)) tables.set(name, new Map())
      const map = tables.get(name)
      return { get: key => map.get(key), entries: () => map.entries(),
        async put(key, value) { map.set(key, spec.tables[name].valueSchema.parse(value)) },
        async delete(key) { return map.delete(key) } }
    }, async close() {} }
  } },
  credentials: {
    async describeRecord(key) { return { configured: records.has(key) } },
    async readRecord(key) { return records.get(key) },
    async modifyRecord(key, fn) { const next = await fn(records.get(key)); if (next !== undefined) records.set(key, next); return records.get(key) },
    async deleteRecord(key) { records.delete(key) },
  },
  authorization: {
    registerFlow(flow) { flows.set(flow.key, flow); return () => flows.delete(flow.key) },
    describe(key) { return flows.get(key) ? { label: 'ChatGPT', methods: [{ id: 'oauth' }], inFlight: false } : undefined },
    cancel() {}, begin() { throw new Error('Smoke test must not start real OAuth') },
  },
  connection: { fetch: { register(route) { routes.set(route.path, route.fetch) } } },
  llm: { registerAdapter(ids, value) { assert.deepEqual(ids, ['chatgpt-session']); adapter = value; return () => {} } },
}
await apply(ctx, {})
await Promise.all(injections)
assert.deepEqual([...searchProviders.keys()], ['chatgpt-session-search', 'model-aware-search'])
await assert.rejects(searchProviders.get('model-aware-search').search({ query: 'synthetic' }), { code: 'SEARCH_INITIATOR_REQUIRED' })
assert.equal(routes.size, 4)
const models = await adapter.listModels('chatgpt-session')
assert.equal(models.length, 7)
const prepared = await adapter.prepareCall('chatgpt-session', 'gpt-6.1-sol')
assert.equal(prepared.model.provider, 'chatgpt-session')
async function call(path, body) {
  const req = new Request(`http://localhost${path}`, body === undefined ? {} : { method: 'POST', headers: { 'content-type': 'application/json', origin: 'http://localhost' }, body: JSON.stringify(body) })
  const response = await routes.get(path.split('?')[0])(req)
  return { status: response.status, data: await response.json() }
}
const created = await call('/api/chatgpt-accounts', { action: 'create', label: 'Synthetic test' })
assert.equal(created.status, 200)
const id = created.data.createdAccountId
assert.ok(id)
const auth = await call(`/api/chatgpt-auth?accountId=${id}`)
assert.equal(auth.data.status, 'signed-out')
assert.equal(flows.size, 1)
const refused = await call('/api/chatgpt-accounts', { action: 'select', accountId: id, sessionId: 'synthetic-session' })
assert.equal(refused.data.error, 'ACCOUNT_SIGNED_OUT')
records.set(`dsh-gpt-link/account-${id}`, { kind: 'grant', payload: { type: 'oauth', access: 'synthetic', accountId: 'synthetic', expires: 1 } })
assert.equal((await call('/api/chatgpt-accounts', { action: 'select', accountId: id, sessionId: 'synthetic-session' })).data.sessionAccountId, id)
assert.equal((await call(`/api/chatgpt-quota?accountId=${id}`)).data.message, 'quota-token-stale')
assert.equal((await call(`/api/chatgpt-resets?accountId=${id}`)).data.error, 'RESET_TOKEN_EXPIRED')
assert.equal((await call('/api/chatgpt-accounts', { action: 'remove', accountId: id })).status, 200)
assert.equal(records.size, 0)
for (const dispose of effects.reverse()) await dispose()
console.log('Installed-runtime smoke passed: real adapter/catalog/schema APIs, synthetic account CRUD/binding/auth status/quota, no OAuth or inference network calls.')
