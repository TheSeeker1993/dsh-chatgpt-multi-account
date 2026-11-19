import { randomBytes, timingSafeEqual } from 'node:crypto'
import { Resets, ResetError } from './resets.js'

/** User-only HTTP action surface. Intentionally no agent-tool registration. */
export function installResetEndpoint(ctx, accounts, { onConsumed = () => {} } = {}) {
  const resets = new Resets({ accounts })
  const csrfToken = randomBytes(32).toString('hex')
  ctx.effect(() => () => resets.close(), 'chatgpt: reset confirmations')
  ctx.connection.fetch.register({ path: '/api/chatgpt-resets', methods: ['GET', 'POST'], requestBody: 'buffered',
    async fetch(request) {
      const headers = { 'cache-control': 'no-store' }
      try {
        const url = new URL(request.url)
        let body = {}
        if (request.method === 'POST') {
          // DSH may tunnel fetch over its authenticated connection, rebuilding
          // request.url and omitting browser-only Origin/Fetch Metadata headers.
          // A secret from authenticated same-origin GET + custom header works
          // for HTTP and the bridge without trusting a synthetic request origin.
          const site = request.headers.get('sec-fetch-site')
          const supplied = request.headers.get('x-chatgpt-reset-csrf')
          if ((site !== null && site !== 'same-origin') || typeof supplied !== 'string' || !/^[a-f0-9]{64}$/.test(supplied) || !timingSafeEqual(Buffer.from(supplied), Buffer.from(csrfToken))) {
            return Response.json({ error: 'RESET_CSRF_INVALID' }, { status: 403, headers })
          }
          if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) throw new ResetError('RESET_INVALID_REQUEST')
          const raw = await request.text()
          if (raw.length > 8192) throw new ResetError('RESET_INVALID_REQUEST')
          body = JSON.parse(raw)
          if (!body || typeof body !== 'object' || Array.isArray(body)) throw new ResetError('RESET_INVALID_REQUEST')
        }
        const id = request.method === 'GET' ? url.searchParams.get('accountId') : body.accountId
        if (typeof id !== 'string' || id.length > 160) throw new ResetError('RESET_INVALID_ACCOUNT')
        let result
        if (request.method === 'GET' || body.action === 'list') result = await resets.list(id, request.method === 'POST')
        else if (body.action === 'begin') result = await resets.begin(id, body.creditId)
        else if (body.action === 'advance') result = await resets.advance(id, body.nonce)
        else if (body.action === 'cancel') result = await resets.abort(id, body.nonce)
        else if (body.action === 'consume') {
          result = await resets.consume(id, body.nonce)
          // Even an unknown response may have changed upstream quota; drop local cache.
          await onConsumed(id, result)
        } else throw new ResetError('RESET_INVALID_ACTION')
        return Response.json(request.method === 'GET' ? { ...result, csrfToken } : result, { headers })
      } catch (error) {
        const code = typeof error?.code === 'string' && /^[A-Z_]{1,60}$/.test(error.code) ? error.code : 'RESET_REQUEST_FAILED'
        return Response.json({ error: code }, { status: code.includes('BUSY') || code === 'LOGIN_IN_PROGRESS' ? 409 : 400, headers })
      }
    },
  })
  return resets
}
