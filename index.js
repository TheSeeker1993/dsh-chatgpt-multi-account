import { installMultiAccount } from './multi/host.js'

export const name = 'dsh-chatgpt-multi-account'
export const inject = ['connection', 'credentials', 'authorization', 'storageDomain', 'llm', 'agents', 'sessions', 'loader']

/** Standalone bundle: one authenticated API and one serialized login path. */
export async function apply(ctx, config = {}) {
  await installMultiAccount(ctx, config)
}
