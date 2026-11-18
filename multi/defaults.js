import { AccountError } from './accounts.js'
import { MODEL_IDS } from './routing.js'

const MODEL = 'gpt-6.1-sol'
const REASONING = 'low'
const LEVELS = new Set(['low', 'medium', 'high', 'xhigh'])
const empty = () => ({ enabled: false, accountId: null, model: MODEL, reasoningEffort: REASONING })

/** Durable metadata for future ordinary chats only. Shares the Accounts serial gate;
 * never authorizes, reads grants, changes bindings, or reserves a session lease. */
export class ChatDefaults {
  constructor({ accounts, table }) {
    this.accounts = accounts
    this.table = table
  }
  async configured(id) {
    if (typeof id !== 'string' || !this.accounts.accounts.get(id) || this.accounts.removing.has(id)) return false
    return Boolean((await this.accounts.credentials.describeRecord(this.accounts.key(id))).configured)
  }
  async view(record) {
    const value = record ?? empty()
    return {
      enabled: value.enabled === true,
      accountId: value.accountId ?? null,
      model: value.model,
      reasoningEffort: value.reasoningEffort,
      available: await this.configured(value.accountId),
    }
  }
  snapshot() {
    return this.accounts.exclusive(async () => {
      let record = this.table.get('default')
      if (record === undefined) {
        // Stable sort preserves insertion order when timestamps tie.
        const entries = [...this.accounts.accounts.entries()].sort((a, b) => a[1].createdAt - b[1].createdAt)
        for (const [accountId] of entries) {
          if (!await this.configured(accountId)) continue
          record = { enabled: true, accountId, model: MODEL, reasoningEffort: REASONING }
          await this.table.put('default', record)
          break
        }
      }
      return this.view(record)
    })
  }
  save({ accountId, model, reasoningEffort } = {}) {
    return this.accounts.exclusive(async () => {
      if (!MODEL_IDS.includes(model)) throw new AccountError('INVALID_MODEL')
      if (!LEVELS.has(reasoningEffort)) throw new AccountError('INVALID_REASONING_EFFORT')
      this.accounts.assertAccount(accountId)
      if (!await this.configured(accountId)) throw new AccountError('ACCOUNT_SIGNED_OUT')
      const record = { enabled: true, accountId, model, reasoningEffort }
      await this.table.put('default', record)
      return this.view(record)
    })
  }
  disable() {
    return this.accounts.exclusive(async () => {
      const record = { ...(this.table.get('default') ?? empty()), enabled: false }
      await this.table.put('default', record)
      return this.view(record)
    })
  }
}
