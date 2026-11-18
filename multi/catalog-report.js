import { randomUUID } from 'node:crypto'
import { grantOf, isExpired } from '../lib/quota/grant.js'

export const CATALOG_REPORT_URL = 'https://chatgpt.com/backend-api/codex/models?client_version=0.166.0'
const CLIENT_VERSION = '0.166.0'
const MAX_BYTES = 2 * 1024 * 1024
const safeWord = value => typeof value === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,159}$/.test(value) ? value : null
const fail = code => { throw Object.assign(new Error(code), { code }) }
const SAFE_ERRORS = new Set(['CATALOG_SIGNED_OUT', 'CATALOG_TOKEN_EXPIRED', 'CATALOG_AUTH_REJECTED', 'CATALOG_THROTTLED', 'CATALOG_HTTP', 'CATALOG_PAYLOAD', 'CATALOG_TOO_LARGE', 'CATALOG_TIMEOUT', 'CATALOG_NETWORK', 'CATALOG_STOPPED', 'CATALOG_ACCOUNT_CHANGED', 'ACCOUNT_NOT_FOUND', 'ACCOUNT_SIGNED_OUT', 'LOGIN_IN_PROGRESS', 'PLUGIN_STOPPED'])

/** Diagnostics only. No inference, refresh, metadata import, capability verdicts or
 * selection changes. Never forward raw server objects, prompts, headers or grants. */
export function summarizeCatalog(payload, nativeIds) {
  if (!payload || !Array.isArray(payload.models) || payload.models.length > 1000) fail('CATALOG_PAYLOAD')
  const seen = new Set()
  return payload.models.flatMap(row => {
    const id = safeWord(row?.slug)
    if (!id || seen.has(id)) return []
    seen.add(id)
    return [{ id, native: nativeIds.has(id), visibility: safeWord(row.visibility),
      toolMode: safeWord(row.tool_mode), responsesLite: typeof row.use_responses_lite === 'boolean' ? row.use_responses_lite : null,
      experimentalToolNames: Array.isArray(row.experimental_supported_tools) ? row.experimental_supported_tools.map(item => safeWord(typeof item === 'string' ? item : item?.name ?? item?.type)).filter(Boolean).slice(0, 50) : [],
      reasoningLevels: Array.isArray(row.supported_reasoning_levels) ? [...new Set(row.supported_reasoning_levels.map(level => safeWord(level?.effort)).filter(Boolean))].slice(0, 20) : [],
      defaultReasoning: safeWord(row.default_reasoning_level),
      input: Array.isArray(row.input_modalities) ? row.input_modalities.filter(value => ['text', 'image', 'audio', 'video'].includes(value)).slice(0, 4) : [],
      contextWindow: Number.isSafeInteger(row.context_window) && row.context_window > 0 && row.context_window <= 100000000 ? row.context_window : null }]
  })
}

async function boundedJson(response, signal) {
  const declared = response.headers?.get?.('content-length')
  if (declared && Number(declared) > MAX_BYTES) fail('CATALOG_TOO_LARGE')
  if (!response.body?.getReader) fail('CATALOG_PAYLOAD')
  const reader = response.body.getReader(), decoder = new TextDecoder()
  const abortBody = () => { void reader.cancel().catch(() => {}) }
  signal.addEventListener('abort', abortBody, { once: true })
  if (signal.aborted) abortBody()
  let size = 0, text = ''
  try {
    while (true) {
      signal.throwIfAborted()
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > MAX_BYTES) fail('CATALOG_TOO_LARGE')
      text += decoder.decode(value, { stream: true })
    }
    text += decoder.decode()
    try { return JSON.parse(text) } catch { fail('CATALOG_PAYLOAD') }
  } finally {
    signal.removeEventListener('abort', abortBody)
    try { await reader.cancel() } catch {}
  }
}

