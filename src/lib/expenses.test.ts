import { describe, it, expect } from 'vitest'
import {
  getMonthlySeries,
  getPeriodSummary,
  getTopCategories,
  ExpenseItem,
  CategoryInfo,
} from './expenses'

describe('expenses.ts - Seletores Puros de Gastos', () => {
  const categories: Record<string, CategoryInfo> = {
    c1: { id: 'c1', name: 'Alimentação' },
    c2: { id: 'c2', name: 'Transporte' },
    c3: { id: 'c3', name: 'Lazer' },
    c4: { id: 'c4', name: 'Saúde' },
    c5: { id: 'c5', name: 'Educação' },
    c6: { id: 'c6', name: 'Moradia' },
  }

  const baseTransactions: ExpenseItem[] = [
    // Novembro 2026 (mês atual de referência)
    { id: '1', amount: 627.2, type: 'expense', category_id: 'c1', occurred_on: '2026-11-05', description: 'Supermercado' },
    { id: '2', amount: 300.0, type: 'expense', category_id: 'c2', occurred_on: '2026-11-04', description: 'Combustível' },
    { id: '3', amount: 500.0, type: 'expense', category_id: 'c3', occurred_on: '2026-11-02', description: 'Show' },
    { id: '4', amount: 532.8, type: 'expense', category_id: 'c4', occurred_on: '2026-11-01', description: 'Farmácia' },
    // Total Novembro = 627.2 + 300 + 500 + 532.8 = 1960.00
    // Receita de novembro (não deve entrar em despesas!)
    { id: '5', amount: 5000.0, type: 'income', category_id: 'c6', occurred_on: '2026-11-01', description: 'Salário' },

    // Outubro 2026
    { id: '6', amount: 2022.7, type: 'expense', category_id: 'c1', occurred_on: '2026-10-15', description: 'Compras' },

    // Setembro 2026
    { id: '7', amount: 1800.0, type: 'expense', category_id: 'c1', occurred_on: '2026-09-10', description: 'Compras' },

    // Agosto 2026
    { id: '8', amount: 1500.0, type: 'expense', category_id: 'c2', occurred_on: '2026-08-12', description: 'Revisão carro' },

    // Julho 2026
    { id: '9', amount: 1700.0, type: 'expense', category_id: 'c3', occurred_on: '2026-07-20', description: 'Viagem' },

    // Junho 2026
    { id: '10', amount: 1600.0, type: 'expense', category_id: 'c1', occurred_on: '2026-06-18', description: 'Supermercado' },
  ]

  const refDate = new Date('2026-11-15T12:00:00Z')

  describe('getMonthlySeries', () => {
    it('deve retornar exatamente 6 barras no período "mes" com Novembro ativo', () => {
      const series = getMonthlySeries(baseTransactions, 'mes', refDate, '2026-11')
      expect(series).toHaveLength(6)

      expect(series[5].label).toBe('Nov')
      expect(series[5].value).toBe(1960.0)
      expect(series[5].isCurrent).toBe(true)
      expect(series[5].isSelected).toBe(true)

      expect(series[0].label).toBe('Jun')
      expect(series[0].value).toBe(1600.0)
    })

    it('deve retornar exatamente 3 barras no período "3m"', () => {
      const series = getMonthlySeries(baseTransactions, '3m', refDate)
      expect(series).toHaveLength(3)
      expect(series.map((s) => s.label)).toEqual(['Set', 'Out', 'Nov'])
    })

    it('deve retornar exatamente 12 barras no período "1a"', () => {
      const series = getMonthlySeries(baseTransactions, '1a', refDate)
      expect(series).toHaveLength(12)
      expect(series[11].label).toBe('Nov')
    })

    it('não deve somar receitas nas barras de despesas', () => {
      const series = getMonthlySeries(baseTransactions, 'mes', refDate, '2026-11')
      const nov = series.find((s) => s.key === '2026-11')
      // Se somasse o salário de 5000, daria 6960
      expect(nov?.value).toBe(1960.0)
    })
  })

  describe('getPeriodSummary', () => {
    it('deve calcular despesas e variação correta em relação ao mês anterior', () => {
      // Novembro: 1960.00 vs Outubro: 2022.70
      // Variação: (1960 - 2022.7) / 2022.7 * 100 = -3.1% (exatamente como no mockup!)
      const summary = getPeriodSummary(baseTransactions, 'mes', '2026-11', refDate)
      expect(summary.totalExpenses).toBe(1960.0)
      expect(summary.prevTotalExpenses).toBe(2022.7)
      expect(summary.variationPct).toBe(-3.1)
    })

    it('deve retornar variationPct null quando não houver despesas no período anterior', () => {
      const onlyCurrentMonthTxs = baseTransactions.filter((t) => t.occurred_on.startsWith('2026-11'))
      const summary = getPeriodSummary(onlyCurrentMonthTxs, 'mes', '2026-11', refDate)
      expect(summary.totalExpenses).toBe(1960.0)
      expect(summary.prevTotalExpenses).toBeNull()
      expect(summary.variationPct).toBeNull()
    })

    it('deve retornar total zerado e variationPct null quando não houver dados no período', () => {
      const summary = getPeriodSummary([], 'mes', '2026-11', refDate)
      expect(summary.totalExpenses).toBe(0)
      expect(summary.prevTotalExpenses).toBeNull()
      expect(summary.variationPct).toBeNull()
    })
  })

  describe('getTopCategories', () => {
    it('deve identificar Alimentação como maior categoria com 32% (exato ao mockup)', () => {
      // Alimentação = 627.20 de 1960.00 = 32%
      const res = getTopCategories(baseTransactions, categories, 'mes', '2026-11', refDate)
      expect(res.topCategory).not.toBeNull()
      expect(res.topCategory?.name).toBe('Alimentação')
      expect(res.topCategory?.amount).toBe(627.2)
      expect(res.topCategory?.percentage).toBe(32)
      expect(res.categories.length).toBeGreaterThanOrEqual(1)
    })

    it('deve agrupar categorias excedentes em "Outras" quando houver mais de 4 categorias', () => {
      const manyCategoriesTxs: ExpenseItem[] = [
        { id: '1', amount: 500, type: 'expense', category_id: 'c1', occurred_on: '2026-11-01', description: '' },
        { id: '2', amount: 400, type: 'expense', category_id: 'c2', occurred_on: '2026-11-01', description: '' },
        { id: '3', amount: 300, type: 'expense', category_id: 'c3', occurred_on: '2026-11-01', description: '' },
        { id: '4', amount: 200, type: 'expense', category_id: 'c4', occurred_on: '2026-11-01', description: '' },
        { id: '5', amount: 100, type: 'expense', category_id: 'c5', occurred_on: '2026-11-01', description: '' },
        { id: '6', amount: 50, type: 'expense', category_id: 'c6', occurred_on: '2026-11-01', description: '' },
      ]

      const res = getTopCategories(manyCategoriesTxs, categories, 'mes', '2026-11', refDate)
      expect(res.categories).toHaveLength(5) // 4 principais + 1 "Outras"
      const outras = res.categories.find((c) => c.name === 'Outras')
      expect(outras).toBeDefined()
      expect(outras?.amount).toBe(150.0) // 100 + 50
    })

    it('deve retornar topCategory null quando não houver transações', () => {
      const res = getTopCategories([], categories, 'mes', '2026-11', refDate)
      expect(res.topCategory).toBeNull()
      expect(res.categories).toHaveLength(0)
    })
  })
})
