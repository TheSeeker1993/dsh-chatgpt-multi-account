import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import { ModelCatalog } from './catalog.js'

const fail = code => { throw Object.assign(new Error(code), { code }) }
const FIELDS = ['id', 'name', 'contextWindow', 'maxTokens', 'input', 'reasoning', 'thinkingLevelMap', 'cost', 'compat', 'inputLimits']
// Never spread a settings descriptor (or arbitrary input) into native transport metadata.
export function catalogMetadata(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('CATALOG_INVALID_MODEL')
  const safe = Object.fromEntries(FIELDS.filter(key => Object.hasOwn(value, key)).map(key => [key, value[key]]))
  if (safe.input === undefined && value.modalities !== undefined) safe.input = value.modalities
  return { ...safe, provider: 'openai-codex', baseUrl: 'https://chatgpt.com/backend-api', api: 'openai-codex-responses', type: 'chat' }
}

// Claims are used only as a private cache discriminator, never as authentication.
// Native getAuth and the matching persisted grant remain the authority for access.
function principalFingerprint(grant) {
  const claims = token => {
    if (typeof token !== 'string' || token.length > 131072) return null
    const parts = token.split('.')
    if (parts.length !== 3 || !/^[A-Za-z0-9_-]+$/.test(parts[1])) return null
    try {
      const value = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'))
      return value && typeof value === 'object' && !Array.isArray(value) ? value : null
    } catch { return null }
  }
  const scalar = value => typeof value === 'string' && value.length > 0 && value.length <= 1024 ? value : null
  const identifiers = token => {
    const value = claims(token)
    if (!value) return null
    const auth = value['https://api.openai.com/auth']
    const fields = [scalar(value.sub), scalar(auth?.chatgpt_user_id), scalar(auth?.user_id),
      scalar(auth?.organization_id), scalar(auth?.org_id), scalar(auth?.chatgpt_workspace_id), scalar(auth?.workspace_id),
      scalar(value.organization_id), scalar(value.org_id), scalar(value.workspace_id)]
    // A workspace/account alone does not distinguish its individual users.
    return fields[0] || fields[1] || fields[2] ? fields : null
  }
  const id = identifiers(grant.idToken), access = identifiers(grant.access)
  if (id || access) return ['claims', id, access]
  const fallback = grant.refresh ?? grant.idToken
  if (typeof fallback !== 'string' || !fallback) fail('CATALOG_AUTH_INVALID')
  return ['opaque-grant', fallback]
}

/** Native getAuth can reject on abort while an already-started refresh still persists.
 * The catalog holds its account lease until this function drains that independent work. */
export function createCatalogAuthenticator(accounts, { createModels, openaiCodexProvider, active = new Set() }) {
  return async (id, signal) => {
    const store = accounts.credentialStore(id), pending = new Set()
    active.add(id)
    let closed = false
    const credentials = Object.fromEntries(['read', 'list', 'modify', 'delete'].map(method => [method, (...args) => {
      signal?.throwIfAborted()
      if (closed) fail('CATALOG_ABORTED')
      let work
      try { work = Promise.resolve(store[method](...args)) } catch (error) { work = Promise.reject(error) }
      pending.add(work)
      void work.then(() => pending.delete(work), () => pending.delete(work))
      return work
    }]))
    try {
      const models = createModels({ credentials, authContext: { env: async () => undefined, fileExists: async () => false } })
      models.setProvider(openaiCodexProvider())
      const resolution = await models.getAuth('openai-codex', { signal })
      signal?.throwIfAborted()
      const grant = await credentials.read('openai-codex')
      const access = resolution?.auth?.apiKey
      if (typeof access !== 'string' || !access || grant?.access !== access || typeof grant?.accountId !== 'string' || !grant.accountId) fail('CATALOG_AUTH_INVALID')
      const identity = createHash('sha256').update(JSON.stringify([id, grant.accountId, principalFingerprint(grant)])).digest('hex')
      return { access, accountId: grant.accountId, identity }
    } finally {
      closed = true
      while (pending.size) await Promise.allSettled([...pending])
      active.delete(id)
    }
  }
}

