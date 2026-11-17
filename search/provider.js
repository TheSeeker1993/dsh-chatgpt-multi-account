const PROVIDER = 'openai-codex'
const MODEL = 'gpt-6.1-sol'
const ENDPOINT = 'https://chatgpt.com/backend-api/codex/responses'
const SAFE_CODES = new Set(['PLUGIN_STOPPED', 'SESSION_ACCOUNT_REQUIRED', 'SESSION_NOT_FOUND', 'INVALID_SESSION', 'ACCOUNT_NOT_FOUND', 'ACCOUNT_SIGNED_OUT', 'ACCOUNT_BUSY', 'SESSION_BUSY', 'LOGIN_IN_PROGRESS', 'SESSION_CHOICE_PENDING', 'INVALID_QUERY', 'INVALID_MAX_RESULTS', 'MODEL_UNAVAILABLE', 'SEARCH_FAILED', 'SEARCH_NOT_EXECUTED', 'SEARCH_TIMEOUT', 'SEARCH_ABORTED', 'SEARCH_HTTP_400', 'SEARCH_HTTP_401', 'SEARCH_HTTP_403', 'SEARCH_HTTP_404', 'SEARCH_HTTP_408', 'SEARCH_HTTP_429', 'SEARCH_HTTP_500', 'SEARCH_HTTP_502', 'SEARCH_HTTP_503', 'SEARCH_HTTP_504', 'SEARCH_REQUEST_LIMIT', 'SEARCH_TARGET_BLOCKED', 'SEARCH_REDIRECT_BLOCKED'])
const failure = code => Object.assign(new Error(code), { code })
const sanitize = (error, WebError) => {
  const code = SAFE_CODES.has(error?.code) ? error.code : 'SEARCH_FAILED'
  return WebError ? new WebError(code, code) : failure(code)
}

