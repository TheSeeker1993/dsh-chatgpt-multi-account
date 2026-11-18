import { createHash } from 'node:crypto'

const TTL = 300000
const LIMIT = 1024 * 1024
const BASE = 'https://chatgpt.com/backend-api'
const LEVELS = ['off', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max']
const WIRE = ['none', ...LEVELS]
// DSH pi-ai getSupportedThinkingLevels: ordinary levels are implicit;
// xhigh/max are opt-in and null explicitly disables any level.
export function reasoningForModel(model) {
  const efforts = (!model.reasoning ? ['off'] : LEVELS.filter(level => {
    const mapped = model.thinkingLevelMap?.[level]
    return mapped !== null && (!['xhigh', 'max'].includes(level) || mapped !== undefined)
  })).map(id => ({ id, name: id }))
  return freeze({ efforts, defaultEffort: efforts.find(e => e.id === 'medium')?.id ?? efforts[0]?.id ?? null })
}
const wireEffort = (model, level) => model.thinkingLevelMap?.[level] ?? (level === 'off' ? 'none' : level)
const plain = x => x && typeof x === 'object' && !Array.isArray(x)
const idOK = x => typeof x === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,159}$/.test(x)
const positive = x => Number.isSafeInteger(x) && x > 0 && x <= 100000000
const freeze = x => { if (x && typeof x === 'object') { Object.values(x).forEach(freeze); Object.freeze(x) }; return x }
const copy = x => JSON.parse(JSON.stringify(x))
export class CatalogError extends Error {
  constructor(code) { super(code); this.code = code }
}
const fail = code => { throw new CatalogError(code) }
const safeTree = x => {
  if (typeof x === 'boolean' || (typeof x === 'number' && Number.isFinite(x))) return x
  if (!plain(x)) fail('CATALOG_INVALID_MODEL')
  return Object.fromEntries(Object.entries(x).map(([k, v]) => {
    if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(k) || /auth|header|url|token|key/i.test(k)) fail('CATALOG_INVALID_MODEL')
    return [k, safeTree(v)]
  }))
}
// Explicit field selection: configuration never supplies credentials or a transport.
function definition(value) {
  if (!plain(value) || !idOK(value.id) || typeof value.name !== 'string' || !value.name.trim() || value.name.length > 200
    || value.baseUrl !== BASE || value.api !== 'openai-codex-responses' || value.provider !== 'openai-codex' || value.type !== 'chat'
    || !positive(value.contextWindow) || !positive(value.maxTokens) || typeof value.reasoning !== 'boolean'
    || !Array.isArray(value.input) || !value.input.length || value.input.some(x => !['text', 'image'].includes(x))
    || !plain(value.cost) || (value.thinkingLevelMap !== undefined && !plain(value.thinkingLevelMap))) fail('CATALOG_INVALID_MODEL')
  const cost = {}
  for (const key of ['input', 'output', 'cacheRead', 'cacheWrite']) {
    if (!Number.isFinite(value.cost[key]) || value.cost[key] < 0) fail('CATALOG_INVALID_MODEL')
    cost[key] = value.cost[key]
  }
  if (value.cost.tiers !== undefined) {
    if (!Array.isArray(value.cost.tiers)) fail('CATALOG_INVALID_MODEL')
    cost.tiers = value.cost.tiers.map(t => {
      const r = {}
      for (const k of ['inputTokensAbove', 'input', 'output', 'cacheRead', 'cacheWrite']) {
        if (k === 'cacheWrite' && t[k] === undefined) continue
        if (!Number.isFinite(t[k]) || t[k] < 0) fail('CATALOG_INVALID_MODEL')
        r[k] = t[k]
      }
      return r
    })
  }
  const thinkingLevelMap = {}
  for (const [k, v] of Object.entries(value.thinkingLevelMap ?? {})) {
    if (!LEVELS.includes(k) || (v !== null && !WIRE.includes(v))) fail('CATALOG_INVALID_MODEL')
    thinkingLevelMap[k] = v
  }
  const out = { id: value.id, name: value.name.trim(), api: value.api, provider: value.provider, baseUrl: BASE, type: 'chat',
    reasoning: value.reasoning, input: [...new Set(value.input)], cost, contextWindow: value.contextWindow, maxTokens: value.maxTokens, thinkingLevelMap }
  for (const k of ['compat', 'inputLimits']) if (value[k] !== undefined) out[k] = safeTree(value[k])
  return freeze(out)
}
const ALLOWED = new Set(['id', 'name', 'api', 'provider', 'baseUrl', 'type', 'reasoning', 'input', 'cost', 'contextWindow', 'maxTokens', 'thinkingLevelMap', 'compat', 'inputLimits'])

