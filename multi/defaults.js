import { AccountError } from './accounts.js'
import { reasoningForModel } from './catalog.js'

const AUTO = 'auto-latest-sol'
const empty = () => ({ enabled: false, accountId: null, model: '', reasoningEffort: '', selectionMode: 'user-pinned' })
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const effortSupported = (definition, effort) => Boolean(definition) && reasoningForModel(definition).efforts.some(entry => entry.id === effort)
const latestSol = models => models.filter(model => model.compatible === true && /^gpt-(\d+)(?:\.(\d+))?-sol$/.test(model.id)).sort((a, b) => {
  const version = model => /^gpt-(\d+)(?:\.(\d+))?-sol$/.exec(model.id).slice(1).map(x => BigInt(x ?? 0))
  const av = version(a), bv = version(b)
  return av[0] === bv[0] ? (av[1] === bv[1] ? 0 : av[1] > bv[1] ? -1 : 1) : av[0] > bv[0] ? -1 : 1
})[0]

/** Metadata for future ordinary chats. Discovery MUST run outside the Accounts gate. */
export class ChatDefaults {
  constructor({ accounts, table, catalog }) {
    Object.assign(this, { accounts, table, catalog })
  }
  async configured(id) {
    if (typeof id !== 'string' || !this.accounts.accounts.get(id) || this.accounts.removing.has(id)) return false
    return Boolean((await this.accounts.credentials.describeRecord(this.accounts.key(id))).configured)
  }
  async capture() {
    return this.accounts.exclusive(async () => {
      let record = this.table.get('default')
      if (record && !record.selectionMode) {
        record = { ...record, selectionMode: 'legacy-preserved' }
        await this.table.put('default', record)
      }
      if (record === undefined) {
        const entries = [...this.accounts.accounts.entries()].sort((a, b) => a[1].createdAt - b[1].createdAt)
        for (const [accountId] of entries) {
          if (await this.configured(accountId)) return { before: undefined, value: { enabled: true, accountId, model: '', reasoningEffort: '', selectionMode: AUTO } }
        }
      }
      return { before: record, value: record ?? empty() }
    })
  }
  async validate(value, signal) {
    if (!await this.configured(value.accountId)) return { available: false, status: 'account-unavailable' }
    if (!this.catalog) return { available: false, status: 'catalog-unavailable' }
    try {
      const definition = await this.catalog.available(value.accountId, value.model, { signal })
      if (!definition || !effortSupported(definition, value.reasoningEffort)) return { available: false, status: 'model-unavailable' }
      return { available: true, status: 'available' }
    } catch (error) {
      signal?.throwIfAborted()
      return { available: false, status: 'model-unavailable' }
    }
  }
  async snapshot({ signal } = {}) {
    const captured = await this.capture()
    let value = { ...captured.value }, state
    if (value.enabled && value.selectionMode === AUTO) {
      try {
        const result = await this.catalog?.refresh(value.accountId, { force: true, signal })
        const candidate = result?.freshness === 'fresh' ? latestSol(result.models) : undefined
        if (candidate) {
          const definition = await this.catalog.available(value.accountId, candidate.id, { signal })
          const effort = candidate.reasoning?.defaultEffort ?? candidate.defaultReasoningEffort ?? reasoningForModel(definition).defaultEffort
          if (effortSupported(definition, effort)) {
            value = { ...value, model: candidate.id, reasoningEffort: effort }
            state = { available: true, status: 'available', freshness: result.freshness, checkedAt: result.checkedAt }
          }
        }
        state ??= { available: false, status: 'no-fresh-sol', freshness: result?.freshness ?? 'unavailable', checkedAt: result?.checkedAt }
      } catch (error) {
        signal?.throwIfAborted()
        state = { available: false, status: 'no-fresh-sol' }
      }
    } else state = await this.validate(value, signal)
    const committed = await this.accounts.exclusive(async () => {
      signal?.throwIfAborted()
      if (!same(this.table.get('default'), captured.before)) return false
      if (state.available && !await this.configured(value.accountId)) state = { available: false, status: 'account-unavailable' }
      if (state.available && !same(value, captured.before)) await this.table.put('default', value)
      return true
    })
    // A concurrent user save/disable always wins; never overwrite it with discovery.
    if (!committed) return this.snapshot({ signal })
    return { ...value, ...state }
  }
  async save({ accountId, model, reasoningEffort, signal } = {}) {
    if (typeof model !== 'string' || !model) throw new AccountError('INVALID_MODEL')
    this.accounts.assertAccount(accountId)
    if (!await this.configured(accountId)) throw new AccountError('ACCOUNT_SIGNED_OUT')
    if (!this.catalog) throw new AccountError('INVALID_MODEL')
    const definition = await this.catalog.available(accountId, model, { signal })
    if (!definition) throw new AccountError('INVALID_MODEL')
    if (!effortSupported(definition, reasoningEffort)) throw new AccountError('INVALID_REASONING_EFFORT')
    return this.accounts.exclusive(async () => {
      signal?.throwIfAborted()
      this.accounts.assertAccount(accountId)
      if (!await this.configured(accountId)) throw new AccountError('ACCOUNT_SIGNED_OUT')
      const record = { enabled: true, accountId, model, reasoningEffort, selectionMode: 'user-pinned' }
      await this.table.put('default', record)
      return { ...record, available: true, status: 'available' }
    })
  }
  async enableAuto({ accountId } = {}) {
    await this.accounts.exclusive(async () => {
      this.accounts.assertAccount(accountId)
      if (!await this.configured(accountId)) throw new AccountError('ACCOUNT_SIGNED_OUT')
      const prior = this.table.get('default')
      await this.table.put('default', { ...(prior?.accountId === accountId ? prior : empty()), enabled: true, accountId, selectionMode: AUTO })
    })
    return this.snapshot()
  }
  disable() {
    return this.accounts.exclusive(async () => {
      const record = { ...(this.table.get('default') ?? empty()), enabled: false, selectionMode: 'user-pinned' }
      await this.table.put('default', record)
      return { ...record, available: await this.configured(record.accountId), status: 'disabled' }
    })
  }
}