/** Native dependencies and timer/fetch seams are injectable; tests never need OAuth or a network. */
export function createChatGPTSearchProvider(ctx, accounts, dependencies) {
  const { createModels, openaiCodexProvider, WebError, fetch: fetchImpl = globalThis.fetch,
    setTimeout: startTimer = globalThis.setTimeout, clearTimeout: stopTimer = globalThis.clearTimeout } = dependencies
  let loaded = true
  const active = new Set()
  const dispose = () => {
    loaded = false
    for (const controller of active) controller.abort(failure('PLUGIN_STOPPED'))
  }
  const provider = {
    id: 'chatgpt-session-search',
    title: 'ChatGPT (session account)',
    description: {
      en: 'Live hosted search using actual ChatGPT subscription allowance, not paid API credits. Sends only the query. Uses the original account on the native ChatGPT route; otherwise requires this agent session’s explicit account binding.',
      ru: 'Живой поиск расходует реальную подписку ChatGPT, а не платный API. Передаётся только запрос. Встроенный маршрут ChatGPT использует исходный аккаунт; иначе нужна явная привязка аккаунта к сессии агента.',
      zh: '实时搜索消耗实际 ChatGPT 订阅额度，而非付费 API 额度。仅发送搜索词。原生 ChatGPT 路由使用原始账户；其他路由必须明确绑定当前代理会话的账户。',
    },
    available: () => loaded,
    // Tool assembly may have no initiating agent. Binding is checked only when actually invoked.
    ready: async () => loaded,
    async search(request, signal) {
      // Capture exactly once, synchronously, before any asynchronous work. Never accept a caller sessionId.
      let lease, timer, abortListener, settled = false, credentialsClosed = false
      const pendingCredentials = new Set()
      const controller = new AbortController()
      const abort = () => controller.abort(failure('SEARCH_ABORTED'))
      try {
        const initiator = ctx.agents.currentInitiator()
        const sessionId = initiator?.session?.id
        const route = initiator?.session?.requestContext?.()?.provider
        if (!loaded) throw failure('PLUGIN_STOPPED')
        if (typeof sessionId !== 'string' || !sessionId) throw failure('SESSION_ACCOUNT_REQUIRED')
        if (typeof request?.query !== 'string' || !request.query.trim() || request.query.length > 4000) throw failure('INVALID_QUERY')
        if (request.maxResults !== undefined && (!Number.isInteger(request.maxResults) || request.maxResults < 0 || request.maxResults > 50)) throw failure('INVALID_MAX_RESULTS')
        const limit = request.maxResults ?? 50
        if (signal?.aborted) throw failure('SEARCH_ABORTED')
        active.add(controller)
        signal?.addEventListener('abort', abort, { once: true })
        timer = startTimer(() => controller.abort(failure('SEARCH_TIMEOUT')), 60000)
        const aborted = new Promise((_, reject) => {
          abortListener = () => reject(controller.signal.reason)
          controller.signal.addEventListener('abort', abortListener, { once: true })
        })
        const work = async () => {
          const acquired = await (route === PROVIDER
            ? accounts.acquireAccount(sessionId, 'legacy')
            : accounts.acquireSession(sessionId))
          // Acquisition may finish after cancellation. Never orphan that reservation.
          if (settled || controller.signal.aborted) { acquired.release(); throw controller.signal.reason }
          lease = acquired
          const store = accounts.credentialStore(lease.accountId)
          const credentials = Object.fromEntries(['read', 'list', 'modify', 'delete'].map(method => [method, (...args) => {
            // Native Models races auth against abort, but an OAuth refresh already
            // inside modify must still persist. Track the store work independently.
            controller.signal.throwIfAborted()
            if (credentialsClosed) throw failure('SEARCH_ABORTED')
            let pending
            try { pending = Promise.resolve(store[method](...args)) } catch (error) { pending = Promise.reject(error) }
            pendingCredentials.add(pending)
            void pending.then(() => pendingCredentials.delete(pending), () => pendingCredentials.delete(pending))
            return pending
          }]))
          const models = createModels({ credentials,
            authContext: { env: async () => undefined, fileExists: async () => false } })
          models.setProvider(openaiCodexProvider())
          const model = models.getModel(PROVIDER, MODEL)
          if (!model) throw failure('MODEL_UNAVAILABLE')
          let completedSearch = false, answer = '', requests = 0, guardError, httpError, streamError = false
          const sources = [], seen = new Set()
          let dropped = false
          const addSource = source => {
            if (typeof source?.url !== 'string' || source.url.length > 4096) return
            let url
            try { url = new URL(source.url) } catch { return }
            if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return
            const key = url.href
            if (key.length > 4096 || seen.has(key)) return
            if (sources.length >= limit) { dropped = true; return }
            seen.add(key)
            sources.push({ url: key, ...(typeof source.title === 'string' ? { title: source.title.slice(0, 1000) } : {}) })
          }
          const item = output => {
            if (output?.type === 'web_search_call' && output.status === 'completed') {
              completedSearch = true
              for (const source of output.action?.sources ?? []) addSource(source)
            }
            for (const content of output?.content ?? []) {
              for (const annotation of content.annotations ?? []) if (annotation.type === 'url_citation') addSource(annotation)
            }
          }
          const stream = models.stream(model, {
            systemPrompt: 'Perform live web search for the user query. Give a concise answer with citations. Use only hosted web search; do not call other tools.',
            messages: [{ role: 'user', content: request.query, timestamp: Date.now() }],
          }, {
            signal: controller.signal, transport: 'sse', maxRetries: 0, timeoutMs: 60000,
            reasoningEffort: 'low', cacheRetention: 'none',
            onPayload(body) {
              const { previous_response_id, ...payload } = body
              return { ...payload, store: false, tools: [{ type: 'web_search', external_web_access: true }],
                tool_choice: { type: 'web_search' }, include: ['web_search_call.action.sources'] }
            },
            async fetch(input, init) {
              controller.signal.throwIfAborted()
              const target = typeof input === 'string' || input instanceof URL ? String(input) : input?.url
              const method = init?.method ?? (input instanceof Request ? input.method : 'GET')
              if (target !== ENDPOINT || method.toUpperCase() !== 'POST') {
                guardError = failure('SEARCH_TARGET_BLOCKED'); throw guardError
              }
              if (++requests > 1) { guardError = failure('SEARCH_REQUEST_LIMIT'); throw guardError }
              const response = await fetchImpl(input, { ...init, signal: controller.signal, redirect: 'error', credentials: 'omit' })
              if (response.redirected || (response.status >= 300 && response.status < 400)) {
                guardError = failure('SEARCH_REDIRECT_BLOCKED'); throw guardError
              }
              if (!response.ok) {
                const code = `SEARCH_HTTP_${response.status}`
                httpError = failure(SAFE_CODES.has(code) ? code : 'SEARCH_FAILED')
              }
              return response
            },
            onProviderStreamEvent(event) {
              if (event.type === 'response.web_search_call.completed' || event.type === 'web_search_call.completed') completedSearch = true
              if (event.type === 'response.output_item.done') item(event.item)
              if (event.type === 'response.output_text.annotation.added' && event.annotation?.type === 'url_citation') addSource(event.annotation)
              if (event.type === 'response.completed') for (const output of event.response?.output ?? []) item(output)
            },
          })
          try {
            for await (const event of stream) {
              controller.signal.throwIfAborted()
              if (event.type === 'text_delta' && typeof event.delta === 'string') answer = (answer + event.delta).slice(0, 12000)
              if (event.type === 'done') {
                if (['error', 'aborted'].includes(event.message?.stopReason)) streamError = true
                if (!answer) answer = (event.message?.content ?? []).filter(x => x.type === 'text').map(x => x.text).join('\n').slice(0, 12000)
              }
              if (event.type === 'error') streamError = true
            }
          } catch (error) { throw guardError ?? httpError ?? error }
          controller.signal.throwIfAborted()
          if (guardError || httpError) throw guardError ?? httpError
          if (streamError) throw failure('SEARCH_FAILED')
          if (!completedSearch) throw failure('SEARCH_NOT_EXECUTED')
          return { content: answer, sources, truncated: dropped }
        }
        const workPromise = work()
        // Cancellation returns promptly, but a native refresh/iterator may still be unwinding.
        // Keep the shared account reserved until that work actually quiesces.
        const releaseWhenIdle = async () => {
          credentialsClosed = true
          while (pendingCredentials.size) await Promise.allSettled([...pendingCredentials])
          lease?.release()
        }
        void workPromise.then(releaseWhenIdle, releaseWhenIdle).catch(() => {})
        return await Promise.race([workPromise, aborted])
      } catch (error) {
        throw sanitize(controller.signal.aborted ? controller.signal.reason : error, WebError)
      } finally {
        settled = true
        if (timer !== undefined) stopTimer(timer)
        signal?.removeEventListener('abort', abort)
        if (abortListener) controller.signal.removeEventListener('abort', abortListener)
        active.delete(controller)
        controller.abort(failure('SEARCH_ABORTED'))
      }
    },
  }
  return { provider, dispose }
}

export async function installChatGPTSearch(ctx, accounts) {
  const [{ createModels }, { openaiCodexProvider }, { WebError }] = await Promise.all([
    ctx.loader.import('@earendil-works/pi-ai'),
    ctx.loader.import('@earendil-works/pi-ai/providers/openai-codex'),
    ctx.loader.import('@deepseek-ai/dsh-web'),
  ])
  const installation = createChatGPTSearchProvider(ctx, accounts, { createModels, openaiCodexProvider, WebError })
  ctx.effect(() => installation.dispose, 'chatgpt-session-search: abort pending searches')
  ctx.web.registerSearchProvider(installation.provider)
  return installation
}
