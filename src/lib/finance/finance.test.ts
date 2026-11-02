import { describe, it, expect } from 'vitest'
import {
  calculateAvailableBalance,
  calculateMonthlySummary,
  getBudgetAlertStatus,
  generateInitialBudget,
  suggestCategoryLimits,
  calculateGoalMetrics,
  getEmergencyFundSteps,
  simulatePurchase,
  evaluateFinancialDiagnosis,
  TransactionItem,
} from './index'

describe('Regras Financeiras do PurplePiggy', () => {
  it('8.1 Deve calcular o saldo disponível somando saldo inicial, receitas e subtraindo despesas', () => {
    const initialBalance = 1000
    const transactions: TransactionItem[] = [
      { type: 'income', amount: 3200, occurred_on: '2026-11-01' },
      { type: 'expense', amount: 900, occurred_on: '2026-11-02' },
      { type: 'expense', amount: 240, occurred_on: '2026-11-02' },
    ]
    const balance = calculateAvailableBalance(initialBalance, transactions)
    expect(balance).toBe(3060)
  })

  it('8.2 Deve calcular o resumo do mês e a variação em relação ao mês anterior', () => {
    const transactions: TransactionItem[] = [
      // Mês anterior (outubro/2026)
      { type: 'income', amount: 3000, occurred_on: '2026-10-05' },
      { type: 'expense', amount: 2000, occurred_on: '2026-10-10' }, // Resultado: 1000
      // Mês atual (novembro/2026)
      { type: 'income', amount: 3200, occurred_on: '2026-11-05' },
      { type: 'expense', amount: 1960, occurred_on: '2026-11-10' }, // Resultado: 1240
    ]
    const summary = calculateMonthlySummary(transactions, new Date('2026-11-15T12:00:00'))
    expect(summary.income).toBe(3200)
    expect(summary.expense).toBe(1960)
    expect(summary.net).toBe(1240)
    expect(summary.prevIncome).toBe(3000)
    expect(summary.prevExpense).toBe(2000)
    // Variação do resultado: (1240 - 1000) / 1000 = +24.0%
    expect(summary.variationPct).toBe(24.0)
    // Variação de despesas: (1960 - 2000) / 2000 = -2.0%
    expect(summary.expenseVariationPct).toBe(-2.0)
  })

  it('8.3 Deve classificar o alerta de orçamento em normal, warning (>=80%) e danger (>=100%)', () => {
    expect(getBudgetAlertStatus(500, 1000).status).toBe('normal')
    expect(getBudgetAlertStatus(800, 1000).status).toBe('warning')
    expect(getBudgetAlertStatus(850, 1000).status).toBe('warning')
    expect(getBudgetAlertStatus(1000, 1000).status).toBe('danger')
    expect(getBudgetAlertStatus(1200, 1000).status).toBe('danger')
  })

  it('8.4 Deve gerar orçamento inicial pós-diagnóstico dividindo gastos essenciais corretamente', () => {
    const budget = generateInitialBudget(3000, 2000)
    expect(budget.totalBudget).toBe(3000)
    expect(budget.categories.moradia).toBe(800) // 40%
    expect(budget.categories.alimentacao).toBe(600) // 30%
    expect(budget.categories.transporte).toBe(300) // 15%
    expect(budget.categories.saude).toBe(200) // 10%
    expect(budget.categories.familia).toBe(100) // 5%
  })

  it('8.4 Deve sugerir limites com base na média dos últimos meses * 1.10 arredondados para cima ao múltiplo de 10', () => {
    const history = [
      { categoryId: 'cat-alim', amount: 500, month: '2026-08' },
      { categoryId: 'cat-alim', amount: 600, month: '2026-09' },
      { categoryId: 'cat-alim', amount: 550, month: '2026-10' },
    ]
    // Média = 550. Com 1.10 = 605. Arredondado para cima ao múltiplo de 10 = 610.
    const suggestion = suggestCategoryLimits(history, 3000)
    expect(suggestion.limits['cat-alim']).toBe(610)
    expect(suggestion.totalSuggested).toBe(610)
    expect(suggestion.exceedsIncome).toBe(false)
  })

  it('8.5 Deve calcular métricas e previsões de metas', () => {
    const goal = {
      id: 'g-1',
      name: 'Viagem',
      category: 'travel',
      target_amount: 5000,
      saved_amount: 2000,
      deadline: '2027-05-01',
    }
    const contributions = [
      { goal_id: 'g-1', amount: 500, kind: 'deposit' as const, occurred_on: '2026-10-01' },
      { goal_id: 'g-1', amount: 500, kind: 'deposit' as const, occurred_on: '2026-11-01' },
    ]
    const metrics = calculateGoalMetrics(goal, contributions)
    expect(metrics.saved).toBe(2000)
    expect(metrics.remaining).toBe(3000)
    expect(metrics.progressPct).toBe(40)
    expect(metrics.isCompleted).toBe(false)
    expect(metrics.monthlyRequired).toBeGreaterThan(0)
    expect(metrics.estimatedCompletionDate).not.toBeNull()
  })

  it('8.5 Deve gerar degraus graduais para reserva de emergência', () => {
    const steps = getEmergencyFundSteps(2000)
    expect(steps.step1Week).toBe(500)
    expect(steps.step1Month).toBe(2000)
    expect(steps.step3Months).toBe(6000)
    expect(steps.step6Months).toBe(12000)
  })

  it('8.6 Deve calcular simulador de compras com e sem juros e respeitar saldo zero/negativo', () => {
    // Sem juros à vista
    const simCash = simulatePurchase({
      purchaseAmount: 500,
      availableBalance: 2500,
      totalMonthlyBudget: 3000,
    })
    expect(simCash.pctOfAvailableBalance).toBe(20.0)
    expect(simCash.totalPaid).toBe(500)
    expect(simCash.futureValue12m).toBeGreaterThan(500)

    // Parcelado com juros (ex: 2% a.m., 10x)
    const simCredit = simulatePurchase({
      purchaseAmount: 1000,
      installments: 10,
      monthlyInterestRate: 0.02,
      availableBalance: 2000,
      totalMonthlyBudget: 3000,
    })
    expect(simCredit.monthlyInstallment).toBeGreaterThan(100)
    expect(simCredit.totalPaid).toBeGreaterThan(1000)
    expect(simCredit.totalInterest).toBeGreaterThan(0)

    // Saldo zero ou negativo sem crash
    const simNegative = simulatePurchase({
      purchaseAmount: 300,
      availableBalance: 0,
      totalMonthlyBudget: 2000,
    })
    expect(simNegative.pctOfAvailableBalance).toBeNull()
    expect(simNegative.balanceStatusText).toContain('zerado')
  })

  it('8.7 Deve avaliar o comprometimento essencial do diagnóstico sem julgamento', () => {
    const low = evaluateFinancialDiagnosis(3000, 1500) // 50%
    expect(low.level).toBe('healthy')
    expect(low.message).toContain('cabem bem na renda')

    const mid = evaluateFinancialDiagnosis(3000, 2100) // 70%
    expect(mid.level).toBe('moderate')
    expect(mid.message).toContain('ocupam boa parte da renda')

    const high = evaluateFinancialDiagnosis(3000, 2700) // 90%
    expect(high.level).toBe('high')
    expect(high.message).toContain('ocupam quase toda a renda')
  })
})
