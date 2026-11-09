// Saldo e totais para o front. Regra: saldo vem das CONTAS; lançamentos só alimentam relatórios.
export interface BankAccountRow { type: string; balance: number | null; is_active: boolean; include_in_balance: boolean; connection_active?: boolean }
export interface TxRow { type: 'income' | 'expense'; amount: number; ignore_in_reports?: boolean | null; archived_at?: string | null; source?: string | null }

export function computeBalance(input: { accounts: BankAccountRow[]; initialBalance: number; manualNet: number }) {
  const bank = input.accounts.filter((a) => a.type === 'BANK' && a.is_active && a.include_in_balance && a.connection_active !== false && a.balance != null)
  const cards = input.accounts.filter((a) => a.type === 'CREDIT' && a.is_active && a.connection_active !== false)
  const creditDue = Number(cards.reduce((s, a) => s + Number(a.balance || 0), 0).toFixed(2))
  if (bank.length > 0) {
    return { value: Number(bank.reduce((s, a) => s + Number(a.balance || 0), 0).toFixed(2)), source: 'bank' as const, creditDue }
  }
  return { value: Number((input.initialBalance + input.manualNet).toFixed(2)), source: 'manual' as const, creditDue }
}

export const isReportable = (t: TxRow) => !t.ignore_in_reports && !t.archived_at

export function totalsByType(txs: TxRow[]) {
  let income = 0, expense = 0
  for (const t of txs) {
    if (!isReportable(t)) continue
    if (t.type === 'income') income += Number(t.amount)
    else expense += Number(t.amount)
  }
  return { income: Number(income.toFixed(2)), expense: Number(expense.toFixed(2)) }
}

// Lançamentos que afetam o saldo no modo manual (sem contas conectadas): manuais, importados e demo.
export function manualNet(txs: TxRow[]): number {
  let n = 0
  for (const t of txs) {
    if (t.archived_at || t.source === 'open_finance') continue
    n += t.type === 'income' ? Number(t.amount) : -Number(t.amount)
  }
  return Number(n.toFixed(2))
}
