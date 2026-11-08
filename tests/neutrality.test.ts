import { describe, it, expect } from 'vitest'
import { mapTransaction } from '../supabase/functions/_shared/pluggy-core'
import { getMonthlySeries, getPeriodSummary } from '../src/lib/expenses'

const bank = { id: 'a1', type: 'BANK', subtype: 'CHECKING_ACCOUNT', number: '***36-8' }

describe('neutralidade de movimentos internos', () => {
  it('Nubank: Aplicação RDB e Resgate RDB não contam como despesa/receita', () => {
    expect(mapTransaction(bank, { id: '1', amount: -800, type: 'DEBIT', description: 'Aplicação RDB' }, 'x')?.ignoreReason).toBe('internal_transfer')
    expect(mapTransaction(bank, { id: '2', amount: 3600, type: 'CREDIT', description: 'Resgate RDB' }, 'x')?.ignoreReason).toBe('internal_transfer')
  })
  it('Pluggy 04xxxxxx (Same person transfer) é movimento interno', () => {
    expect(mapTransaction(bank, { id: '3', amount: -1000, type: 'DEBIT', description: 'Transferência enviada pelo Pix|Fulana', categoryId: '04030000' }, 'x')?.ignoreReason).toBe('internal_transfer')
  })
  it('Pix para outra pessoa continua sendo despesa real', () => {
    expect(mapTransaction(bank, { id: '4', amount: -3000, type: 'DEBIT', description: 'Transferência enviada|Caio', categoryId: '05070000' }, 'x')?.ignoreReason).toBeNull()
  })
})

describe('totais de despesas ignoram faturas e movimentos internos', () => {
  const base = { category_id: 'c', description: 'x' }
  const txs = [
    { ...base, id: '1', amount: 100, type: 'expense', occurred_on: '2026-09-10' },
    { ...base, id: '2', amount: 650, type: 'expense', occurred_on: '2026-09-25', ignore_in_reports: true },
    { ...base, id: '3', amount: 91, type: 'expense', occurred_on: '2026-09-26', ignore_in_reports: true },
    { ...base, id: '4', amount: 50, type: 'expense', occurred_on: '2026-09-27', archived_at: '2026-10-01' },
  ]
  it('barra mensal e resumo somam só a despesa real', () => {
    const ref = new Date(2026, 8, 30)
    const sep = getMonthlySeries(txs, 'mes', ref).find((b) => b.key === '2026-09')
    expect(sep?.value).toBe(100)
    expect(getPeriodSummary(txs, 'mes', '2026-09', ref).totalExpenses).toBe(100)
  })
})
