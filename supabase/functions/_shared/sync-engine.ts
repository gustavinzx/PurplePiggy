// Motor de sincronização: testável (recebe Pluggy e Repo por injeção).
import {
  assignFingerprints, computeNextAllowedAt, detectInternalTransfers, mapTransaction, normalizeDescription,
  PluggyAccount, PluggyTxn, sinceDate, stableAccountKey, stateMessage, summarizeItemState, ItemState, ProductInfo,
} from './pluggy-core.ts'

export interface PluggyClient {
  getItem(id: string): Promise<any>
  patchItem(id: string): Promise<{ ok: boolean; status: number; code?: string }>
  listAccounts(itemId: string): Promise<PluggyAccount[]>
  listTransactions(accountId: string, opts: { dateFrom: string }): AsyncGenerator<PluggyTxn[]>
}

export interface ExistingTx {
  id: string; external_id: string | null; fingerprint: string | null; bank_account_id: string | null
  occurred_on: string; amount: number; description: string; type: 'income' | 'expense'
  ignore_in_reports: boolean; ignore_reason: string | null; ignore_locked: boolean
}
export interface NewTx {
  user_id: string; bank_account_id: string; account_id: string; external_id: string; fingerprint: string
  type: 'income' | 'expense'; amount: number; description: string; occurred_on: string
  category_id: string; payment_method: string; source: 'open_finance'; pluggy_category_id: string | null
  ignore_in_reports: boolean; ignore_reason: string | null; pending: boolean; notes: string
}
export interface AccountUpsert {
  userId: string; connectionId: string; pluggyAccountId: string; stableKey: string; type: string; subtype: string | null
  name: string | null; numberMasked: string | null; balance: number | null; creditLimit: number | null; availableCreditLimit: number | null
}
export interface TransferCandidate { id: string; type: 'income' | 'expense'; amount: number; occurred_on: string; description: string; bank_account_id: string | null }

export interface Repo {
  startRun(userId: string, connectionId: string, trigger: string): Promise<string | null>
  finishRun(runId: string, patch: { status: string; stats: unknown; errors: string[] }): Promise<void>
  upsertAccount(a: AccountUpsert): Promise<{ id: string }>
  listExisting(userId: string, bankAccountId: string, fromDate: string): Promise<ExistingTx[]>
  listLegacy(userId: string, fromDate: string): Promise<ExistingTx[]>
  insertTxs(rows: NewTx[]): Promise<{ inserted: number; errors: string[] }>
  updateTx(id: string, patch: Record<string, unknown>): Promise<string | null>
  listTransferCandidates(userId: string, fromDate: string): Promise<TransferCandidate[]>
  markIgnored(ids: string[], reason: string): Promise<void>
  updateConnection(connectionId: string, patch: Record<string, unknown>): Promise<void>
  upsertConsent(userId: string, connectionId: string): Promise<void>
}

export interface SyncParams {
  userId: string; connectionId: string; itemId: string; connectorId?: string | number | null
  institutionName?: string | null; transactionsLastOkAt?: string | null
  trigger: 'manual' | 'webhook' | 'resume' | 'cron'; force?: boolean; full?: boolean
}
export interface SyncDeps {
  pluggy: PluggyClient; repo: Repo; now?: () => Date; sleep?: (ms: number) => Promise<void>
  maxWaitMs?: number; minIntervalMs?: number; maxPages?: number
}
export interface AccountResult {
  id: string; name: string | null; type: string; balance: number | null
  fetched: number; inserted: number; updated: number; ignored: number; skipped: number
}
export interface SyncResult {
  state: ItemState | 'already_running'; message: string; missing: string[]; products: Record<string, ProductInfo>
  accounts: AccountResult[]; errors: string[]; nextAllowedAt: string | null; incomplete: boolean; runId: string | null
}

const legacyKey = (date: string, cents: number, desc: string) => `${date}|${cents}|${desc.trim()}`

