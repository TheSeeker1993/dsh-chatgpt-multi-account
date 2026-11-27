// Run with installed Electron, ELECTRON_RUN_AS_NODE=1. Synthetic stores only.
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createAccountQuotaReader } from '../multi/quota.js'

// Hard network fence. Auth is the real installed Models resolver, while only
// its provider refresh function and quota endpoint are synthetic.
globalThis.fetch = async () => { throw new Error('Quota smoke forbids network') }
const require = createRequire(join(process.env.DSH_INSTALL_DIR, 'package.json'))
const root = join(dirname(require.resolve('@deepseek-ai/dsh-llm-pi-ai/package.json')), '../../@earendil-works/pi-ai/dist')
const { createModels } = await import(pathToFileURL(join(root, 'index.js')).href)
const { openaiCodexProvider } = await import(pathToFileURL(join(root, 'providers/openai-codex.js')).href)
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r }); return { promise, resolve } }
const turn = () => new Promise(r => setImmediate(r))
const bounded = async promise => { let timer; try { return await Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Synthetic native quota smoke timeout')), 3000) })]) } finally { clearTimeout(timer) } }

for (const disposeDuringRefresh of [false, true]) {
  let stored = { type: 'oauth', access: 'synthetic-expired', refresh: 'synthetic-refresh', accountId: 'synthetic-issuer', expires: 0 }
  let locked = Promise.resolve(), leaseCount = 0, refreshCalls = 0, usageCalls = 0
  const started = deferred(), finish = deferred()
  const store = { read: async () => structuredClone(stored), list: async () => [], delete: async () => { throw new Error('No delete') },
    modify(_id, update) { const op = locked.then(async () => { const next = await update(structuredClone(stored)); if (next !== undefined) stored = next; return structuredClone(stored) }); locked = op.catch(() => {}); return op } }
  const accounts = { credentialStore: id => { assert.equal(id, 'synthetic-local'); return store }, recordStore: id => { assert.equal(id, 'synthetic-local'); return { readRecord: async () => ({ kind: 'grant', payload: structuredClone(stored) }) } },
    acquireAccount: async (_requestId, id) => { assert.equal(id, 'synthetic-local'); leaseCount++; return { release() { leaseCount-- } } } }
  const quota = createAccountQuotaReader({ accounts, id: 'synthetic-local', createModels, openaiCodexProvider: () => {
    const provider = openaiCodexProvider()
    provider.auth = { ...provider.auth, oauth: { ...provider.auth.oauth, refresh: async current => {
      refreshCalls++; started.resolve(); await finish.promise
      return { ...current, access: 'synthetic-fresh', refresh: 'synthetic-rotated', expires: Date.now() + 3600000 }
    } } }
    return provider
  }, fetch: async (url, init) => {
    usageCalls++; assert.equal(url, 'https://chatgpt.com/backend-api/wham/usage'); assert.equal(init.method, 'GET')
    assert.equal(init.headers.authorization, 'Bearer synthetic-fresh'); assert.equal(init.headers['chatgpt-account-id'], 'synthetic-issuer')
    return Response.json({ plan_type: 'plus' })
  } })
  const reading = quota.read()
  await bounded(started.promise)
  assert.equal(leaseCount, 1)
  if (disposeDuringRefresh) { quota.dispose(); await turn(); assert.equal(leaseCount, 1) }
  finish.resolve()
  const card = await bounded(reading)
  assert.equal(card.message ?? card.status, disposeDuringRefresh ? 'quota-stopped' : 'logged-in')
  assert.equal(stored.refresh, 'synthetic-rotated')
  assert.equal(refreshCalls, 1); assert.equal(usageCalls, disposeDuringRefresh ? 0 : 1); assert.equal(leaseCount, 0)
  quota.dispose()
}
console.log('Native quota smoke passed: installed Models.getAuth refresh + quota GET; rotated token persistence survives unload, zero inference, zero network, zero profile access.')
