import { installMultiAccount } from './multi/host.js'
import { installChatGPTSearch } from './search/provider.js'
import { installAutomaticSearch } from './search/auto.js'

export const name = 'dsh-chatgpt-multi-account'
export const inject = ['connection', 'credentials', 'authorization', 'storageDomain', 'llm', 'agents', 'sessions', 'loader']

/** Standalone bundle: one authenticated API and one serialized login path. */
export async function apply(ctx, config = {}) {
  const accounts = await installMultiAccount(ctx, config)
  // Optional Host services: search never changes settings or enables itself on load.
  ctx.inject(['web', 'settings'], async child => {
    const chatgpt = await installChatGPTSearch(child, accounts)
    await installAutomaticSearch(child, chatgpt.provider)
  })
}