const manual = catalog => typeof catalog.manualModels === 'function' ? catalog.manualModels() : catalog.manualModels
export function installCatalogEndpoint(ctx, catalog, table) {
  const csrfToken = randomBytes(32).toString('hex')
  let replace = table.get('default')?.replace === true
  let tail = Promise.resolve()
  const metadataView = () => ({ metadata: catalog.knownModels().map(catalogMetadata), manualModels: manual(catalog).map(catalogMetadata), replace })
  const save = async (models, nextReplace) => {
    const previous = manual(catalog), previousReplace = replace
    catalog.setManual(models.map(catalogMetadata), { replace: nextReplace })
    try { await table.put('default', { models: manual(catalog).map(catalogMetadata), replace: nextReplace }); replace = nextReplace }
    catch (error) { catalog.setManual(previous, { replace: previousReplace }); throw error }
    return metadataView()
  }
  ctx.connection.fetch.register({ path: '/api/chatgpt-models', methods: ['GET', 'POST'], requestBody: 'buffered',
    async fetch(request) {
      const headers = { 'cache-control': 'no-store' }
      try {
        if (request.method === 'GET') {
          const query = new URL(request.url).searchParams, id = query.get('accountId')
          if (typeof id !== 'string' || !id || id.length > 160) fail('CATALOG_INVALID_ACCOUNT')
          const view = query.get('cached') === '1' ? catalog.cached(id) : await catalog.refresh(id, { force: true, signal: request.signal })
          return Response.json({ ...view, ...metadataView(), csrfToken }, { headers })
        }
        const site = request.headers.get('sec-fetch-site'), supplied = request.headers.get('x-chatgpt-models-csrf')
        if ((site !== null && site !== 'same-origin') || !/^[a-f0-9]{64}$/.test(supplied ?? '') || !timingSafeEqual(Buffer.from(supplied), Buffer.from(csrfToken))) fail('CATALOG_CSRF_INVALID')
        if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) fail('CATALOG_INVALID_REQUEST')
        if (Number(request.headers.get('content-length')) > 65536) fail('CATALOG_INVALID_REQUEST')
        const raw = await request.text()
        if (Buffer.byteLength(raw, 'utf8') > 65536) fail('CATALOG_INVALID_REQUEST')
        const body = JSON.parse(raw)
        if (!body || typeof body !== 'object' || Array.isArray(body)) fail('CATALOG_INVALID_REQUEST')
        const operation = async () => {
          if (body.action === 'reset-manual') return save([], false)
          if (body.action === 'manual') {
            if (!Array.isArray(body.models) || (body.replace !== undefined && typeof body.replace !== 'boolean')) fail('CATALOG_INVALID_REQUEST')
            return save(body.models, body.replace ?? replace)
          }
          if (body.action !== 'import') fail('CATALOG_INVALID_ACTION')
          if (typeof body.namespace !== 'string' || !body.namespace || !['replace', 'merge'].includes(body.mode)) fail('CATALOG_INVALID_REQUEST')
          const descriptors = await ctx.settings.describe({ redactSecrets: true })
          const provider = descriptors.find(item => item.ns === body.namespace)?.value?.providers?.['openai-codex']
          if (!provider || typeof provider !== 'object') fail('CATALOG_IMPORT_NOT_FOUND')
          const basis = new Map(catalog.knownModels().map(model => [model.id, catalogMetadata(model)]))
          const explicit = provider.models
          if (explicit !== undefined && !Array.isArray(explicit)) fail('CATALOG_INVALID_MODEL')
          const source = explicit ?? [...basis.values()]
          const imported = source.map(model => {
            const safe = catalogMetadata(model)
            return { ...(basis.get(safe.id) ?? {}), ...safe }
          })
          const overrides = provider.modelOverrides ?? {}
          if (typeof overrides !== 'object' || !overrides || Array.isArray(overrides)) fail('CATALOG_INVALID_MODEL')
          const resolved = imported.map(model => ({ ...model, ...(overrides[model.id] ? catalogMetadata(overrides[model.id]) : {}), id: model.id }))
          if (body.mode === 'merge') {
            const merged = new Map(manual(catalog).map(model => [model.id, model]))
            for (const model of resolved) merged.set(model.id, model)
            return save([...merged.values()], replace)
          }
          return save(resolved, explicit !== undefined)
        }
        const work = tail.then(operation); tail = work.catch(() => {})
        return Response.json(await work, { headers })
      } catch (error) {
        const code = typeof error?.code === 'string' && /^(?:CATALOG_[A-Z_0-9]+|ACCOUNT_NOT_FOUND|ACCOUNT_SIGNED_OUT|ACCOUNT_BUSY|LOGIN_IN_PROGRESS|PLUGIN_STOPPED)$/.test(error.code) ? error.code : 'CATALOG_REQUEST_FAILED'
        return Response.json({ error: code }, { status: code === 'CATALOG_CSRF_INVALID' ? 403 : code.includes('BUSY') || code === 'LOGIN_IN_PROGRESS' ? 409 : 400, headers })
      }
    },
  })
}

export async function installModelCatalog(ctx, accounts) {
  const [{ createModels }, { openaiCodexProvider }, { defineDomain, domainTable }, { z }] = await Promise.all([
    ctx.loader.import('@earendil-works/pi-ai'), ctx.loader.import('@earendil-works/pi-ai/providers/openai-codex'),
    ctx.loader.import('@deepseek-ai/dsh-storage-domain'), ctx.loader.import('zod'),
  ])
  const domain = await ctx.storageDomain.open(defineDomain({ name: 'chatgpt_catalog', version: 1, tables: {
    preferences: domainTable(z.object({ models: z.array(z.unknown()), replace: z.boolean().optional() })),
  } }))
  const table = domain.table('preferences')
  const active = new Set()
  const catalog = new ModelCatalog({ accounts, nativeModels: openaiCodexProvider().getModels(),
    authenticate: createCatalogAuthenticator(accounts, { createModels, openaiCodexProvider, active }),
    fetch: globalThis.fetch, now: Date.now, clientVersion: '0.166.0', onChanged: () => ctx.emit('llm/models-updated', 'chatgpt-session') })
  const invalidateKey = (key, settled = false) => {
    // Credential notifications expose only the installed key, never grant values.
    // Our own native refresh is already verified before publication; do not abort it.
    for (const [id] of accounts.accounts.entries()) {
      // Do not call assertAccount through key(): delete emits while removing is set.
      const address = id === 'legacy' ? 'llm-pi-ai/openai-codex' : `dsh-gpt-link/account-${id}`
      if (address === key && (settled || !active.has(id))) catalog.invalidate(id)
    }
  }
  ctx.on('credentials/record-updated', key => invalidateKey(key))
  ctx.on('authorization/settled', key => invalidateKey(key, true))
  const saved = table.get('default')
  if (saved) catalog.setManual(saved.models.map(catalogMetadata), { replace: saved.replace === true })
  ctx.effect(() => () => { catalog.dispose(); return domain.close() }, 'chatgpt: model catalog')
  installCatalogEndpoint(ctx, catalog, table)
  return catalog
}
