import { AsyncLocalStorage } from 'node:async_hooks'

export const AUTOMATIC_SEARCH_PROVIDER_ID = 'model-aware-search'
const GPT_ROUTES = new Set(['chatgpt-session', 'openai-codex'])
const API = { namespace: 'web-deepseek-api', package: '@deepseek-ai/dsh-web-deepseek-api', id: 'deepseek-search-api',
  fields: ['count', 'searchRequestsPerSecond', 'sendOriginalQuestion', 'searchBilling', 'fetchBilling', 'searchBaseURL', 'searchApiKeyEnv', 'fetchBaseURL', 'fetchApiKeyEnv'] }
const LEGACY = { namespace: 'web-search-deepseek', package: '@deepseek-ai/dsh-web-search-deepseek', id: 'deepseek-official',
  fields: ['apiKey', 'apiKeyEnv', 'baseURL', 'model', 'apiVersion', 'maxTokens', 'maxUses'] }
const section = (ctx, namespace) => ctx.settings.describe().find(row => row.ns === namespace)?.value
const initiatorOf = ctx => (ctx.get?.('agents') ?? ctx.agents)?.currentInitiator()
const failure = (message, code, WebError) => WebError
  ? new WebError(message, code)
  : Object.assign(new Error(message), { code })

/**
 * Reuse the installed plugin's PUBLIC apply entry point with a local registration
 * sink. This is not the global web service or a second mounted plugin: no profile,
 * global config, private registry, or credentials are copied or modified. Native
 * billing, auth, endpoint resolution, readiness, and throttling remain native.
 */
export function createNativeDeepSeekDelegate(ctx, native, definition, WebError) {
  const operations = new AsyncLocalStorage()
  const active = new Set()
  let loaded = true
  const safeCodes = new Set(['WEB_PROVIDER_UNAVAILABLE', 'WEB_AUTH_REQUIRED', 'WEB_RATE_LIMITED', 'WEB_TIMEOUT', 'WEB_ABORTED', 'WEB_PROVIDER_ERROR'])
  const sanitize = error => failure('Native DeepSeek search failed.', safeCodes.has(error?.code) ? error.code : 'WEB_PROVIDER_ERROR', WebError)
  const guarded = operation => {
    try {
      const value = operation()
      return value?.then ? Promise.resolve(value).catch(error => { throw sanitize(error) }) : value
    } catch (error) { throw sanitize(error) }
  }
  let provider
  const sink = {
    registerSearchProvider(value) {
      if (value.id !== definition.id || provider) throw new Error('Unexpected native DeepSeek registration')
      provider = value
      return () => {}
    },
    // web-deepseek-api also registers fetch; auto changes search only.
    registerFetchProvider: () => () => {},
  }
  const facade = {
    web: sink,
    get(name) {
      if (name === 'agents') return { currentInitiator: () => operations.getStore()?.initiator }
      return ctx.get(name)
    },
  }
  const config = Object.fromEntries(definition.fields.map(key => [key, {
    get: () => operations.getStore()?.settings[key],
  }]))
  native.apply(facade, config)
  if (!provider) throw new Error('Native DeepSeek search registration missing')
  const run = (initiator, operation) => {
    // The host-only settings plane returns resolved values, including literal keys.
    // Keep only this namespace in the operation closure; never log/return its values.
    const settings = section(ctx, definition.namespace)
    if (!settings) throw failure('DeepSeek search settings are unavailable.', 'WEB_PROVIDER_UNAVAILABLE', WebError)
    return operations.run({ initiator, settings }, operation)
  }
  return {
    available: initiator => loaded && guarded(() => run(initiator, () => provider.available())),
    ready: route => loaded && guarded(() => run(undefined, () => provider.ready?.(route) ?? true)),
    async search(request, signal, initiator) {
      if (!loaded) throw failure('Native DeepSeek search is unavailable.', 'WEB_PROVIDER_UNAVAILABLE', WebError)
      const controller = new AbortController()
      const abort = () => controller.abort(failure('Native DeepSeek search was aborted.', 'WEB_ABORTED', WebError))
      active.add(controller)
      signal?.addEventListener('abort', abort, { once: true })
      if (signal?.aborted) abort()
      try {
        controller.signal.throwIfAborted()
        const value = await guarded(() => run(initiator, () => provider.search(request, controller.signal)))
        controller.signal.throwIfAborted()
        return value
      } catch (error) {
        throw sanitize(controller.signal.aborted ? { code: 'WEB_ABORTED' } : error)
      } finally {
        signal?.removeEventListener('abort', abort)
        active.delete(controller)
      }
    },
    dispose() {
      loaded = false
      for (const controller of active) controller.abort(failure('Native DeepSeek search was aborted.', 'WEB_ABORTED', WebError))
    },
  }
}

