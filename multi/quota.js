import { createHash } from 'node:crypto'
import { QuotaReader } from '../lib/service.js'

const fail = code => { throw Object.assign(new Error(code), { code }) }
const empty = message => ({ status: message === 'quota-signed-out' ? 'logged-out' : 'query-failed', freshness: 'empty', fetchedAt: null, message, planType: null, windows: [] })
const fingerprint = grant => createHash('sha256').update(JSON.stringify([grant?.accountId, grant?.access, grant?.refresh, grant?.expires])).digest('hex')

/** Only a recognized issuer OAuth error proves reauthentication is required.
 * Do not return/log raw native errors: their bodies may contain secrets. */
function reauthRequired(error) {
  const seen = new Set()
  for (let depth = 0; error && depth < 5 && !seen.has(error); depth++, error = error.cause) {
    seen.add(error)
    if (typeof error.message !== 'string' || error.message.length > 8192) continue
    const match = /^OpenAI Codex token refresh failed \((400|401)\): (.+)$/s.exec(error.message)
    if (!match) continue
    try {
      const body = JSON.parse(match[2])
      const code = typeof body.error === 'string' ? body.error : body.error?.code
      if (['invalid_grant', 'refresh_token_expired', 'refresh_token_reused', 'refresh_token_invalidated'].includes(code)) return true
    } catch {}
  }
  return false
}

/** One account-scoped reader. Native Models.getAuth is auth-only; it never streams.
 * Every read holds an Accounts lease, including refresh writes that outlive abort.
 * The credential store's own modify lock also serializes against inference refresh. */
export function createAccountQuotaReader({ accounts, id, createModels, openaiCodexProvider, cacheTtlMs,
  fetch, now = Date.now, failureCooldownMs = 60000, timeoutMs = 20000 }) {
  const store = accounts.credentialStore(id)
  let stopped = false, failedIdentity, failedCode, retryAt = 0
  const pending = new Set()
  const reader = new QuotaReader({ credentials: accounts.recordStore(id), cacheTtlMs, fetch,
    async refreshGrant(expected, signal) {
      const raw = await store.read('openai-codex')
      if (stopped || signal.aborted) fail('PLUGIN_STOPPED')
      if (!raw || raw.accountId !== expected.accountId) fail('QUOTA_ACCOUNT_CHANGED')
      // A model request may already have refreshed the same grant under its lock.
      if (typeof raw.expires === 'number' && raw.expires > now()) return
      const identity = fingerprint(raw)
      if (identity === failedIdentity && now() < retryAt) fail(failedCode)
      if (typeof raw.refresh !== 'string' || !raw.refresh) {
        failedIdentity = identity; failedCode = 'QUOTA_REAUTH_REQUIRED'; retryAt = now() + failureCooldownMs
        fail(failedCode)
      }
      const tracked = Object.fromEntries(['read', 'list', 'modify', 'delete'].map(method => [method, (...args) => {
        if (stopped || signal.aborted) fail('PLUGIN_STOPPED')
        if (method === 'delete') fail('QUOTA_ACCOUNT_CHANGED')
        if (method === 'modify') {
          const mutate = args[1]
          args[1] = async current => {
            if (!current || current.accountId !== expected.accountId) fail('QUOTA_ACCOUNT_CHANGED')
            // Once refresh starts, allow its rotated token to persist even on unload.
            const next = await mutate(current)
            if (next !== undefined && next.accountId !== expected.accountId) fail('QUOTA_ACCOUNT_CHANGED')
            return next
          }
        }
        const operation = Promise.resolve().then(() => store[method](...args))
        pending.add(operation)
        void operation.then(() => pending.delete(operation), () => pending.delete(operation))
        return operation
      }]))
      try {
        const models = createModels({ credentials: tracked, authContext: { env: async () => undefined, fileExists: async () => false } })
        models.setProvider(openaiCodexProvider())
        const result = await models.getAuth('openai-codex', { signal: AbortSignal.any([signal, AbortSignal.timeout(timeoutMs)]) })
        if (!result) fail('QUOTA_ACCOUNT_CHANGED')
        const refreshed = await store.read('openai-codex')
        if (!refreshed || refreshed.accountId !== expected.accountId || typeof refreshed.access !== 'string' || !refreshed.access || !Number.isFinite(refreshed.expires) || refreshed.expires <= now()) fail('QUOTA_REFRESH_FAILED')
        failedIdentity = undefined; retryAt = 0
      } catch (error) {
        // A provider can rotate the refresh token yet return an unusable access
        // expiry. Throttle the actually stored grant too, not just its old key.
        const stored = await store.read('openai-codex').catch(() => raw)
        failedIdentity = fingerprint(stored)
        failedCode = reauthRequired(error) ? 'QUOTA_REAUTH_REQUIRED' : 'QUOTA_REFRESH_FAILED'
        retryAt = now() + failureCooldownMs
        fail(failedCode)
      }
    },
  })
  return {
    async read(refresh = false) {
      if (stopped) return empty('quota-stopped')
      let lease
      try {
        lease = await accounts.acquireAccount('quota-' + id, id)
        if (stopped) return empty('quota-stopped')
        return await reader.read(refresh)
      } catch (error) {
        return empty(stopped ? 'quota-stopped' : error?.code === 'ACCOUNT_SIGNED_OUT' ? 'quota-signed-out' : 'quota-unavailable')
      } finally {
        // Auth races cancellation, but persistence of a rotated refresh token must
        // complete before releasing the account's relogin/removal protection.
        while (pending.size) await Promise.allSettled([...pending])
        lease?.release()
      }
    },
    forget() { reader.forget(); failedIdentity = undefined; retryAt = 0 },
    dispose() { stopped = true; reader.dispose() },
  }
}
