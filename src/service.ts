import { QuotaCache } from './quota/cache.js'
import { isExpired, readGrant, type CredentialReader, type PiAiGrant } from './quota/grant.js'
import {
  DEFAULT_CACHE_TTL_MS,
  type LoggedOutCard,
  type QueryFailedCard,
  type QuotaCard,
} from './quota/model.js'
import { readUsage, UsageError } from './quota/usage.js'

export interface ReaderOptions {
  credentials: CredentialReader
  cacheTtlMs?: number
  fetch?: typeof fetch
  /** Auth-only native refresh for this account. Never an inference request. */
  refreshGrant?: (grant: PiAiGrant, signal: AbortSignal) => Promise<void>
}

/** Message codes the client turns into copy. The host ships no prose to the UI. */
const SIGNED_OUT = 'quota-signed-out'
const TOKEN_STALE = 'quota-token-stale'
const TOKEN_REJECTED = 'quota-token-rejected'
const THROTTLED = 'quota-throttled'
const BLOCKED = 'quota-blocked'
const UNAVAILABLE = 'quota-unavailable'
const STOPPED = 'quota-stopped'

function signedOut(): LoggedOutCard {
  return {
    status: 'logged-out',
    freshness: 'empty',
    fetchedAt: null,
    message: SIGNED_OUT,
    planType: null,
    windows: [],
  }
}

function failed(message: string, stale: ReturnType<QuotaCache['get']>): QueryFailedCard {
  if (stale === undefined) {
    return {
      status: 'query-failed',
      freshness: 'empty',
      fetchedAt: null,
      message,
      planType: null,
      windows: [],
    }
  }
  return {
    status: 'query-failed',
    freshness: 'stale',
    fetchedAt: stale.card.fetchedAt,
    message,
    planType: stale.card.planType,
    windows: stale.card.windows,
  }
}

function messageFor(error: unknown): string {
  if (!(error instanceof UsageError)) return UNAVAILABLE
  if (error.reason === 'auth') return TOKEN_REJECTED
  if (error.reason === 'rate-limit') return THROTTLED
  if (error.reason === 'blocked') return BLOCKED
  return UNAVAILABLE
}

/**
 * Serial usage reads against the Codex grant `dsh-llm-pi-ai` owns.
 *
 * An absent grant is "not signed in". Expired access grants may invoke the optional
 * account-scoped native refresher once, then are re-read before the quota GET. Without
 * a refresher they are reported stale rather than sent. Fresh cache hits make no HTTP
 * request, and credential identity changes invalidate cached quota data.
 */
export class QuotaReader {
  private readonly cache: QuotaCache
  private tail: Promise<unknown> = Promise.resolve()
  private disposed = false
  private active: AbortController | undefined
  private epoch = 0
  private issuer: string | undefined

  constructor(private readonly options: ReaderOptions) {
    const ttl = options.cacheTtlMs
    this.cache = new QuotaCache(ttl !== undefined && Number.isFinite(ttl) && ttl >= 0 ? ttl : DEFAULT_CACHE_TTL_MS)
  }

  read(refresh = false): Promise<QuotaCard> {
    const job = this.tail.then(() => this.load(refresh))
    this.tail = job.then(() => undefined, () => undefined)
    return job
  }

  /**
   * Drop the cached card, after a sign-out. The cache is not keyed by account, so without
   * this a sign-in with another account within the TTL would be shown the last one's quota.
   */
  forget(): void {
    this.epoch++
    this.cache.clear()
    this.active?.abort()
  }

  dispose(): void {
    this.disposed = true
    this.epoch++
    this.active?.abort()
  }

  private async load(refresh: boolean): Promise<QuotaCard> {
    if (this.disposed) return failed(STOPPED, undefined)
    const epoch = this.epoch
    let grant: PiAiGrant | null
    try {
      grant = await readGrant(this.options.credentials)
    } catch {
      return failed(UNAVAILABLE, this.cache.get(Date.now()))
    }
    if (this.disposed || epoch !== this.epoch) return failed(STOPPED, undefined)
    if (grant === null) {
      this.cache.clear()
      return signedOut()
    }
    if (this.issuer !== grant.accountId) { this.cache.clear(); this.issuer = grant.accountId }
    if (!refresh) {
      const hit = this.cache.get(Date.now())
      if (hit?.freshness === 'fresh') return hit.card
    }
    if (this.disposed) return failed(STOPPED, undefined)
    const original = grant
    this.active = new AbortController()
    try {
      if (isExpired(grant, Date.now())) {
        if (!this.options.refreshGrant) return failed(TOKEN_STALE, this.cache.get(Date.now()))
        try { await this.options.refreshGrant(grant, this.active.signal) }
        catch (error) {
          if (this.disposed || epoch !== this.epoch) return failed(STOPPED, undefined)
          const code = (error as { code?: string })?.code
          return failed(code === 'QUOTA_REAUTH_REQUIRED' ? 'quota-reauth-required' : 'quota-refresh-failed', this.cache.get(Date.now()))
        }
        if (this.disposed || epoch !== this.epoch) return failed(STOPPED, undefined)
        grant = await readGrant(this.options.credentials)
        if (!grant || grant.accountId !== original.accountId) { this.cache.clear(); return failed(UNAVAILABLE, undefined) }
        if (isExpired(grant, Date.now())) return failed('quota-refresh-failed', this.cache.get(Date.now()))
      }
      this.active.signal.throwIfAborted()
      const quota = await readUsage(grant, this.active.signal, this.options.fetch)
      const latest = await readGrant(this.options.credentials)
      if (this.disposed || epoch !== this.epoch) return failed(STOPPED, undefined)
      if (!latest || latest.accountId !== grant.accountId) { this.cache.clear(); return failed(UNAVAILABLE, undefined) }
      const card = {
        status: 'logged-in' as const,
        freshness: 'fresh' as const,
        fetchedAt: Date.now(),
        planType: quota.planType,
        limitReached: quota.limitReached,
        windows: quota.windows,
      }
      this.cache.put(card, card.fetchedAt)
      return card
    } catch (error) {
      if (this.disposed || epoch !== this.epoch) return failed(STOPPED, undefined)
      return failed(messageFor(error), this.cache.get(Date.now()))
    } finally {
      this.active = undefined
    }
  }
}
