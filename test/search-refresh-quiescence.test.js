import test from 'node:test'
import assert from 'node:assert/strict'
import { createChatGPTSearchProvider } from '../search/provider.js'

const deferred = () => {
  let resolve, reject
  const promise = new Promise((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}
const turn = () => new Promise(resolve => setImmediate(resolve))
const promptly = promise => Promise.race([promise, new Promise((_, reject) => {
  const timer = setTimeout(() => reject(Error('cancellation did not return promptly')), 1000)
  timer.unref()
})])

function harness(stream, store) {
  let releases = 0, inference = 0
  const installation = createChatGPTSearchProvider({ agents: { currentInitiator: () => ({ session: { id: 'synthetic-session' } }) } }, {
    acquireSession: async () => ({ accountId: 'synthetic-account', release() { releases++ } }),
    credentialStore: () => store,
  }, {
    createModels: ({ credentials }) => ({ setProvider() {}, getModel: () => ({}), stream: (...args) => stream(credentials, ...args) }),
    openaiCodexProvider: () => ({}),
    fetch: async () => { inference++; throw Error('inference must never start after cancellation') },
  })
  return { ...installation, releases: () => releases, inference: () => inference }
}

// Native resolveProviderAuth races its iterator against abort independently of
// credentials.modify. Completing that iterator is NOT proof refresh persisted.
for (const method of ['read', 'list', 'modify', 'delete']) {
  test(`aborted native auth keeps lease until noncooperative credentials.${method} settles`, async () => {
    const started = deferred(), finish = deferred(), persisted = deferred()
    let stored = false
    const h = harness(async function* (credentials, model, context, options) {
      const pending = credentials[method]('openai-codex', async () => ({}))
      started.resolve()
      const aborted = new Promise(resolve => options.signal.addEventListener('abort', resolve, { once: true }))
      await Promise.race([pending, aborted])
      // Native auth has returned on abort, while the store operation is alive.
    }, { [method]: async () => { await finish.promise; stored = true; persisted.resolve() } })
    const controller = new AbortController()
    const result = h.provider.search({ query: 'synthetic' }, controller.signal)
    try {
      await started.promise
      controller.abort()
      await promptly(assert.rejects(result, { code: 'SEARCH_ABORTED' }))
      await turn()
      assert.equal(stored, false)
      assert.equal(h.releases(), 0, 'iterator abortion must not release an in-flight credential operation')
      assert.equal(h.inference(), 0)
      finish.resolve()
      await persisted.promise
      await turn()
      assert.equal(stored, true)
      assert.equal(h.releases(), 1, 'release exactly once, after persistence')
      h.dispose()
      controller.abort()
      await turn()
      assert.equal(h.releases(), 1)
    } finally { finish.resolve(); h.dispose() }
  })
}

test('late native continuation after aborted read cannot start modify after lease release', async () => {
  const readStarted = deferred(), finishRead = deferred(), continueNative = deferred(), lateDone = deferred()
  let modifications = 0, lateError
  const h = harness(async function* (credentials, model, context, options) {
    const native = (async () => {
      await credentials.read('openai-codex')
      await continueNative.promise
      try { await credentials.modify('openai-codex', () => ({})) } catch (error) { lateError = error }
      lateDone.resolve()
    })()
    readStarted.resolve()
    await Promise.race([native, new Promise(resolve => options.signal.addEventListener('abort', resolve, { once: true }))])
  }, { read: () => finishRead.promise, modify: async () => { modifications++ } })
  const controller = new AbortController()
  const result = h.provider.search({ query: 'synthetic' }, controller.signal)
  try {
    await readStarted.promise
    controller.abort()
    await promptly(assert.rejects(result, { code: 'SEARCH_ABORTED' }))
    await turn()
    assert.equal(h.releases(), 0)
    finishRead.resolve({ type: 'oauth', expires: 0 })
    await turn()
    assert.equal(h.releases(), 1)
    continueNative.resolve()
    await lateDone.promise
    assert.equal(lateError?.code, 'SEARCH_ABORTED')
    assert.equal(modifications, 0, 'late native refresh must not touch the underlying store')
    assert.equal(h.inference(), 0)
    await turn()
    assert.equal(h.releases(), 1)
  } finally { finishRead.resolve(); continueNative.resolve(); h.dispose() }
})
