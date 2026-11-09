// Implementação do Repo com Supabase (service_role). `sb` é o cliente do supabase-js.
import type { AccountUpsert, ExistingTx, NewTx, Repo, TransferCandidate } from './sync-engine.ts'

const PAGE = 1000
async function fetchAll<T>(build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>): Promise<T[]> {
  const out: T[] = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await build(from, from + PAGE - 1)
    if (error) throw new Error(error.message)
    out.push(...(data ?? []))
    if (!data || data.length < PAGE) break
  }
  return out
}
const chunk = <T,>(a: T[], n: number) => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n))
const COLS = 'id, external_id, fingerprint, bank_account_id, occurred_on, amount, description, type, ignore_in_reports, ignore_reason, ignore_locked'

export function createSupabaseRepo(sb: any): Repo {
  return {
    async startRun(userId, connectionId, trigger) {
      const cutoff = new Date(Date.now() - 3 * 60_000).toISOString()
      await sb.from('sync_runs').update({ status: 'error', finished_at: new Date().toISOString(), errors: ['Execução anterior expirou'] })
        .eq('connection_id', connectionId).eq('status', 'running').lt('started_at', cutoff)
      const { data, error } = await sb.from('sync_runs').insert({ user_id: userId, connection_id: connectionId, trigger, status: 'running' }).select('id').single()
      if (error) { if (error.code === '23505') return null; throw new Error(error.message) } // índice único: já existe um "running"
      return data.id as string
    },
    async finishRun(runId, patch) {
      await sb.from('sync_runs').update({ status: patch.status, stats: patch.stats, errors: patch.errors, finished_at: new Date().toISOString() }).eq('id', runId)
    },
    async upsertAccount(a: AccountUpsert) {
      const fields = {
        user_id: a.userId, connection_id: a.connectionId, pluggy_account_id: a.pluggyAccountId, stable_key: a.stableKey, type: a.type,
        subtype: a.subtype, name: a.name, number_masked: a.numberMasked, balance: a.balance, credit_limit: a.creditLimit,
        available_credit_limit: a.availableCreditLimit, is_active: true, last_synced_at: new Date().toISOString(),
      }
      let { data: row } = await sb.from('bank_accounts').select('id, connection_id').eq('user_id', a.userId).eq('pluggy_account_id', a.pluggyAccountId).maybeSingle()
      if (!row) ({ data: row } = await sb.from('bank_accounts').select('id, connection_id').eq('user_id', a.userId).eq('stable_key', a.stableKey).maybeSingle())
      if (row) {
        const { error } = await sb.from('bank_accounts').update(fields).eq('id', row.id)
        if (error) throw new Error(error.message)
        // Reconexão: herda o histórico arquivado da conta antiga (sem duplicar).
        if (row.connection_id !== a.connectionId) await sb.from('transactions').update({ archived_at: null }).eq('user_id', a.userId).eq('bank_account_id', row.id)
        return { id: row.id as string }
      }
      const { data, error } = await sb.from('bank_accounts').insert(fields).select('id').single()
      if (error) throw new Error(error.message)
      return { id: data.id as string }
    },
    async listExisting(userId, bankAccountId, fromDate) {
      return fetchAll<ExistingTx>((f, t) => sb.from('transactions').select(COLS).eq('user_id', userId).eq('bank_account_id', bankAccountId).gte('occurred_on', fromDate).order('id').range(f, t))
    },
    async listLegacy(userId, fromDate) {
      return fetchAll<ExistingTx>((f, t) => sb.from('transactions').select(COLS).eq('user_id', userId).eq('source', 'open_finance').is('bank_account_id', null).gte('occurred_on', fromDate).order('id').range(f, t))
    },
    async insertTxs(rows: NewTx[]) {
      let inserted = 0; const errors: string[] = []
      for (const part of chunk(rows, 100)) {
        const { error } = await sb.from('transactions').insert(part)
        if (!error) { inserted += part.length; continue }
        for (const row of part) { // lote falhou: isola a linha ruim e segue com as demais
          const r = await sb.from('transactions').insert(row)
          if (r.error) errors.push(`Lançamento rejeitado (${row.occurred_on} ${row.amount}): ${r.error.message}`)
          else inserted++
        }
      }
      return { inserted, errors }
    },
    async updateTx(id, patch) {
      const { error } = await sb.from('transactions').update(patch).eq('id', id)
      return error ? error.message : null
    },
    async listTransferCandidates(userId, fromDate) {
      return fetchAll<TransferCandidate>((f, t) => sb.from('transactions').select('id, type, amount, occurred_on, description, bank_account_id')
        .eq('user_id', userId).eq('source', 'open_finance').is('archived_at', null).eq('ignore_in_reports', false).eq('ignore_locked', false).gte('occurred_on', fromDate).order('id').range(f, t))
    },
    async markIgnored(ids, reason) {
      for (const part of chunk(ids, 200)) await sb.from('transactions').update({ ignore_in_reports: true, ignore_reason: reason }).in('id', part)
    },
    async updateConnection(connectionId, patch) {
      const { error } = await sb.from('bank_connections').update(patch).eq('id', connectionId)
      if (error) throw new Error(error.message)
    },
    async upsertConsent(userId, connectionId) {
      const { data } = await sb.from('open_finance_consents').select('id').eq('connection_id', connectionId).maybeSingle()
      if (data) return
      const exp = new Date(); exp.setFullYear(exp.getFullYear() + 1)
      await sb.from('open_finance_consents').insert({ user_id: userId, connection_id: connectionId, scopes: ['accounts', 'transactions', 'credit_cards'], status: 'authorized', expires_at: exp.toISOString() })
    },
  }
}
