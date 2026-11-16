import { randomUUID, createHash } from 'node:crypto'

export const LEGACY_KEY = 'llm-pi-ai/openai-codex'
export class AccountError extends Error {
  constructor(code) { super(code); this.code = code }
}
const fail = code => { throw new AccountError(code) }
const accountKey = id => id === 'legacy' ? LEGACY_KEY : `dsh-gpt-link/account-${id}`
const validSession = id => typeof id === 'string' && /^[a-zA-Z0-9_-]{1,160}$/.test(id)
const cleanLabel = label => {
  if (typeof label !== 'string' || !label.trim() || label.trim().length > 80) fail('INVALID_LABEL')
  return label.trim()
}

/** Metadata is durable storageDomain data; secret grants live only in credentials.
 * No token is ever copied from the legacy record. Its refresh lock remains the same.
 */
export class Accounts {
  constructor({ domain, credentials, isSessionBusy = () => false, parentSession = () => undefined, isAuthorizing = () => false }) {
    this.domain = domain
    this.credentials = credentials
    this.isSessionBusy = isSessionBusy
    this.parentSession = parentSession
    this.isAuthorizing = isAuthorizing
    this.accounts = domain.table('accounts')
    this.sessions = domain.table('sessions')
    this.activeAccounts = new Map()
    this.activeSessions = new Map()
    this.removing = new Set()
    this.authorizing = new Set()
    this.tail = Promise.resolve()
    this.closed = false
  }
  exclusive(fn) {
    const result = this.tail.then(() => { if (this.closed) fail('PLUGIN_STOPPED'); return fn() })
    this.tail = result.catch(() => {})
    return result
  }
  async initialize() {
    if ((await this.credentials.describeRecord(LEGACY_KEY)).configured && !this.accounts.get('legacy')) {
      await this.accounts.put('legacy', { label: 'ChatGPT · текущий аккаунт', createdAt: Date.now() })
    }
  }
  assertAccount(id) {
    if (typeof id !== 'string' || !this.accounts.get(id) || this.removing.has(id)) fail('ACCOUNT_NOT_FOUND')
    return id
  }
  recordStore(id) {
    this.assertAccount(id)
    const key = accountKey(id)
    return {
      readRecord: async () => { this.assertAccount(id); return this.credentials.readRecord(key) },
      describeRecord: async () => { this.assertAccount(id); return this.credentials.describeRecord(key) },
      deleteRecord: async () => { this.assertAccount(id); return this.credentials.deleteRecord(key) },
    }
  }
  credentialStore(id) {
    this.assertAccount(id)
    const key = accountKey(id)
    const check = provider => { if (provider !== 'openai-codex') fail('INVALID_PROVIDER'); this.assertAccount(id) }
    return {
      read: async provider => { check(provider); return (await this.credentials.readRecord(key))?.payload },
      list: async () => { this.assertAccount(id); return (await this.credentials.describeRecord(key)).configured ? [{ providerId: 'openai-codex', type: 'oauth' }] : [] },
      modify: async (provider, mutate) => {
        check(provider)
        const stored = await this.credentials.modifyRecord(key, async current => {
          check(provider)
          const next = await mutate(current?.payload)
          check(provider)
          return next === undefined ? undefined : { kind: 'grant', payload: JSON.parse(JSON.stringify(next)) }
        })
        return stored?.payload
      },
      delete: async provider => { check(provider); await this.credentials.deleteRecord(key) },
    }
  }
  async snapshot(sessionId) {
    if (sessionId !== undefined && !validSession(sessionId)) fail('INVALID_SESSION')
    const accounts = await Promise.all([...this.accounts.entries()].filter(([id]) => !this.removing.has(id)).map(async ([id, meta]) => ({
      id, label: meta.label, configured: (await this.credentials.describeRecord(accountKey(id))).configured,
    })))
    return { accounts, sessionAccountId: sessionId === undefined ? null : this.sessions.get(sessionId)?.accountId ?? null }
  }
  async create(label) {
    return this.exclusive(async () => {
      const id = randomUUID()
      await this.accounts.put(id, { label: cleanLabel(label), createdAt: Date.now() })
      return id
    })
  }
  async rename(id, label) {
    return this.exclusive(async () => {
      this.assertAccount(id)
      await this.accounts.put(id, { ...this.accounts.get(id), label: cleanLabel(label) })
    })
  }
  async select(sessionId, id) {
    return this.exclusive(async () => {
      if (!validSession(sessionId)) fail('INVALID_SESSION')
      this.assertAccount(id)
      if (this.activeSessions.get(sessionId) || await this.isSessionBusy(sessionId)) fail('SESSION_BUSY')
      if (!(await this.credentials.describeRecord(accountKey(id))).configured) fail('ACCOUNT_SIGNED_OUT')
      await this.sessions.put(sessionId, { accountId: id })
    })
  }
  async resolveSession(sessionId) {
    if (!validSession(sessionId)) fail('SESSION_ACCOUNT_REQUIRED')
    let id = this.sessions.get(sessionId)?.accountId
    // Only framework-declared subagents inherit. Ordinary forks/new sessions must
    // select explicitly. Persist the child binding before its first dispatch.
    if (!id) {
      const seen = new Set([sessionId])
      let cursor = sessionId
      for (let depth = 0; depth < 64 && !id; depth++) {
        cursor = this.parentSession(cursor)
        if (!cursor || seen.has(cursor)) break
        seen.add(cursor)
        id = this.sessions.get(cursor)?.accountId
      }
      if (id) { this.assertAccount(id); await this.sessions.put(sessionId, { accountId: id }) }
    }
    if (!id) fail('SESSION_ACCOUNT_REQUIRED')
    this.assertAccount(id)
    if (!(await this.credentials.describeRecord(accountKey(id))).configured) fail('ACCOUNT_SIGNED_OUT')
    return id
  }
  async acquireSession(sessionId) {
    return this.exclusive(async () => {
      const accountId = await this.resolveSession(sessionId)
      if (this.authorizing.has(accountId) || this.isAuthorizing(accountId)) fail('LOGIN_IN_PROGRESS')
      const record = await this.credentials.readRecord(accountKey(accountId))
      const issuerAccount = record?.payload?.accountId
      if (typeof issuerAccount !== 'string' || !issuerAccount) fail('ACCOUNT_SIGNED_OUT')
      // A re-login can choose another issuer account under the same display label.
      // Hash only public identity, never tokens, before persisting replay provenance.
      const replayIdentity = createHash('sha256').update(`${accountId}:${issuerAccount}`).digest('hex')
      this.activeAccounts.set(accountId, (this.activeAccounts.get(accountId) ?? 0) + 1)
      this.activeSessions.set(sessionId, (this.activeSessions.get(sessionId) ?? 0) + 1)
      let released = false
      return { accountId, replayIdentity, release: () => {
        if (released) return
        released = true
        this.activeAccounts.set(accountId, this.activeAccounts.get(accountId) - 1)
        this.activeSessions.set(sessionId, this.activeSessions.get(sessionId) - 1)
      } }
    })
  }
  assertIdle(id) {
    this.assertAccount(id)
    if (this.activeAccounts.get(id)) fail('ACCOUNT_BUSY')
    for (const [sessionId, binding] of this.sessions.entries()) {
      if (binding.accountId === id && this.isSessionBusy(sessionId)) fail('ACCOUNT_BUSY')
    }
  }
  async remove(id, cancel = async () => {}) {
    return this.exclusive(async () => {
      this.assertIdle(id)
      // Existing legacy authorization remains managed by the original panel.
      if (id === 'legacy') fail('LEGACY_ACCOUNT_PROTECTED')
      this.removing.add(id)
      try {
        await cancel()
        await this.credentials.deleteRecord(accountKey(id))
        // Preserve bindings: an absent account fails closed, never chooses another.
        await this.accounts.delete(id)
      } finally { this.removing.delete(id) }
    })
  }
  key(id) { this.assertAccount(id); return accountKey(id) }
  async close() { this.closed = true; await this.tail; await this.domain.close() }
}
