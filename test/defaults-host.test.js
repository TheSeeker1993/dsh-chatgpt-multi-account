import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isFreshOrdinaryChat, applyChatDefaults, installDefaultsEndpoint, installChatDefaults } from '../multi/defaults-host.js'

const choice = { enabled: true, available: true, accountId: 'a', model: 'gpt-6.1-sol', reasoningEffort: 'low' }
function fixture() {
  const bindings = new Map(), selections = [], descriptions = []
  const agent = { session: { id: 'fresh', firstLiveSeq: 0, header: { isSeeded: false } }, model: { select: value => selections.push(value) } }
  const accounts = {
    sessions: { get: id => bindings.get(id), put: async (id, value) => bindings.set(id, value), delete: async id => bindings.delete(id) },
    exclusive: async fn => fn(), assertAccount: id => assert.equal(id, 'a'), key: id => `synthetic/${id}`,
    credentials: { describeRecord: async key => { descriptions.push(key); return { configured: true } } },
    authorizing: new Set(), isAuthorizing: () => false,
  }
  return { agent, accounts, bindings, selections, descriptions, defaults: { snapshot: async () => ({ ...choice }) } }
}

test('fresh ordinary guard excludes every non-startup, restored, fork and child identity', () => {
  const f = fixture()
  assert.equal(isFreshOrdinaryChat(f.agent, 'startup'), true)
  for (const source of ['resume', 'clear', 'compact', undefined]) assert.equal(isFreshOrdinaryChat(f.agent, source), false)
  for (const patch of [{ isSeeded: true }, { origin: 'subagent' }, { parentSession: 'parent' }, { delegationDepth: 1 }]) {
    assert.equal(isFreshOrdinaryChat({ session: { ...f.agent.session, header: { isSeeded: false, ...patch } } }, 'startup'), false)
  }
  assert.equal(isFreshOrdinaryChat({ session: { ...f.agent.session, firstLiveSeq: 3 } }, 'startup'), false)
  assert.equal(isFreshOrdinaryChat(undefined, 'startup'), false)
  assert.equal(isFreshOrdinaryChat({ session: { firstLiveSeq: 0 } }, 'startup'), false)
})

test('apply binds exact default before synchronous selection and preserves existing binding', async () => {
  const f = fixture()
  f.agent.model.select = value => { assert.deepEqual(f.bindings.get('fresh'), { accountId: 'a' }); f.selections.push(value) }
  await applyChatDefaults(f.defaults, f.accounts, f.agent)
  assert.deepEqual(f.selections, [{ provider: 'chatgpt-session', model: choice.model, reasoningEffort: 'low' }])
  f.bindings.set('fresh', { accountId: 'explicit' })
  await applyChatDefaults(f.defaults, f.accounts, f.agent)
  assert.deepEqual(f.bindings.get('fresh'), { accountId: 'explicit' })
  assert.equal(f.selections.length, 1)
})

test('captured creation choice remains immutable while waiting to bind', async () => {
  const f = fixture(), mutable = { ...choice }
  let release, entered
  const ready = new Promise(resolve => { entered = resolve })
  f.accounts.exclusive = async fn => { entered(); await new Promise(resolve => { release = resolve }); return fn() }
  const pending = applyChatDefaults({ snapshot: async () => mutable }, f.accounts, f.agent)
  await ready
  mutable.model = 'gpt-9-sol'; mutable.reasoningEffort = 'high'
  release(); await pending
  assert.equal(f.selections[0].model, choice.model)
  assert.equal(f.selections[0].reasoningEffort, choice.reasoningEffort)
})

test('disabled or unavailable defaults never fallback to another account', async () => {
  const f = fixture()
  await applyChatDefaults({ snapshot: async () => ({ ...choice, enabled: false }) }, f.accounts, f.agent)
  assert.equal(f.descriptions.length, 0)
  await assert.rejects(applyChatDefaults({ snapshot: async () => ({ ...choice, available: false }) }, f.accounts, f.agent), { code: 'DEFAULT_ACCOUNT_UNAVAILABLE' })
  f.accounts.credentials.describeRecord = async () => ({ configured: false })
  await assert.rejects(applyChatDefaults(f.defaults, f.accounts, f.agent), { code: 'DEFAULT_ACCOUNT_UNAVAILABLE' })
  assert.equal(f.bindings.size, 0)
  assert.deepEqual(f.selections, [])
})

test('abort before binding, abort after put and select failure leave no new binding', async () => {
  for (const mode of ['before', 'after', 'select']) {
    const f = fixture(), controller = new AbortController()
    if (mode === 'before') controller.abort()
    if (mode === 'after') f.accounts.sessions.put = async (id, value) => { f.bindings.set(id, value); controller.abort() }
    if (mode === 'select') f.agent.model.select = () => { throw new Error('synthetic select failure') }
    await assert.rejects(applyChatDefaults(f.defaults, f.accounts, f.agent, controller.signal))
    assert.equal(f.bindings.size, 0)
  }
})

test('in-flight authorization rejects without selection or binding', async () => {
  const f = fixture(); f.accounts.authorizing.add('a')
  await assert.rejects(applyChatDefaults(f.defaults, f.accounts, f.agent), { code: 'LOGIN_IN_PROGRESS' })
  assert.equal(f.bindings.size, 0)
})

