import { createHash, randomUUID } from 'node:crypto'
import { grantOf, isExpired } from '../lib/quota/grant.js'

// Contract verified against openai/codex commit 136386e, backend-client
// src/client/rate_limit_resets.rs and src/types.rs. This is earned-credit
// redemption only: no purchase endpoint, refresh, replay or automatic retry.
export const RESET_CREDITS_URL = 'https://chatgpt.com/backend-api/wham/rate-limit-reset-credits'
export class ResetError extends Error {
  constructor(code) { super(code); this.name = 'ResetError'; this.code = code }
}
const fail = code => { throw new ResetError(code) }
const opaque = value => typeof value === 'string' && value.length > 0 && value.length <= 512
const clone = value => structuredClone(value)
function parse(body) {
  if (!Number.isSafeInteger(body?.available_count) || body.available_count < 0 || !Array.isArray(body.credits) || body.credits.length > 1000) fail('RESET_PAYLOAD')
  const seen = new Set()
  const credits = body.credits.map(row => {
    if (!opaque(row?.id) || seen.has(row.id) || row.reset_type !== 'codex_rate_limits' || !['available', 'redeeming', 'redeemed'].includes(row.status)) fail('RESET_PAYLOAD')
    seen.add(row.id)
    let expiresAt = null
    if (row.expires_at !== null && row.expires_at !== undefined) {
      if (typeof row.expires_at !== 'string' || !/^\d{4}-\d\d-\d\dT.*(?:Z|[+-]\d\d:\d\d)$/.test(row.expires_at) || !Number.isFinite(Date.parse(row.expires_at))) fail('RESET_PAYLOAD')
      expiresAt = new Date(row.expires_at).toISOString()
    }
    return { id: row.id, status: row.status, resetType: row.reset_type, expiresAt }
  })
  return { availableCount: body.available_count, credits }
}

/** User-action service only. Host must not expose confirmations as agent tools.
 * Nonces are ephemeral capabilities; restart invalidates every pending action.
 */
