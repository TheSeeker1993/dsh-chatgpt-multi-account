import { Accounts, AccountError } from './accounts.js'
import { createAccountServices } from './auth.js'
import { installRouting } from './routing.js'

const HEADERS = { 'cache-control': 'no-store' }
export async function installMultiAccount(ctx, config) {
  const { defineDomain, domainTable } = await ctx.loader.import('@deepseek-ai/dsh-storage-domain')
  const { z } = await ctx.loader.import('zod')
  const spec = defineDomain({ name: 'chatgpt_accounts', version: 1, tables: {
    accounts: domainTable(z.object({ label: z.string().min(1).max(80), createdAt: z.number().finite() })),
    sessions: domainTable(z.object({ accountId: z.string().min(1) })),
  } })
  const domain = await ctx.storageDomain.open(spec)
  const accounts = new Accounts({ domain, credentials: ctx.credentials,
    isSessionBusy: sessionId => ctx.agents.get(sessionId)?.status === 'running',
    isAuthorizing: id => ctx.authorization.describe(accounts.key(id))?.inFlight === true,
    parentSession: sessionId => {
      const header = ctx.sessions.get(sessionId)?.header
      return header?.origin === 'subagent' ? header.parentSession : undefined
    } })
  let services
  ctx.effect(() => () => { services?.dispose(); return accounts.close() }, 'dsh-gpt-link: accounts')
  await accounts.initialize()
  services = await createAccountServices(ctx, accounts, config.cacheTtlMs)
  await installRouting(ctx, accounts)
  function register(path, handle) {
    ctx.connection.fetch.register({ path, methods: ['GET', 'POST'], requestBody: 'buffered',
      async fetch(request) {
        try {
          if (request.method === 'POST') {
            const origin = request.headers.get('origin')
            if (origin !== null && origin !== new URL(request.url).origin) {
              return Response.json({ error: 'FORBIDDEN_ORIGIN' }, { status: 403, headers: HEADERS })
            }
          }
          const url = new URL(request.url)
          const body = request.method === 'POST' ? await request.json() : {}
          const result = await handle(request.method, url.searchParams, body)
          return Response.json(result, { headers: HEADERS })
        } catch (error) {
          const code = error instanceof AccountError ? error.code : typeof error?.code === 'string' && /^[A-Z_]{1,60}$/.test(error.code) ? error.code : 'REQUEST_FAILED'
          // Raw errors can include OAuth secrets; only bounded codes leave the Host.
          return Response.json({ error: code }, { status: code.includes('BUSY') || code === 'LOGIN_IN_PROGRESS' ? 409 : 400, headers: HEADERS })
        }
      },
    })
  }
  register('/api/chatgpt-accounts', async (method, query, body) => {
    const sessionId = body.sessionId ?? query.get('sessionId') ?? undefined
    let createdAccountId
    if (method === 'POST') {
      if (body.action === 'create') createdAccountId = await accounts.create(body.label)
      else if (body.action === 'rename') await accounts.rename(body.accountId, body.label)
      else if (body.action === 'select') await accounts.select(sessionId, body.accountId)
      else if (body.action === 'remove') await services.remove(body.accountId)
      else throw new AccountError('INVALID_ACTION')
    }
    return { ...await accounts.snapshot(sessionId), ...(createdAccountId ? { createdAccountId } : {}) }
  })
  register('/api/chatgpt-auth', async (method, query, body) => {
    const id = body.accountId ?? query.get('accountId')
    const { login } = services.entry(id)
    if (method === 'GET') return login.status()
    if (body.action === 'login') return services.start(id, body.method)
    if (body.action === 'cancel') return login.cancel()
    if (body.action === 'answer' && Number.isSafeInteger(body.id) && typeof body.value === 'string') return login.answer(body.id, body.value)
    throw new AccountError('INVALID_ACTION')
  })
  register('/api/chatgpt-quota', async (method, query, body) => services.entry(body.accountId ?? query.get('accountId')).quota.read(method === 'POST'))
  return accounts
}