async function readJSON(response) {
  if (Number(response.headers?.get?.('content-length')) > LIMIT) fail('CATALOG_TOO_LARGE')
  if (!response.body?.getReader) fail('CATALOG_INVALID_RESPONSE')
  const reader = response.body.getReader()
  let size = 0
  const chunks = []
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > LIMIT) fail('CATALOG_TOO_LARGE')
      chunks.push(Buffer.from(value))
    }
  } catch (e) { await reader.cancel().catch(() => {}); throw e }
  finally { reader.releaseLock() }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')) } catch { fail('CATALOG_INVALID_JSON') }
}

export class ModelCatalog {
  constructor({ accounts, nativeModels, authenticate, fetch = global.fetch, now = Date.now, clientVersion = '0.166.0', onChanged = () => {} }) {
    if (!/^\d+\.\d+\.\d+$/.test(clientVersion)) fail('CATALOG_INVALID_VERSION')
    this.accounts = accounts; this.authenticate = authenticate; this.fetch = fetch; this.now = now
    this.clientVersion = clientVersion; this.onChanged = onChanged
    this.native = new Map(); this.manual = new Map(); this.entries = new Map(); this.active = new Map(); this.version = 0; this.closed = false
    for (const model of nativeModels ?? []) { try { const m = definition(model); this.native.set(m.id, m) } catch {} }
    this.rebuild()
  }
  rebuild() { this.known = freeze([...new Map([...(this.replaceManual ? [] : this.native), ...this.manual]).values()]) }
  metadata(id) { return this.manual.get(id) ?? (this.replaceManual ? undefined : this.native.get(id)) }
  knownModels() { return this.known }
  get manualModels() { return freeze([...this.manual.values()]) }
  changed() { this.version++; try { this.onChanged() } catch {} }
  setManual(models, { replace = false } = {}) {
    if (this.closed) fail('CATALOG_DISPOSED')
    if (!Array.isArray(models) || models.length > 1000) fail('CATALOG_INVALID_MODEL')
    const next = new Map()
    for (const m of models) {
      if (!plain(m) || Object.keys(m).some(k => !ALLOWED.has(k)) || next.has(m.id)) fail('CATALOG_INVALID_MODEL')
      const full = definition({ ...this.native.get(m.id), ...m })
      next.set(full.id, full)
    }
    if (JSON.stringify([...next]) === JSON.stringify([...this.manual]) && Boolean(this.replaceManual) === Boolean(replace)) return
    this.replaceManual = Boolean(replace)
    this.manual = next; this.rebuild()
    for (const entry of this.entries.values()) if (entry.rows) entry.models = this.normalize(entry.rows)
    this.changed()
  }
  normalize(rows) {
    const result = new Map()
    for (const r of rows) {
      if (!plain(r) || !idOK(r.slug) || result.has(r.slug)) continue
      // Upstream ModelVisibility is list/hide/none. Hidden rows are not new choices.
      if (r.visibility === 'hide' || r.visibility === 'none') continue
      const native = this.metadata(r.slug)
      let reason = native ? null : 'CATALOG_METADATA_REQUIRED'
      if (r.visibility !== undefined && r.visibility !== 'list') reason = 'CATALOG_VISIBILITY_UNSUPPORTED'
      if ((r.use_responses_lite !== undefined && r.use_responses_lite !== false) || (r.tool_mode != null && r.tool_mode !== 'direct')
        || (r.experimental_supported_tools !== undefined && (!Array.isArray(r.experimental_supported_tools) || r.experimental_supported_tools.length > 0))) reason = 'CATALOG_TRANSPORT_UNSUPPORTED'
      if (r.minimal_client_version != null) {
        const v = Array.isArray(r.minimal_client_version) ? r.minimal_client_version : String(r.minimal_client_version).split('.').map(Number)
        const current = this.clientVersion.split('.').map(Number)
        if (v.length !== 3 || v.some(x => !Number.isInteger(x) || x < 0) || v.some((n, i) => n > current[i] && v.slice(0, i).every((x, j) => x === current[j]))) reason = 'CATALOG_CLIENT_UPDATE_REQUIRED'
      }
      let efforts = native ? reasoningForModel(native).efforts : []
      if (r.supported_reasoning_levels !== undefined && !Array.isArray(r.supported_reasoning_levels)) reason = 'CATALOG_REASONING_UNSUPPORTED'
      if (r.context_window != null && !positive(r.context_window)) reason = 'CATALOG_METADATA_REQUIRED'
      if (Array.isArray(r.supported_reasoning_levels)) {
        if (r.supported_reasoning_levels.some(e => !plain(e) || !WIRE.includes(e.effort))) reason = 'CATALOG_REASONING_UNSUPPORTED'
        const supported = new Set(r.supported_reasoning_levels.map(e => e?.effort))
        efforts = efforts.filter(e => supported.has(wireEffort(native, e.id)))
      }
      const defaultEffort = efforts.find(e => e.id === r.default_reasoning_level)?.id
        ?? efforts.find(e => wireEffort(native, e.id) === r.default_reasoning_level)?.id
        ?? efforts[0]?.id ?? null
      if (r.input_modalities !== undefined && (!Array.isArray(r.input_modalities) || r.input_modalities.some(x => !['text', 'image'].includes(x)))) reason = 'CATALOG_INPUT_UNSUPPORTED'
      const input = native?.input.filter(x => !Array.isArray(r.input_modalities) || r.input_modalities.includes(x))
      if (native?.reasoning && !efforts.length) reason = 'CATALOG_REASONING_UNSUPPORTED'
      if (input && !input.length) reason = 'CATALOG_INPUT_UNSUPPORTED'
      result.set(r.slug, { id: r.slug, name: this.manual.get(r.slug)?.name ?? (typeof r.display_name === 'string' && r.display_name.length <= 200 ? r.display_name : native?.name ?? r.slug), compatible: !reason, reason,
        source: this.manual.has(r.slug) ? 'manual' : native ? 'native' : 'server', reasoning: { efforts, defaultEffort },
        ...(input ? { input, contextWindow: positive(r.context_window) ? Math.min(native.contextWindow, r.context_window) : native.contextWindow, maxTokens: native.maxTokens } : {}) })
    }
    return freeze([...result.values()])
  }
  cached(accountId) {
    const e = this.entries.get(accountId)
    return freeze({ accountId, models: e?.models ?? [], checkedAt: e?.checkedAt ?? null,
      freshness: !e?.models?.length ? 'empty' : e.error || this.now() - e.checkedAt >= TTL ? 'stale' : 'fresh',
      error: e?.error ?? null, nextRetryAt: e?.nextRetryAt ?? null, etag: e?.etag ?? null, version: this.version })
  }
  invalidate(accountId) {
    this.active.get(accountId)?.controller.abort()
    this.active.delete(accountId)
    if (this.entries.delete(accountId)) this.changed()
  }
  async refresh(accountId, { force = true, signal } = {}) {
    if (this.closed) fail('CATALOG_DISPOSED')
    if (!idOK(accountId)) fail('CATALOG_ACCOUNT_INVALID')
    if (signal?.aborted) fail('CATALOG_ABORTED')
    if (this.active.has(accountId)) return this.active.get(accountId).promise
    const old = this.entries.get(accountId)
    if (old?.nextRetryAt > this.now() || (!force && this.cached(accountId).freshness === 'fresh')) return this.cached(accountId)
    const operation = { controller: new AbortController() }
    this.active.set(accountId, operation)
    operation.promise = this.run(accountId, operation, signal)
    return operation.promise
  }
  async run(id, operation, signal) {
    const { controller } = operation
    let lease, timedOut = false, retryAfter = 0
    const abort = () => controller.abort()
    signal?.addEventListener('abort', abort, { once: true })
    const timer = setTimeout(() => { timedOut = true; controller.abort() }, 15000)
    const current = () => !this.closed && this.active.get(id) === operation
    let entry = this.entries.get(id) ?? {}
    try {
      lease = await this.accounts.acquireAccount(`catalog-${id}`, id)
      const auth = await this.authenticate(id, controller.signal)
      controller.signal.throwIfAborted()
      if (!auth || typeof auth.access !== 'string' || !auth.access || typeof auth.accountId !== 'string' || !auth.accountId || typeof auth.identity !== 'string' || !auth.identity) fail('CATALOG_AUTH_FAILED')
      const identity = createHash('sha256').update(`${id}\0${auth.accountId}\0${auth.identity}\0${this.clientVersion}`).digest('hex')
      if (entry.identity !== identity) {
        entry = { identity }
        if (current()) { this.entries.set(id, entry); this.changed() }
      }
      const response = await this.fetch(`${BASE}/codex/models?client_version=${encodeURIComponent(this.clientVersion)}`, {
        method: 'GET', redirect: 'error', headers: { Authorization: `Bearer ${auth.access}`, 'chatgpt-account-id': auth.accountId }, signal: controller.signal,
      })
      if (response.redirected || (response.status >= 300 && response.status < 400)) fail('CATALOG_REDIRECT')
      if (!response.ok) {
        const header = response.headers?.get?.('retry-after')
        retryAfter = Math.min(TTL, Math.max(0, /^\d+(\.\d+)?$/.test(header ?? '') ? Number(header) * 1000 : Date.parse(header) - this.now() || 0))
        fail(response.status === 429 ? 'CATALOG_RATE_LIMITED' : response.status >= 500 ? 'CATALOG_SERVER_ERROR' : response.status === 401 || response.status === 403 ? 'CATALOG_AUTH_FAILED' : 'CATALOG_HTTP_ERROR')
      }
      const json = await readJSON(response)
      controller.signal.throwIfAborted()
      if (!plain(json) || !Array.isArray(json.models) || json.models.length > 10000) fail('CATALOG_INVALID_RESPONSE')
      if (!json.models.length || !json.models.some(r => plain(r) && idOK(r.slug))) fail('CATALOG_EMPTY_RESPONSE')
      const rows = copy(json.models)
      const models = this.normalize(rows)
      if (current()) {
        const responseTag = response.headers?.get?.('etag')
        const etag = typeof responseTag === 'string' && responseTag.length <= 512 ? responseTag : null
        this.entries.set(id, { identity, rows, models, etag, checkedAt: this.now(), error: null, failures: 0, nextRetryAt: null })
        this.changed()
      }
    } catch (error) {
      if (current()) {
        const code = timedOut ? 'CATALOG_TIMEOUT' : controller.signal.aborted ? 'CATALOG_ABORTED' : error instanceof CatalogError ? error.code : 'CATALOG_NETWORK_ERROR'
        const backoff = ['CATALOG_RATE_LIMITED', 'CATALOG_SERVER_ERROR', 'CATALOG_NETWORK_ERROR', 'CATALOG_TIMEOUT'].includes(code)
        const failures = (entry.failures ?? 0) + 1
        this.entries.set(id, { ...entry, error: code, failures, nextRetryAt: backoff ? this.now() + Math.min(TTL, Math.max(retryAfter, 1000 * 2 ** Math.min(failures - 1, 9))) : null })
        this.changed()
      }
    } finally {
      clearTimeout(timer); signal?.removeEventListener('abort', abort)
      lease?.release()
      if (this.active.get(id) === operation) this.active.delete(id)
    }
    if (this.closed) fail('CATALOG_DISPOSED')
    return this.cached(id)
  }
  async available(accountId, model, { signal } = {}) {
    if (this.closed) fail('CATALOG_DISPOSED')
    let view = this.cached(accountId)
    if (view.freshness !== 'fresh') view = await this.refresh(accountId, { force: false, signal })
    if (view.freshness !== 'fresh') fail(view.freshness === 'empty' ? 'CATALOG_EMPTY' : 'CATALOG_STALE')
    const row = view.models.find(m => m.id === model)
    if (!row) fail('CATALOG_UNAVAILABLE')
    if (!row.compatible) fail('CATALOG_INCOMPATIBLE')
    const full = this.metadata(model)
    // Restrict the immutable definition to the server-advertised per-model limits.
    return freeze({ ...full, input: row.input, contextWindow: row.contextWindow, thinkingLevelMap: Object.fromEntries(LEVELS.map(k => [k, row.reasoning.efforts.some(e => e.id === k) ? wireEffort(full, k) : null])) })
  }
  dispose() {
    this.closed = true
    for (const operation of this.active.values()) operation.controller.abort()
    this.active.clear()
  }
}