/** DI seam: delegates are fixed per installation; failures never change backend. */
export function createAutomaticSearchProvider(ctx, chatgptProvider, deepseekProvider, { WebError } = {}) {
  let loaded = true
  const unavailable = () => failure('The model-selected search provider is unavailable.', 'WEB_PROVIDER_UNAVAILABLE', WebError)
  const choose = route => GPT_ROUTES.has(route) ? chatgptProvider : deepseekProvider
  const provider = {
    id: AUTOMATIC_SEARCH_PROVIDER_ID,
    title: 'Auto: ChatGPT / DeepSeek',
    description: {
      en: 'Uses the actual model request route: ChatGPT search for GPT routes; native DeepSeek search for all others, respecting existing DeepSeek billing and authentication settings. No cross-provider fallback.',
      ru: 'Поиск по фактическому маршруту модели: ChatGPT для GPT, штатный DeepSeek для остальных моделей с текущими настройками оплаты и авторизации. Без переключения при ошибке.',
      zh: '按实际模型请求路由选择搜索：GPT 使用 ChatGPT，其他模型使用原生 DeepSeek，并保留现有计费及认证设置。失败时不会切换服务。',
      ja: '実際のモデルリクエスト経路に応じて検索を選択します。GPT は ChatGPT、その他は既存の課金・認証設定を使って DeepSeek 標準検索を利用します。失敗しても別のサービスに切り替えません。',
      es: 'Según la ruta real de la solicitud del modelo: búsqueda de ChatGPT para GPT y búsqueda nativa de DeepSeek para el resto, con la configuración actual de facturación y autenticación de DeepSeek. Si falla, no cambia de proveedor.',
      fr: 'Suit la route réelle de la requête du modèle : recherche ChatGPT pour GPT et recherche native DeepSeek pour les autres, avec les réglages actuels de facturation et d’authentification de DeepSeek. Aucun changement de fournisseur en cas d’échec.',
      de: 'Folgt der tatsächlichen Route der Modellanfrage: GPT nutzt die ChatGPT-Suche, alle anderen Modelle die native DeepSeek-Suche mit den vorhandenen Abrechnungs- und Anmeldeeinstellungen. Bei einem Fehler wird der Anbieter nicht gewechselt.',
      pt: 'Segue a rota real da solicitação do modelo: busca do ChatGPT para GPT e busca nativa do DeepSeek para os demais, mantendo as configurações de cobrança e autenticação do DeepSeek. Não troca de provedor em caso de falha.',
    },
    available: () => loaded,
    async ready(route) {
      if (!loaded) return false
      const selected = choose(route)
      if (!selected || !selected.available()) return false
      return await (selected.ready?.(route) ?? true)
    },
    async search(request, signal) {
      // Capture the actual request route before ANY async work. Query/sessionId
      // fields and the model-picker's current selection are never routing inputs.
      const initiator = initiatorOf(ctx)
      if (!loaded) throw unavailable()
      if (!initiator?.session) throw failure('Automatic search requires an initiating agent session.', 'SEARCH_INITIATOR_REQUIRED', WebError)
      const route = initiator.session.requestContext?.()?.provider
      if (typeof route !== 'string' || !route) throw failure('Automatic search requires the actual model request route.', 'SEARCH_ROUTE_REQUIRED', WebError)
      const selected = choose(route)
      if (!selected || !selected.available(initiator)) throw unavailable()
      return await selected.search(request, signal, initiator)
    },
  }
  return { provider, dispose: () => { loaded = false } }
}

/**
 * API search is the native default (and owns the current searchBilling settings).
 * Retain the old LLM-search implementation only in profiles without that section.
 * Dependencies are injectable so contract tests never use credentials or network.
 */
export async function installAutomaticSearch(ctx, chatgptProvider, dependencies = {}) {
  const { WebError } = dependencies.web ?? await ctx.loader.import('@deepseek-ai/dsh-web')
  const definition = section(ctx, API.namespace) ? API : section(ctx, LEGACY.namespace) ? LEGACY : undefined
  const native = definition ? dependencies.native ?? await ctx.loader.import(definition.package) : undefined
  const deepseek = native ? createNativeDeepSeekDelegate(ctx, native, definition, WebError) : undefined
  const installation = createAutomaticSearchProvider(ctx, chatgptProvider, deepseek, { WebError })
  const stopRouting = installation.dispose
  installation.dispose = () => { stopRouting(); deepseek?.dispose() }
  ctx.effect(() => installation.dispose, 'model-aware-search: stop automatic routing')
  ctx.web.registerSearchProvider(installation.provider)
  return installation
}