function endpoint(defaults = { snapshot: async () => choice, save: async body => ({ saved: body.accountId }), disable: async () => ({ enabled: false }), enableAuto: async body => ({ auto: body.accountId }) }) {
  let route
  installDefaultsEndpoint({ connection: { fetch: { register: value => { route = value } } } }, defaults)
  const request = (method = 'GET', body, headers = {}) => route.fetch(new Request('http://dsh.internal/api/chatgpt-defaults', { method, ...(body === undefined ? {} : { body: typeof body === 'string' ? body : JSON.stringify(body) }), headers }))
  return { request, route }
}

test('endpoint GET is no-store and synthetic-origin POST needs only correct secret header', async () => {
  const e = endpoint(), get = await e.request()
  assert.equal(get.headers.get('cache-control'), 'no-store')
  const { csrfToken } = await get.json()
  assert.match(csrfToken, /^[a-f0-9]{64}$/)
  const headers = { 'x-chatgpt-defaults-csrf': csrfToken, 'content-type': 'application/json', origin: 'http://127.0.0.1:55234' }
  const save = await e.request('POST', { action: 'save', accountId: 'a' }, headers)
  assert.equal(save.status, 200); assert.deepEqual(await save.json(), { saved: 'a' })
  const disable = await e.request('POST', { action: 'disable' }, { ...headers, 'sec-fetch-site': 'same-origin' })
  assert.deepEqual(await disable.json(), { enabled: false })
  assert.equal(disable.headers.get('cache-control'), 'no-store')
  assert.deepEqual(await (await e.request('POST', { action: 'auto', accountId: 'a' }, headers)).json(), { auto: 'a' })
})

test('endpoint rejects missing, foreign-instance, malformed and cross-site CSRF tokens', async () => {
  const e = endpoint(), other = endpoint()
  const { csrfToken } = await (await e.request()).json()
  const foreign = (await (await other.request()).json()).csrfToken
  for (const headers of [{}, { 'x-chatgpt-defaults-csrf': foreign }, { 'x-chatgpt-defaults-csrf': 'bad' }, { 'x-chatgpt-defaults-csrf': csrfToken, 'sec-fetch-site': 'cross-site' }, { 'x-chatgpt-defaults-csrf': csrfToken, 'sec-fetch-site': 'same-site' }]) {
    const response = await e.request('POST', { action: 'disable' }, { 'content-type': 'application/json', ...headers })
    assert.equal(response.status, 403)
    assert.deepEqual(await response.json(), { error: 'DEFAULT_CSRF_INVALID' })
  }
})

test('endpoint validation and failures return bounded safe codes without raw errors', async () => {
  const e = endpoint({ snapshot: async () => choice, save: async () => { throw new Error('SYNTHETIC_SECRET_RAW') } })
  const { csrfToken } = await (await e.request()).json()
  const headers = { 'x-chatgpt-defaults-csrf': csrfToken, 'content-type': 'application/json' }
  for (const body of ['not-json', '[]', 'null', 'x'.repeat(8193), { action: 'unknown' }, { action: 'save' }]) {
    const response = await e.request('POST', body, headers)
    assert.equal(response.status, 400)
    assert.doesNotMatch(await response.text(), /SYNTHETIC_SECRET_RAW|SyntaxError|stack/)
  }
  assert.equal((await e.request('POST', { action: 'save' }, { ...headers, 'content-type': 'text/plain' })).status, 400)
})

test('installed listener captures identity before await and uses separate defaults domain', async () => {
  const f = fixture(), rows = new Map([['default', { ...choice }]])
  let listener, release, opened
  const waiting = new Promise(resolve => { release = resolve })
  f.accounts.accounts = new Map([['a', { createdAt: 1 }]])
  f.accounts.removing = new Set()
  f.accounts.credentials.describeRecord = async () => { await waiting; return { configured: true } }
  const schema = { boolean: () => ({}), string: () => ({ nullable: () => ({}) }), enum: () => ({ optional: () => ({}) }), object: value => value }
  const ctx = {
    loader: { import: async name => name === 'zod' ? { z: schema } : { defineDomain: x => x, domainTable: x => x } },
    storageDomain: { open: async spec => { opened = spec; return { table: () => ({ get: key => rows.get(key), put: async (key, value) => rows.set(key, value) }), close: async () => {} } } },
    effect: () => {}, on: (name, fn) => { assert.equal(name, 'agent/created'); listener = fn },
    connection: { fetch: { register: () => {} } },
  }
  await installChatDefaults(ctx, f.accounts, { available: async () => ({ reasoning: true, thinkingLevelMap: { low: 'low' } }) })
  assert.equal(opened.name, 'chatgpt_defaults'); assert.equal(opened.version, 1)
  const pending = listener({ agent: f.agent, source: 'startup' })
  f.agent.session.firstLiveSeq = 9 // Simulate mutable test state changing after the synchronous guard.
  release(); await pending
  assert.equal(f.selections.length, 1)
  f.selections.length = 0
  await listener({ agent: f.agent, source: 'resume' })
  assert.equal(f.selections.length, 0)
})