export class Resets {
  constructor({ accounts, fetch: http = globalThis.fetch, now = Date.now, confirmationTtlMs = 60_000, cacheTtlMs = 30_000 }) {
    this.accounts = accounts; this.http = http; this.now = now
    this.confirmationTtlMs = Math.min(Math.max(confirmationTtlMs, 1), 120_000)
    this.cacheTtlMs = cacheTtlMs; this.cache = new Map(); this.confirmations = new Map(); this.results = new Map(); this.tails = new Map(); this.closed = false
  }
  serial(id, fn) {
    const result = (this.tails.get(id) ?? Promise.resolve()).then(() => {
      if (this.closed) fail('RESET_STOPPED')
      return fn()
    })
    const tail = result.catch(() => {})
    this.tails.set(id, tail)
    tail.finally(() => { if (this.tails.get(id) === tail) this.tails.delete(id) })
    return result
  }
  async identity(id) {
    this.accounts.assertAccount(id)
    const record = await this.accounts.recordStore(id).readRecord()
    const grant = grantOf(record)
    if (!grant) fail('RESET_SIGNED_OUT')
    if (isExpired(grant, this.now())) fail('RESET_TOKEN_EXPIRED')
    // Deliberately exclude access/expires: ordinary access rotation isn't a
    // change of principal. A different issuer or refresh grant invalidates consent.
    const fingerprint = createHash('sha256').update(JSON.stringify([id, grant.accountId, record.payload.refresh ?? null, record.payload.idToken ?? null])).digest('hex')
    return { grant, fingerprint }
  }
  async request(grant, method, body) {
    let response
    try {
      response = await this.http(RESET_CREDITS_URL + (method === 'POST' ? '/consume' : ''), {
        method, redirect: 'error', signal: AbortSignal.timeout(15_000),
        headers: { accept: 'application/json', authorization: `Bearer ${grant.access}`, 'chatgpt-account-id': grant.accountId,
          originator: 'dsh-chatgpt-multi-account', 'OAI-Product-Sku': 'CODEX', ...(body ? { 'content-type': 'application/json' } : {}) },
        ...(body ? { body: JSON.stringify(body) } : {}),
      })
    } catch { fail('RESET_NETWORK') }
    if (!response.ok) fail(response.status === 401 || response.status === 403 ? 'RESET_AUTH' : 'RESET_HTTP')
    try { return await response.json() } catch { fail('RESET_PAYLOAD') }
  }
  async read(id, identity, force) {
    const cached = this.cache.get(id)
    if (!force && cached?.fingerprint === identity.fingerprint && cached.until > this.now()) return clone(cached.view)
    const parsed = parse(await this.request(identity.grant, 'GET'))
    const view = { accountId: id, ...parsed, fetchedAt: this.now(), freshness: 'fresh', error: null }
    this.cache.set(id, { fingerprint: identity.fingerprint, until: this.now() + this.cacheTtlMs, view })
    return clone(view)
  }
  list(id, force = false) {
    return this.serial(id, async () => {
      this.accounts.assertAccount(id)
      try { return await this.read(id, await this.identity(id), force) }
      catch (error) {
        this.cache.delete(id)
        return { accountId: id, availableCount: null, credits: [], fetchedAt: null, freshness: 'empty', error: error instanceof ResetError ? error.code : 'RESET_UNAVAILABLE' }
      }
    })
  }
  mutation(id, fn) {
    return this.serial(id, () => this.accounts.exclusive(async () => {
      this.accounts.assertIdle(id)
      if (this.accounts.authorizing?.has(id) || this.accounts.isAuthorizing?.(id)) fail('LOGIN_IN_PROGRESS')
      return fn()
    }))
  }
  available(view, creditId) {
    const credit = view.credits.find(row => row.id === creditId)
    if (view.availableCount <= 0 || !credit || credit.status !== 'available' || (credit.expiresAt !== null && Date.parse(credit.expiresAt) <= this.now())) fail('RESET_CREDIT_UNAVAILABLE')
    return credit
  }
  publicConfirmation(id, item) {
    return { accountId: id, credit: clone(item.credit), stage: item.stage, nonce: item.nonce, expiresAt: item.expiresAt }
  }
  begin(id, creditId) {
    return this.mutation(id, async () => {
      this.confirmations.delete(id)
      if (!opaque(creditId)) fail('RESET_INVALID_CREDIT')
      const identity = await this.identity(id)
      const credit = this.available(await this.read(id, identity, true), creditId)
      const item = { credit, fingerprint: identity.fingerprint, stage: 1, nonce: randomUUID(), expiresAt: this.now() + this.confirmationTtlMs }
      this.confirmations.set(id, item)
      return this.publicConfirmation(id, item)
    })
  }
  async checked(id, nonce, stage) {
    const item = this.confirmations.get(id)
    if (!item || !opaque(nonce) || item.nonce !== nonce || item.stage !== stage) fail('RESET_CONFIRMATION_INVALID')
    if (item.expiresAt <= this.now()) { this.confirmations.delete(id); fail('RESET_CONFIRMATION_EXPIRED') }
    const identity = await this.identity(id)
    if (identity.fingerprint !== item.fingerprint) { this.confirmations.delete(id); fail('RESET_ACCOUNT_CHANGED') }
    return { item, identity }
  }
  advance(id, nonce) {
    return this.mutation(id, async () => {
      const { item } = await this.checked(id, nonce, 1)
      item.stage = 2; item.nonce = randomUUID()
      return this.publicConfirmation(id, item)
    })
  }
  consume(id, nonce) {
    return this.mutation(id, async () => {
      for (const [key, value] of this.results) if (value.until <= this.now()) this.results.delete(key)
      const prior = this.results.get(nonce)
      if (prior?.id === id) return clone(prior.result)
      const { item, identity } = await this.checked(id, nonce, 2)
      // Burn before ANY asynchronous validation/dispatch. Even unknown results
      // cannot re-enter this attempt; a new begin requires fresh human warnings.
      this.confirmations.delete(id)
      this.available(await this.read(id, identity, true), item.credit.id)
      const current = await this.identity(id)
      if (current.fingerprint !== item.fingerprint) fail('RESET_ACCOUNT_CHANGED')
      this.accounts.assertIdle(id)
      if (this.closed) fail('RESET_STOPPED')
      if (item.expiresAt <= this.now()) fail('RESET_CONFIRMATION_EXPIRED')
      let outcome = 'unknown'
      try {
        const body = await this.request(current.grant, 'POST', { redeem_request_id: randomUUID(), credit_id: item.credit.id })
        if (['reset', 'nothing_to_reset', 'no_credit', 'already_redeemed'].includes(body?.code)) outcome = body.code
      } catch { /* A dispatched POST has an unknown result, never retry it. */ }
      this.cache.delete(id)
      const result = { accountId: id, creditId: item.credit.id, outcome }
      this.results.set(nonce, { id, until: this.now() + 120_000, result })
      return clone(result)
    })
  }
  abort(id, nonce) {
    return this.serial(id, () => {
      this.accounts.assertAccount(id)
      const item = this.confirmations.get(id)
      if (item?.nonce === nonce) this.confirmations.delete(id)
      return { accountId: id, aborted: item?.nonce === nonce }
    })
  }
  invalidate(id) { this.cache.delete(id); this.confirmations.delete(id) }
  close() { this.closed = true; this.cache.clear(); this.confirmations.clear(); this.results.clear() }
}
