import { randomBytes, timingSafeEqual } from 'node:crypto'
import { ChatDefaults } from './defaults.js'

const fail = code => { throw Object.assign(new Error(code), { code }) }

/** Capture creation identity synchronously; resumed/forked/child sessions are never defaults targets. */
export function isFreshOrdinaryChat(agent, source) {
  const session = agent?.session, header = session?.header
  return source === 'startup' && session?.firstLiveSeq === 0 && header?.isSeeded === false
    && header.origin === undefined && header.parentSession === undefined && (header.delegationDepth ?? 0) === 0
}

export async function applyChatDefaults(defaults, accounts, agent, signal) {
  const next = Object.freeze({ ...await defaults.snapshot({ signal }) })
  if (!next.enabled) return
  await accounts.exclusive(async () => {
    signal?.throwIfAborted()
    const id = agent.session.id
    // An explicitly assigned binding is not ours to replace.
    if (accounts.sessions.get(id)) return
    if (!next.available) fail('DEFAULT_ACCOUNT_UNAVAILABLE')
    accounts.assertAccount(next.accountId)
    if (!(await accounts.credentials.describeRecord(accounts.key(next.accountId))).configured) fail('DEFAULT_ACCOUNT_UNAVAILABLE')
    if (accounts.authorizing.has(next.accountId) || accounts.isAuthorizing(next.accountId)) fail('LOGIN_IN_PROGRESS')
    signal?.throwIfAborted()
    await accounts.sessions.put(id, { accountId: next.accountId })
    try {
      signal?.throwIfAborted()
      agent.model.select({ provider: 'chatgpt-session', model: next.model, reasoningEffort: next.reasoningEffort })
    } catch (error) {
      await accounts.sessions.delete(id)
      throw error
    }
  })
}

export function installDefaultsEndpoint(ctx, defaults) {
  const csrfToken = randomBytes(32).toString('hex')
  ctx.connection.fetch.register({ path: '/api/chatgpt-defaults', methods: ['GET', 'POST'], requestBody: 'buffered',
    async fetch(request) {
      const headers = { 'cache-control': 'no-store' }
      try {
        if (request.method === 'POST') {
          const supplied = request.headers.get('x-chatgpt-defaults-csrf'), site = request.headers.get('sec-fetch-site')
          if ((site !== null && site !== 'same-origin') || !/^[a-f0-9]{64}$/.test(supplied ?? '') || !timingSafeEqual(Buffer.from(supplied), Buffer.from(csrfToken))) fail('DEFAULT_CSRF_INVALID')
          if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) fail('DEFAULT_INVALID_REQUEST')
          const raw = await request.text()
          if (raw.length > 8192) fail('DEFAULT_INVALID_REQUEST')
          const body = JSON.parse(raw)
          if (!body || typeof body !== 'object' || Array.isArray(body)) fail('DEFAULT_INVALID_REQUEST')
          if (body.action === 'save') return Response.json(await defaults.save(body), { headers })
          if (body.action === 'disable') return Response.json(await defaults.disable(), { headers })
          if (body.action === 'auto') return Response.json(await defaults.enableAuto(body), { headers })
          fail('DEFAULT_INVALID_ACTION')
        }
        return Response.json({ ...await defaults.snapshot(), csrfToken }, { headers })
      } catch (error) {
        const code = typeof error?.code === 'string' && /^[A-Z_]{1,60}$/.test(error.code) ? error.code : 'DEFAULT_REQUEST_FAILED'
        return Response.json({ error: code }, { status: code === 'DEFAULT_CSRF_INVALID' ? 403 : 400, headers })
      }
    },
  })
}

export async function installChatDefaults(ctx, accounts, catalog) {
  const [{ defineDomain, domainTable }, { z }] = await Promise.all([
    ctx.loader.import('@deepseek-ai/dsh-storage-domain'), ctx.loader.import('zod'),
  ])
  // Separate metadata domain: chatgpt_accounts v1 and its durable bindings remain untouched.
  const domain = await ctx.storageDomain.open(defineDomain({ name: 'chatgpt_defaults', version: 1, tables: {
    preferences: domainTable(z.object({ enabled: z.boolean(), accountId: z.string().nullable(), model: z.string(), reasoningEffort: z.string(), selectionMode: z.enum(['auto-latest-sol', 'user-pinned', 'legacy-preserved']).optional() })),
  } }))
  const defaults = new ChatDefaults({ accounts, table: domain.table('preferences'), catalog })
  ctx.effect(() => () => domain.close(), 'chatgpt: new-chat defaults')
  ctx.on('agent/created', async ({ agent, source, signal }) => {
    if (!isFreshOrdinaryChat(agent, source)) return
    await applyChatDefaults(defaults, accounts, agent, signal)
  })
  installDefaultsEndpoint(ctx, defaults)
  return defaults
}
