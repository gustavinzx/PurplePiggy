import { describe, it, expect } from 'vitest'
import { runSync, Repo, ExistingTx, NewTx, PluggyClient, SyncParams } from '../supabase/functions/_shared/sync-engine'

// Repo em memória (equivale ao banco), com os mesmos contratos do Supabase.
function memRepo(opts: { failOnDescription?: string; runningRun?: boolean } = {}) {
  const accounts: any[] = []; const txs: any[] = []; const consents = new Set<string>(); const conns = new Map<string, any>(); const runs: any[] = []
  let seq = 0
  const repo: Repo = {
    async startRun() { if (opts.runningRun) return null; runs.push({ id: 'r' + ++seq }); return 'r' + seq },
    async finishRun(id, patch) { Object.assign(runs.find((r) => r.id === id) || {}, patch) },
    async upsertAccount(a) {
      let row = accounts.find((x) => x.pluggyAccountId === a.pluggyAccountId) || accounts.find((x) => x.stableKey === a.stableKey)
      if (row) { Object.assign(row, a); txs.filter((t) => t.bank_account_id === row.id).forEach((t) => (t.archived_at = null)) }
      else { row = { id: 'acc' + ++seq, ...a }; accounts.push(row) }
      return { id: row.id }
    },
    async listExisting(_u, id, from) { return txs.filter((t) => t.bank_account_id === id && t.occurred_on >= from) as ExistingTx[] },
    async listLegacy(_u, from) { return txs.filter((t) => t.source === 'open_finance' && !t.bank_account_id && t.occurred_on >= from) as ExistingTx[] },
    async insertTxs(rows: NewTx[]) {
      let inserted = 0; const errors: string[] = []
      for (const r of rows) {
        if (opts.failOnDescription && r.description === opts.failOnDescription) { errors.push(`Lançamento rejeitado (${r.occurred_on} ${r.amount}): violates check`); continue }
        txs.push({ id: 't' + ++seq, ignore_locked: false, ...r }); inserted++
      }
      return { inserted, errors }
    },
    async updateTx(id, patch) { Object.assign(txs.find((t) => t.id === id)!, patch); return null },
    async listTransferCandidates() { return txs.filter((t) => !t.archived_at && !t.ignore_in_reports) as any },
    async markIgnored(ids, reason) { txs.filter((t) => ids.includes(t.id)).forEach((t) => { t.ignore_in_reports = true; t.ignore_reason = reason }) },
    async updateConnection(id, patch) { conns.set(id, { ...(conns.get(id) || {}), ...patch }) },
    async upsertConsent(_u, c) { consents.add(c) },
  }
  return { repo, accounts, txs, consents, conns, runs }
}

function fakePluggy(cfg: { item: any; items?: any[]; accounts: any[]; txns: Record<string, any[]>; pageSize?: number; patchStatus?: number; throwTxFor?: string }): PluggyClient & { patched: number } {
  let i = 0
  const c: any = {
    patched: 0,
    async getItem() { return cfg.items ? cfg.items[Math.min(i++, cfg.items.length - 1)] : cfg.item },
    async patchItem() { c.patched++; return { ok: (cfg.patchStatus ?? 200) < 300, status: cfg.patchStatus ?? 200 } },
    async listAccounts() { return cfg.accounts },
    async *listTransactions(accId: string) {
      if (cfg.throwTxFor === accId) throw new Error('Pluggy 500')
      const all = cfg.txns[accId] || []; const ps = cfg.pageSize ?? 500
      for (let k = 0; k < all.length || k === 0; k += ps) { yield all.slice(k, k + ps); if (all.length === 0) break }
    },
  }
  return c
}

