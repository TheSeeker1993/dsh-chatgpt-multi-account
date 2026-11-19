import { createHash } from 'node:crypto'

export const CODEX_API = 'openai-codex-responses'
export const CODEX_BASE_URL = 'https://chatgpt.com/backend-api'
const EFFORTS = Object.freeze(['low', 'medium', 'high', 'xhigh'])
const MAX_IDS = 128
const MAX_ACCOUNTS = 64
const tokenLimit = (value, max) => Number.isSafeInteger(value) && value > 0 && value <= max
export const catalogIdentity = (localId, issuerId) => createHash('sha256').update(`${localId}:${issuerId}`).digest('hex')

// Versioned opt-in contract, not inferred from existing Codex announcements. No
// released catalog is assumed to implement this. Never use metadata as config.
export function confirmedCatalogModel(row) {
  const id = row?.slug, proof = row?.dsh_adapter_compatibility
  if (typeof id !== 'string' || !/^gpt-[a-z0-9][a-z0-9.-]{0,75}$/.test(id) || row.visibility !== 'list') return
  if (proof?.version !== 1 || proof.api !== CODEX_API || proof.auth !== 'openai-codex-oauth'
    || proof.base_url !== CODEX_BASE_URL || proof.endpoint !== '/codex/responses'
    || proof.streaming !== 'sse' || proof.tools !== 'json-schema-function'
    || proof.tool_results !== 'function-call-output' || proof.replay !== 'codex-responses-v1'
    || proof.max_output_tokens !== 'client-omitted') return
  if (row.tool_mode !== 'direct' || row.use_responses_lite !== false) return
  const window = row.context_window, output = row.max_output_tokens
  if (!tokenLimit(window, 10000000) || !tokenLimit(output, Math.min(window, 1000000))) return
  if (!Array.isArray(row.input_modalities) || row.input_modalities.length < 1 || row.input_modalities.length > 2
    || new Set(row.input_modalities).size !== row.input_modalities.length || !row.input_modalities.includes('text')
    || row.input_modalities.some(mode => mode !== 'text' && mode !== 'image')) return
  const efforts = row.supported_reasoning_levels
  if (!Array.isArray(efforts) || !efforts.length || efforts.length > EFFORTS.length) return
  const levels = new Set(efforts.map(level => level?.effort))
  if (levels.size !== efforts.length || [...levels].some(level => !EFFORTS.includes(level))
    || !levels.has(row.default_reasoning_level) || !levels.has('low')) return
  const thinkingLevelMap = Object.freeze({ off: null, minimal: null, max: null,
    ...Object.fromEntries(EFFORTS.map(level => [level, levels.has(level) ? level : null])) })
  return Object.freeze({ id, name: id, type: 'chat', api: CODEX_API, provider: 'openai-codex', baseUrl: CODEX_BASE_URL,
    reasoning: true, thinkingLevelMap, input: Object.freeze(row.input_modalities.includes('image') ? ['text', 'image'] : ['text']),
    contextWindow: window, maxTokens: output,
    // Pi AI requires numeric accounting fields. Catalog data is not pricing;
    // zero is an unavailable API estimate, not a statement about OAuth usage.
    cost: Object.freeze({ input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }),
  })
}

export function createCatalogRegistry(knownIds) {
  const profiles = new Map(), accounts = new Map(), known = new Set(knownIds)
  let version = 0
  return {
    get version() { return version },
    models() {
      const advertised = new Set([...accounts.values()].flatMap(entry => [...entry.ids]))
      return [...profiles.values()].filter(model => advertised.has(model.id))
    },
    has: id => profiles.has(id),
    allowed(localId, identity, id) {
      const entry = accounts.get(localId)
      return !!identity && entry?.identity === identity && entry.ids.has(id)
    },
    // Called only for successful, identity-checked reads. An incomplete proof
    // or missing model in a subsequent successful catalog removes admission.
    replace(localId, identity, candidates) {
      const ids = new Set()
      if (!identity || (!accounts.has(localId) && accounts.size >= MAX_ACCOUNTS)) return ids
      for (const model of candidates) {
        if (!model || known.has(model.id)) continue
        const existing = profiles.get(model.id)
        if (existing && JSON.stringify(existing) !== JSON.stringify(model)) continue
        if (!existing) {
          if (profiles.size >= MAX_IDS) continue
          profiles.set(model.id, model)
        }
        ids.add(model.id)
      }
      const previous = accounts.get(localId)
      if (ids.size !== (previous?.ids.size ?? 0) || [...ids].some(id => !previous?.ids.has(id))) version++
      if (ids.size) accounts.set(localId, { identity, ids })
      else accounts.delete(localId)
      return ids
    },
  }
}