export function createCatalogReporter({ accounts, nativeIds = [], fetch: http = globalThis.fetch, now = Date.now, timeoutMs = 15000 }) {
  const active = new Map(), recent = new Map(), controllers = new Set()
  const ids = new Set(nativeIds)
  let stopped = false
  const empty = (error, retryAt = null) => ({ checkedAt: null, clientVersion: CLIENT_VERSION, models: [], error, retryAt })
  async function run(id) {
    const controller = new AbortController()
    controllers.add(controller)
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    let lease
    try {
      if (stopped) fail('CATALOG_STOPPED')
      lease = await accounts.acquireAccount('catalog-report-' + randomUUID(), id)
      controller.signal.throwIfAborted()
      const grant = grantOf(await accounts.recordStore(id).readRecord())
      if (!grant) fail('CATALOG_SIGNED_OUT')
      if (isExpired(grant, now())) fail('CATALOG_TOKEN_EXPIRED')
      const response = await http(CATALOG_REPORT_URL, { method: 'GET', redirect: 'error', cache: 'no-store', signal: controller.signal,
        headers: { accept: 'application/json', authorization: `Bearer ${grant.access}`, 'chatgpt-account-id': grant.accountId } })
      controller.signal.throwIfAborted()
      if (response.redirected || (response.status >= 300 && response.status < 400)) fail('CATALOG_HTTP')
      if (!response.ok) {
        try { await response.body?.cancel() } catch {}
        if ([401, 403].includes(response.status)) fail('CATALOG_AUTH_REJECTED')
        if (response.status === 429) {
          const raw = response.headers?.get?.('retry-after')
          const delay = /^\d+$/.test(raw ?? '') ? Number(raw) * 1000 : Date.parse(raw ?? '') - now()
          recent.set(id, { report: empty('CATALOG_THROTTLED', now() + Math.min(300000, Math.max(30000, Number.isFinite(delay) ? delay : 30000))), until: now() + 30000 })
          const report = recent.get(id).report
          recent.set(id, { report, until: report.retryAt })
          return report
        }
        fail('CATALOG_HTTP')
      }
      const models = summarizeCatalog(await boundedJson(response, controller.signal), ids)
      controller.signal.throwIfAborted()
      const current = grantOf(await accounts.recordStore(id).readRecord())
      if (!current || current.accountId !== grant.accountId) fail('CATALOG_ACCOUNT_CHANGED')
      if (stopped) fail('CATALOG_STOPPED')
      return { checkedAt: now(), clientVersion: CLIENT_VERSION, models, error: null, retryAt: null }
    } catch (error) {
      const code = stopped ? 'CATALOG_STOPPED' : controller.signal.aborted ? 'CATALOG_TIMEOUT' : SAFE_ERRORS.has(error?.code) ? error.code : 'CATALOG_NETWORK'
      return empty(code)
    } finally { clearTimeout(timer); controllers.delete(controller); await lease?.release() }
  }
  return {
    report(id) {
      try { accounts.assertAccount(id) } catch { return Promise.resolve(empty('ACCOUNT_NOT_FOUND')) }
      if (stopped) return Promise.resolve(empty('CATALOG_STOPPED'))
      if (active.has(id)) return active.get(id)
      const previous = recent.get(id)
      if (previous && previous.until > now()) return Promise.resolve(structuredClone(previous.report))
      const work = run(id).then(report => {
        // A small anti-double-click cache only; reports are not model availability decisions.
        if (!stopped && report.error !== 'CATALOG_THROTTLED') recent.set(id, { report, until: now() + 10000 })
        return structuredClone(report)
      }).finally(() => active.delete(id))
      active.set(id, work)
      return work
    },
    async dispose() {
      stopped = true
      for (const controller of controllers) controller.abort()
      await Promise.allSettled([...active.values()])
      recent.clear()
    },
  }
}

export async function installCatalogReport(ctx, accounts) {
  const { openaiCodexProvider } = await ctx.loader.import('@earendil-works/pi-ai/providers/openai-codex')
  const reporter = createCatalogReporter({ accounts, nativeIds: openaiCodexProvider().getModels().map(model => model.id) })
  ctx.effect(() => () => reporter.dispose(), 'chatgpt: read-only catalog report')
  ctx.connection.fetch.register({ path: '/api/chatgpt-catalog-report', methods: ['GET'], requestBody: 'buffered',
    async fetch(request) {
      const report = await reporter.report(new URL(request.url).searchParams.get('accountId'))
      return Response.json(report, { headers: { 'cache-control': 'no-store' } })
    },
  })
  return reporter
}