export async function runSync(d: SyncDeps, p: SyncParams): Promise<SyncResult> {
  const now = d.now ?? (() => new Date())
  const sleep = d.sleep ?? ((ms: number) => new Promise((r) => setTimeout(r, ms)))
  const empty = (state: SyncResult['state'], extra: Partial<SyncResult> = {}): SyncResult => ({
    state, message: '', missing: [], products: {}, accounts: [], errors: [], nextAllowedAt: null, incomplete: false, runId: null, ...extra,
  })

  const runId = await d.repo.startRun(p.userId, p.connectionId, p.trigger)
  if (!runId) return empty('already_running', { message: 'Já estamos sincronizando este banco. Aguarde um instante.' })

  const errors: string[] = []
  const accountsOut: AccountResult[] = []
  let incomplete = false
  let item: any = null
  let summary: ReturnType<typeof summarizeItemState> | null = null

  const sanitizeItemError = (err: any) => {
    if (!err || typeof err !== 'object') return null
    return {
      code: err.code ?? null,
      message: err.message ?? null,
      providerMessage: err.providerMessage ?? null,
    }
  }

  const finish = async (res: SyncResult, status: string) => {
    res.runId = runId
    const stats = {
      state: res.state,
      itemStatus: item?.status ?? null,
      executionStatus: item?.executionStatus ?? null,
      itemError: sanitizeItemError(item?.error),
      statusDetail: item?.statusDetail ?? null,
      products: summary?.products ?? res.products ?? null,
      dataGaps: res.missing,
      missing: res.missing,
      accounts: res.accounts,
      incomplete: res.incomplete,
    }
    await d.repo.finishRun(runId, { status, stats, errors: res.errors })
    return res
  }

  try {
    item = await d.pluggy.getItem(p.itemId)
    summary = summarizeItemState(item)
    let nextAllowedAt = computeNextAllowedAt(item, d.minIntervalMs)

    if (summary.state === 'needs_user_action' || summary.state === 'error') {
      await d.repo.updateConnection(p.connectionId, {
        pluggy_status: item?.status ?? null, execution_status: item?.executionStatus ?? null, status_detail: item?.statusDetail ?? null,
        needs_user_action: summary.state === 'needs_user_action', error_message: summary.state === 'error' ? 'Falha na última atualização do banco.' : null,
        next_allowed_sync_at: nextAllowedAt,
      })
      return await finish(empty(summary.state, { message: stateMessage(summary.state, []), products: summary.products, nextAllowedAt }), summary.state === 'error' ? 'error' : 'partial')
    }

    // Atualização forçada (botão "Tentar de novo"): só se o intervalo mínimo da Pluggy já passou.
    if (p.force && (!nextAllowedAt || Date.parse(nextAllowedAt) <= now().getTime())) {
      const r = await d.pluggy.patchItem(p.itemId)
      if (!r.ok && r.status !== 409) errors.push(`PATCH /items falhou (${r.status}${r.code ? ' ' + r.code : ''})`)
      item = await d.pluggy.getItem(p.itemId)
    }

    // Espera curta enquanto a Pluggy atualiza (não segura a função por muito tempo).
    const deadline = now().getTime() + (d.maxWaitMs ?? 20_000)
    while (item?.status === 'UPDATING' && now().getTime() < deadline) {
      await sleep(2000)
      item = await d.pluggy.getItem(p.itemId)
    }
    summary = summarizeItemState(item)
    nextAllowedAt = computeNextAllowedAt(item, d.minIntervalMs)
    if (summary.state === 'updating') {
      await d.repo.updateConnection(p.connectionId, { pluggy_status: 'UPDATING', next_allowed_sync_at: nextAllowedAt })
      return await finish(empty('updating', { message: stateMessage('updating', []), products: summary.products, nextAllowedAt, errors }), 'partial')
    }
    if (summary.state === 'needs_user_action' || summary.state === 'error') {
      await d.repo.updateConnection(p.connectionId, { pluggy_status: item?.status ?? null, needs_user_action: summary.state === 'needs_user_action', next_allowed_sync_at: nextAllowedAt })
      return await finish(empty(summary.state, { message: stateMessage(summary.state, []), products: summary.products, nextAllowedAt, errors }), 'partial')
    }

    const accounts = await d.pluggy.listAccounts(p.itemId)
    const hasCredit = accounts.some((a) => a.type === 'CREDIT')
    const missing = summary.missing.filter((m) => m !== 'creditCards' || hasCredit)
    let state: ItemState = summary.state === 'ok' ? 'ok' : (missing.length || item?.executionStatus === 'PARTIAL_SUCCESS' ? 'partial' : 'ok')
    const transactionsReady = summary.products.transactions?.isUpdated !== false

    const from = sinceDate(now(), p.transactionsLastOkAt, !!p.full)
    const todayStr = now().toISOString().slice(0, 10)
    let bankTotal = 0
    let anyTxFetchFailed = false

    for (const acc of accounts) {
      const stableKey = stableAccountKey(p.connectorId, acc)
      const bank = await d.repo.upsertAccount({
        userId: p.userId, connectionId: p.connectionId, pluggyAccountId: acc.id, stableKey, type: acc.type, subtype: acc.subtype ?? null,
        name: acc.name ?? null, numberMasked: acc.number ?? null, balance: acc.balance ?? null,
        creditLimit: acc.creditData?.creditLimit ?? null, availableCreditLimit: acc.creditData?.availableCreditLimit ?? null,
      })
      if (acc.type === 'BANK') bankTotal += Number(acc.balance || 0)
      const res: AccountResult = { id: acc.id, name: acc.name ?? null, type: acc.type, balance: acc.balance ?? null, fetched: 0, inserted: 0, updated: 0, ignored: 0, skipped: 0 }
      accountsOut.push(res)

      // Lê TODAS as páginas do cursor.
      const incoming = new Map<string, PluggyTxn>()
      try {
        let pages = 0
        for await (const page of d.pluggy.listTransactions(acc.id, { dateFrom: from })) {
          for (const t of page) if (t?.id) incoming.set(String(t.id), t)
          pages++
          if (pages >= (d.maxPages ?? 60)) { incomplete = true; break }
        }
      } catch (e) {
        anyTxFetchFailed = true
        errors.push(`Falha ao ler o extrato de "${acc.name ?? acc.id}": ${(e as Error).message}`)
        continue
      }
      res.fetched = incoming.size

      const mapped = [...incoming.values()].map((t) => ({ t, m: mapTransaction(acc, t, todayStr) }))
      res.skipped = mapped.filter((x) => !x.m).length
      const valid = mapped.filter((x) => x.m) as { t: PluggyTxn; m: NonNullable<ReturnType<typeof mapTransaction>> }[]
      const fps = await assignFingerprints(stableKey, valid.map((x) => ({ key: x.m.externalId, date: x.m.date, cents: x.m.cents, normDesc: x.m.normDesc })))

      const existing = await d.repo.listExisting(p.userId, bank.id, from)
      const legacy = await d.repo.listLegacy(p.userId, from)
      const byExt = new Map<string, ExistingTx>(); const byFp = new Map<string, ExistingTx>()
      for (const e of existing) { if (e.external_id) byExt.set(e.external_id, e); if (e.fingerprint) byFp.set(e.fingerprint, e) }
      const legacyPool = new Map<string, ExistingTx[]>()
      for (const l of legacy) {
        const k = legacyKey(l.occurred_on, Math.round(Number(l.amount) * 100), l.description)
        legacyPool.set(k, [...(legacyPool.get(k) || []), l])
      }

      const toInsert: NewTx[] = []
      for (const { m } of valid) {
        const fp = fps.get(m.externalId)!
        let found = byExt.get(m.externalId) || byFp.get(fp)
        if (!found) {
          const k = legacyKey(m.date, m.cents, m.description)
          const pool = legacyPool.get(k)
          if (pool?.length) found = pool.shift()
        }
        if (found) {
          const patch: Record<string, unknown> = { external_id: m.externalId, fingerprint: fp, bank_account_id: bank.id, account_id: acc.id, pending: m.pending, pluggy_category_id: m.pluggyCategoryId, archived_at: null }
          if (!found.ignore_locked && m.ignoreReason && !found.ignore_reason) { patch.ignore_in_reports = true; patch.ignore_reason = m.ignoreReason }
          const err = await d.repo.updateTx(found.id, patch)
          if (err) errors.push(`Atualização rejeitada (${m.date} ${m.amount}): ${err}`)
          else res.updated++
        } else {
          toInsert.push({
            user_id: p.userId, bank_account_id: bank.id, account_id: acc.id, external_id: m.externalId, fingerprint: fp,
            type: m.type, amount: m.amount, description: m.description, occurred_on: m.date, category_id: m.categoryId,
            payment_method: m.paymentMethod, source: 'open_finance', pluggy_category_id: m.pluggyCategoryId,
            ignore_in_reports: !!m.ignoreReason, ignore_reason: m.ignoreReason, pending: m.pending,
            notes: `Importado via Open Finance${p.institutionName ? ` (${p.institutionName})` : ''}`,
          })
          if (m.ignoreReason) res.ignored++
        }
      }
      if (toInsert.length) {
        const r = await d.repo.insertTxs(toInsert)
        res.inserted = r.inserted
        errors.push(...r.errors)
      }
    }

    // Transferências entre as contas da própria usuária (conservador).
    try {
      const cands = await d.repo.listTransferCandidates(p.userId, from)
      const keyOf = new Map(cands.map((c) => [c.id, c]))
      const set = detectInternalTransfers(cands.map((c) => ({
        key: c.id, type: c.type, cents: Math.round(Number(c.amount) * 100), date: c.occurred_on,
        normDesc: normalizeDescription(c.description), accountKey: c.bank_account_id || 'x',
      })))
      if (set.size) await d.repo.markIgnored([...set].filter((id) => keyOf.has(id)), 'internal_transfer')
    } catch (e) { errors.push(`Detecção de transferências falhou: ${(e as Error).message}`) }

    const txOk = transactionsReady && !anyTxFetchFailed && !incomplete
    if (!txOk && state === 'ok') state = 'partial'
    await d.repo.updateConnection(p.connectionId, {
      balance: Number(bankTotal.toFixed(2)), last_synced_at: now().toISOString(), status: 'active',
      pluggy_status: item?.status ?? null, execution_status: item?.executionStatus ?? null, status_detail: item?.statusDetail ?? null,
      data_gaps: missing,
      needs_user_action: false, error_message: errors.length ? errors[0].slice(0, 300) : null, next_allowed_sync_at: nextAllowedAt,
      ...(txOk ? { transactions_last_ok_at: now().toISOString() } : {}),
    })
    await d.repo.upsertConsent(p.userId, p.connectionId)

    const result = empty(state, { message: stateMessage(state, missing), missing, products: summary.products, accounts: accountsOut, errors, nextAllowedAt, incomplete })
    return await finish(result, errors.length || state !== 'ok' || incomplete ? 'partial' : 'success')
  } catch (e) {
    errors.push((e as Error).message)
    return await finish(empty('error', { message: stateMessage('error', []), errors, accounts: accountsOut }), 'error')
  }
}
