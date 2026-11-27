import { CodexLogin } from '../lib/auth/flow.js'
import { createAccountQuotaReader } from './quota.js'

/** Each login owns its native pi-ai collection and credential address. */
export async function createAccountServices(ctx, accounts, cacheTtlMs) {
  const { createModels } = await ctx.loader.import('@earendil-works/pi-ai')
  const { openaiCodexProvider } = await ctx.loader.import('@earendil-works/pi-ai/providers/openai-codex')
  const entries = new Map()
  ctx.on('authorization/settled', key => {
    for (const [id, item] of entries) if (item.key === key) accounts.authorizing.delete(id)
  })
  const ambient = { env: async () => undefined, fileExists: async () => false }
  function entry(id) {
    accounts.assertAccount(id)
    if (entries.has(id)) return entries.get(id)
    const key = accounts.key(id)
    const recordStore = accounts.recordStore(id)
    let disposeFlow = () => {}
    if (id !== 'legacy') {
      disposeFlow = ctx.authorization.registerFlow({
        key, label: 'ChatGPT', methods: [{ id: 'oauth', label: 'Sign in with ChatGPT' }],
        async run(session) {
          const models = createModels({ credentials: accounts.credentialStore(id), authContext: ambient })
          models.setProvider(openaiCodexProvider())
          await models.login('openai-codex', 'oauth', {
            signal: session.signal,
            notify(event) {
              if (event.type === 'auth_url') session.notify({ message: event.instructions ?? 'Continue in your browser.', url: event.url })
              else if (event.type === 'device_code') session.notify({ message: 'Enter this code to continue.', url: event.verificationUri, code: event.userCode })
              else session.notify({ message: event.message ?? 'Signing in…', ...(event.links?.[0]?.url ? { url: event.links[0].url } : {}) })
            },
            prompt(prompt) {
              return session.prompt({ kind: prompt.type === 'select' ? 'select' : prompt.type === 'secret' ? 'secret' : 'text',
                message: prompt.message, ...(prompt.placeholder ? { placeholder: prompt.placeholder } : {}),
                ...(prompt.options ? { options: prompt.options } : {}), ...(prompt.signal ? { signal: prompt.signal } : {}) })
            },
          })
        },
      })
    }
    const authorization = {
      describe: () => ctx.authorization.describe(key),
      cancel: () => ctx.authorization.cancel(key),
      begin: request => ctx.authorization.begin({ ...request, key }),
    }
    const login = new CodexLogin({ authorization, credentials: recordStore, logger: ctx.logger })
    const quota = createAccountQuotaReader({ accounts, id, createModels, openaiCodexProvider, cacheTtlMs })
    const value = { key, login, quota, dispose() { login.dispose(); quota.dispose(); disposeFlow(); accounts.authorizing.delete(id) } }
    entries.set(id, value)
    return value
  }
  return {
    entry,
    async start(id, method) {
      return accounts.exclusive(async () => {
        accounts.assertIdle(id)
        if (id !== 'legacy' && ctx.authorization.describe('llm-pi-ai/openai-codex')?.inFlight) {
          const error = new Error('LOGIN_IN_PROGRESS'); error.code = 'LOGIN_IN_PROGRESS'; throw error
        }
        // Native loopback OAuth uses one callback port. Do not overlap attempts.
        for (const [otherId, item] of entries) {
          if (otherId !== id && (await item.login.status()).status === 'pending') {
            const error = new Error('LOGIN_IN_PROGRESS'); error.code = 'LOGIN_IN_PROGRESS'; throw error
          }
        }
        accounts.authorizing.add(id)
        try {
          entry(id).quota.forget()
          const view = await entry(id).login.start(method)
          if (view.status !== 'pending') accounts.authorizing.delete(id)
          return view
        } catch (error) { accounts.authorizing.delete(id); throw error }
      })
    },
    async remove(id) {
      await accounts.remove(id, async () => { entries.get(id)?.dispose(); entries.delete(id) })
    },
    dispose() { for (const item of entries.values()) item.dispose(); entries.clear() },
  }
}