const OK_ITEM = { status: 'UPDATED', executionStatus: 'SUCCESS', lastUpdatedAt: '2026-11-06T10:00:00Z', statusDetail: { accounts: { isUpdated: true }, transactions: { isUpdated: true } } }
const params = (o: Partial<SyncParams> = {}): SyncParams => ({ userId: 'u1', connectionId: 'conn1', itemId: 'item1', connectorId: 'mp', institutionName: 'Mercado Pago', trigger: 'manual', ...o })
const now = () => new Date('2026-11-07T12:00:00Z')
const mkTx = (n: number, p = 'Compra') => Array.from({ length: n }, (_, k) => ({ id: `${p}-${k}`, amount: -(k + 1), type: 'DEBIT', description: `${p} ${k}`, date: '2026-11-0' + (1 + (k % 6)) + 'T00:00:00Z' }))
const MP = { id: 'mpA', type: 'BANK', subtype: 'CHECKING_ACCOUNT', name: 'Conta', number: '***81-9', balance: 0 }

describe('runSync', () => {
  it('lê TODAS as páginas do cursor (250 lançamentos em 3 páginas) e não trunca em 30', async () => {
    const m = memRepo(); const r = await runSync({ pluggy: fakePluggy({ item: OK_ITEM, accounts: [MP], txns: { mpA: mkTx(250) }, pageSize: 100 }), repo: m.repo, now }, params())
    expect(r.state).toBe('ok'); expect(r.accounts[0]).toMatchObject({ fetched: 250, inserted: 250 }); expect(m.txs).toHaveLength(250)
  })

  it('sincronizar 3 vezes seguidas não duplica nada', async () => {
    const m = memRepo(); const p = fakePluggy({ item: OK_ITEM, accounts: [MP], txns: { mpA: mkTx(40) } })
    for (let k = 0; k < 3; k++) await runSync({ pluggy: p, repo: m.repo, now }, params())
    expect(m.txs).toHaveLength(40)
  })

  it('duas compras IDÊNTICAS no mesmo dia entram as duas e continuam 2 após re-sync', async () => {
    const same = [{ id: 'x1', amount: -35, type: 'DEBIT', description: 'Restaurante', date: '2026-11-03' }, { id: 'x2', amount: -35, type: 'DEBIT', description: 'Restaurante', date: '2026-11-03' }]
    const m = memRepo(); const p = fakePluggy({ item: OK_ITEM, accounts: [MP], txns: { mpA: same } })
    await runSync({ pluggy: p, repo: m.repo, now }, params()); await runSync({ pluggy: p, repo: m.repo, now }, params())
    expect(m.txs).toHaveLength(2)
  })

  it('RECONEXÃO: conta e transações com ids novos NÃO duplicam e reaproveitam a conta', async () => {
    const m = memRepo()
    await runSync({ pluggy: fakePluggy({ item: OK_ITEM, accounts: [MP], txns: { mpA: mkTx(20) } }), repo: m.repo, now }, params())
    const mp2 = { ...MP, id: 'mpB' }
    const txB = mkTx(20).map((t) => ({ ...t, id: 'novo-' + t.id }))
    await runSync({ pluggy: fakePluggy({ item: OK_ITEM, accounts: [mp2], txns: { mpB: txB } }), repo: m.repo, now }, params({ connectionId: 'conn2', itemId: 'item2' }))
    expect(m.txs).toHaveLength(20); expect(m.accounts).toHaveLength(1)
  })

  it('NUBANK parcial: saldo grava, extrato/cartão faltam, aviso claro e NENHUM sucesso falso', async () => {
    const nu = { status: 'UPDATED', executionStatus: 'PARTIAL_SUCCESS', lastUpdatedAt: '2026-11-06T21:38:24Z', statusDetail: { accounts: { isUpdated: true }, transactions: { isUpdated: false, lastUpdatedAt: null }, creditCards: { isUpdated: false } } }
    const accs = [{ id: 'nuB', type: 'BANK', subtype: 'CHECKING_ACCOUNT', name: 'Conta', number: '***36-8', balance: 2.29 }, { id: 'nuC', type: 'CREDIT', subtype: 'CREDIT_CARD', name: 'Cartão', number: '***9177', balance: 3.64 }]
    const m = memRepo(); const r = await runSync({ pluggy: fakePluggy({ item: nu, accounts: accs, txns: {} }), repo: m.repo, now }, params({ institutionName: 'Nubank', connectorId: 'nu' }))
    expect(r.state).toBe('partial'); expect(r.missing).toEqual(['transactions', 'creditCards']); expect(r.message).toContain('extrato')
    expect(m.conns.get('conn1')).toMatchObject({ balance: 2.29 }); expect(m.conns.get('conn1').transactions_last_ok_at).toBeUndefined()
    expect(m.runs[0].status).toBe('partial')
    expect(m.runs[0].stats).toMatchObject({
      state: 'partial',
      itemStatus: 'UPDATED',
      executionStatus: 'PARTIAL_SUCCESS',
      itemError: null,
      dataGaps: ['transactions', 'creditCards'],
      missing: ['transactions', 'creditCards'],
    })
  })

  it('respeita o intervalo: PATCH só com force e depois do prazo; 409 não vira erro', async () => {
    const item = { ...OK_ITEM, lastUpdatedAt: '2026-11-07T11:40:00Z' } // faz 20 min: ainda NÃO pode atualizar
    const p1 = fakePluggy({ item, accounts: [MP], txns: { mpA: [] } }); const r1 = await runSync({ pluggy: p1, repo: memRepo().repo, now }, params({ force: true }))
    expect(p1.patched).toBe(0); expect(r1.nextAllowedAt).toBe('2026-11-07T12:40:00.000Z')
    const old = { ...OK_ITEM, lastUpdatedAt: '2026-11-07T09:00:00Z' }
    const p2 = fakePluggy({ item: old, accounts: [MP], txns: { mpA: [] }, patchStatus: 409 }); const r2 = await runSync({ pluggy: p2, repo: memRepo().repo, now }, params({ force: true }))
    expect(p2.patched).toBe(1); expect(r2.errors).toEqual([])
  })

  it('item que continua UPDATING devolve "updating" sem escrever nada (não diz que falta autorização)', async () => {
    const m = memRepo(); let t = 0
    const clock = () => new Date(Date.parse('2026-11-07T12:00:00Z') + (t += 6000))
    const r = await runSync({ pluggy: fakePluggy({ item: { status: 'UPDATING' }, accounts: [MP], txns: { mpA: mkTx(5) } }), repo: m.repo, now: clock, sleep: async () => {}, maxWaitMs: 20000 }, params())
    expect(r.state).toBe('updating'); expect(m.txs).toHaveLength(0); expect(r.message).not.toMatch(/autoriza/i)
  })

  it('UPDATING que termina durante a espera segue e grava os dados', async () => {
    const m = memRepo(); const r = await runSync({ pluggy: fakePluggy({ item: OK_ITEM, items: [{ status: 'UPDATING' }, { status: 'UPDATING' }, OK_ITEM], accounts: [MP], txns: { mpA: mkTx(3) } }), repo: m.repo, now, sleep: async () => {} }, params())
    expect(r.state).toBe('ok'); expect(m.txs).toHaveLength(3)
  })

  it('LOGIN_ERROR: pede ação, não lê nem apaga dados', async () => {
    const m = memRepo(); const r = await runSync({ pluggy: fakePluggy({ item: { status: 'LOGIN_ERROR' }, accounts: [MP], txns: { mpA: mkTx(3) } }), repo: m.repo, now }, params())
    expect(r.state).toBe('needs_user_action'); expect(m.txs).toHaveLength(0); expect(m.conns.get('conn1').needs_user_action).toBe(true)
  })

  it('linha rejeitada pelo banco não derruba as outras e aparece no relatório', async () => {
    const m = memRepo({ failOnDescription: 'Compra 3' }); const r = await runSync({ pluggy: fakePluggy({ item: OK_ITEM, accounts: [MP], txns: { mpA: mkTx(10) } }), repo: m.repo, now }, params())
    expect(m.txs).toHaveLength(9); expect(r.errors[0]).toContain('rejeitado'); expect(m.runs[0].status).toBe('partial')
  })

  it('falha ao ler o extrato de UMA conta é reportada e não impede a outra', async () => {
    const m = memRepo(); const b = { ...MP, id: 'mpB', number: '***11-1' }
    const r = await runSync({ pluggy: fakePluggy({ item: OK_ITEM, accounts: [MP, b], txns: { mpA: mkTx(3), mpB: mkTx(3, 'B') }, throwTxFor: 'mpA' }), repo: m.repo, now }, params())
    expect(m.txs).toHaveLength(3); expect(r.errors[0]).toContain('Falha ao ler o extrato'); expect(r.state).toBe('partial')
  })

  it('pagamento de fatura (conta e cartão) fica neutro; transferência entre contas também', async () => {
    const nuB = { id: 'nB', type: 'BANK', subtype: 'CHECKING_ACCOUNT', name: 'Conta', number: '***1', balance: 100 }
    const mpB = { id: 'mB', type: 'BANK', subtype: 'CHECKING_ACCOUNT', name: 'Conta', number: '***2', balance: 0 }
    const m = memRepo()
    const r = await runSync({ pluggy: fakePluggy({ item: OK_ITEM, accounts: [nuB, mpB], txns: {
      nB: [{ id: '1', amount: -800, type: 'DEBIT', description: 'Pagamento de fatura', date: '2026-11-03' }, { id: '2', amount: -100, type: 'DEBIT', description: 'Pix enviado', date: '2026-11-04' }],
      mB: [{ id: '3', amount: 100, type: 'CREDIT', description: 'Pix recebido', date: '2026-11-04' }, { id: '4', amount: 20, type: 'CREDIT', description: 'Venda', date: '2026-11-05' }] } }), repo: m.repo, now }, params())
    expect(m.txs.filter((t) => !t.ignore_in_reports).map((t) => t.description)).toEqual(['Venda']); expect(r.state).toBe('ok')
  })

  it('ADOÇÃO de lançamentos antigos (sem conta/impressão): atualiza em vez de duplicar', async () => {
    const m = memRepo(); m.txs.push({ id: 'old1', source: 'open_finance', bank_account_id: null, external_id: 'velho', occurred_on: '2026-11-01', amount: 10, description: 'Compra 0', type: 'expense', ignore_in_reports: false, ignore_reason: null, ignore_locked: false })
    await runSync({ pluggy: fakePluggy({ item: OK_ITEM, accounts: [MP], txns: { mpA: [{ id: 'novo', amount: -10, type: 'DEBIT', description: 'Compra 0', date: '2026-11-01' }] } }), repo: m.repo, now }, params())
    expect(m.txs).toHaveLength(1); expect(m.txs[0]).toMatchObject({ id: 'old1', external_id: 'novo', bank_account_id: expect.any(String) })
  })

  it('conexões independentes: sincronizar uma não mexe na outra; sync em andamento devolve already_running', async () => {
    const m = memRepo(); const nu = { id: 'nB', type: 'BANK', subtype: 'CHECKING_ACCOUNT', name: 'Conta', number: '***36-8', balance: 2.29 }
    await runSync({ pluggy: fakePluggy({ item: OK_ITEM, accounts: [nu], txns: { nB: mkTx(5, 'NU') } }), repo: m.repo, now }, params({ connectionId: 'cNu', itemId: 'iNu', connectorId: 'nu' }))
    await runSync({ pluggy: fakePluggy({ item: OK_ITEM, accounts: [MP], txns: { mpA: mkTx(7, 'MP') } }), repo: m.repo, now }, params({ connectionId: 'cMp', itemId: 'iMp' }))
    expect(m.txs).toHaveLength(12); expect(m.conns.get('cNu').balance).toBe(2.29); expect(m.conns.get('cMp').balance).toBe(0); expect(m.consents.size).toBe(2)
    const busy = await runSync({ pluggy: fakePluggy({ item: OK_ITEM, accounts: [MP], txns: {} }), repo: memRepo({ runningRun: true }).repo, now }, params())
    expect(busy.state).toBe('already_running')
  })
})
