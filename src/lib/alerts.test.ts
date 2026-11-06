import { describe, it, expect } from 'vitest'
import { getAlerts, getFeaturedGoal, BudgetRecord, GoalRecord, ContributionRecord } from './alerts'

describe('getAlerts - Seletor Puro de Alertas e Notificações', () => {
  const categories = {
    cat1: { id: 'cat1', name: 'Alimentação' },
    cat2: { id: 'cat2', name: 'Lazer' },
    cat3: { id: 'cat3', name: 'Transporte' },
  }

  const budgets: BudgetRecord[] = [
    { id: 'b1', category_id: 'cat1', limit_amount: 1000, month: '2026-11' },
    { id: 'b2', category_id: 'cat2', limit_amount: 500, month: '2026-11' },
    { id: 'b3', category_id: 'cat3', limit_amount: 300, month: '2026-11' },
  ]

  const goals: GoalRecord[] = [
    {
      id: 'g1',
      name: 'Reserva de emergência',
      category: 'emergency',
      saved_amount: 6000,
      target_amount: 10000,
    },
    {
      id: 'g2',
      name: 'Viagem dos sonhos',
      category: 'travel',
      saved_amount: 1750,
      target_amount: 5000,
    },
    {
      id: 'g3',
      name: 'Novo notebook',
      category: 'purchase',
      saved_amount: 800,
      target_amount: 4000,
    },
  ]

  it('deve gerar alerta de 100% quando os gastos atingirem ou superarem o limite', () => {
    const expenses = { cat1: 1050 } // > 1000
    const alerts = getAlerts(budgets, expenses, [], categories, [], '2026-11')

    const alert100 = alerts.find((a) => a.type === 'budget_100')
    expect(alert100).toBeDefined()
    expect(alert100?.severity).toBe('danger')
    expect(alert100?.message).toContain('100% do orçamento')
    expect(alert100?.title).toContain('Alimentação')
  })

  it('deve gerar alerta de 80% quando os gastos estiverem entre 80% e 99%', () => {
    const expenses = { cat2: 420 } // 420 / 500 = 84%
    const alerts = getAlerts(budgets, expenses, [], categories, [], '2026-11')

    const alert80 = alerts.find((a) => a.type === 'budget_80')
    expect(alert80).toBeDefined()
    expect(alert80?.severity).toBe('warning')
    expect(alert80?.message).toContain('84% do limite')
    expect(alert80?.title).toContain('Lazer')
  })

  it('não deve gerar alerta de orçamento quando gastos estiverem abaixo de 80%', () => {
    const expenses = { cat3: 200 } // 200 / 300 = 66%
    const alerts = getAlerts(budgets, expenses, [], categories, [], '2026-11')

    const budgetAlerts = alerts.filter((a) => a.type.startsWith('budget_'))
    expect(budgetAlerts).toHaveLength(0)
  })

  it('deve alertar sobre metas que não tiveram nenhum aporte no mês corrente', () => {
    const contributions: ContributionRecord[] = [
      {
        goal_id: 'g2',
        amount: 200,
        kind: 'deposit',
        occurred_on: '2026-11-02',
      },
    ]

    const alerts = getAlerts([], {}, goals, categories, contributions, '2026-11')

    // g2 teve aporte em 2026-11, então não deve ter alerta
    const g2Alert = alerts.find((a) => a.id === 'goal-no-deposit-g2')
    expect(g2Alert).toBeUndefined()

    // g3 e g1 não tiveram aporte em 2026-11, então devem ter alerta
    const g3Alert = alerts.find((a) => a.id === 'goal-no-deposit-g3')
    expect(g3Alert).toBeDefined()
    expect(g3Alert?.title).toContain('Novo notebook')
    expect(g3Alert?.severity).toBe('info')
  })

  it('deve retornar lista vazia quando tudo estiver dentro dos limites e com aportes', () => {
    const contributions: ContributionRecord[] = [
      { goal_id: 'g1', amount: 100, kind: 'deposit', occurred_on: '2026-11-01' },
      { goal_id: 'g2', amount: 100, kind: 'deposit', occurred_on: '2026-11-01' },
      { goal_id: 'g3', amount: 100, kind: 'deposit', occurred_on: '2026-11-01' },
    ]
    const expenses = { cat1: 100, cat2: 50, cat3: 20 }
    const alerts = getAlerts(budgets, expenses, goals, categories, contributions, '2026-11')

    expect(alerts).toHaveLength(0)
  })
})

describe('getFeaturedGoal - Seletor Puro de Meta em Destaque', () => {
  it('deve retornar null se a lista estiver vazia', () => {
    expect(getFeaturedGoal([])).toBeNull()
  })

  it('deve retornar null se só existir a reserva de emergência', () => {
    const goals: GoalRecord[] = [
      {
        id: 'g1',
        name: 'Reserva de emergência',
        category: 'emergency',
        saved_amount: 6000,
        target_amount: 10000,
      },
    ]
    expect(getFeaturedGoal(goals)).toBeNull()
  })

  it('deve selecionar a primeira meta que não seja reserva, ordenando por prazo mais próximo', () => {
    const goals: GoalRecord[] = [
      {
        id: 'g-reserva',
        name: 'Reserva de emergência',
        category: 'emergency',
        saved_amount: 6000,
        target_amount: 10000,
      },
      {
        id: 'g-viagem',
        name: 'Viagem dos sonhos',
        category: 'travel',
        saved_amount: 1750,
        target_amount: 5000,
        deadline: '2026-12-31',
      },
      {
        id: 'g-notebook',
        name: 'Novo notebook',
        category: 'purchase',
        saved_amount: 3000,
        target_amount: 4000,
        deadline: '2027-06-30',
      },
    ]

    const featured = getFeaturedGoal(goals)
    expect(featured).not.toBeNull()
    expect(featured?.id).toBe('g-viagem') // prazo mais próximo (dez/2026 vs jun/2027)
  })

  it('deve desempata por maior progresso quando os prazos forem iguais', () => {
    const goals: GoalRecord[] = [
      {
        id: 'g-viagem',
        name: 'Viagem dos sonhos',
        category: 'travel',
        saved_amount: 1000,
        target_amount: 5000, // 20%
        deadline: '2026-12-31',
      },
      {
        id: 'g-notebook',
        name: 'Novo notebook',
        category: 'purchase',
        saved_amount: 3200,
        target_amount: 4000, // 80%
        deadline: '2026-12-31',
      },
    ]

    const featured = getFeaturedGoal(goals)
    expect(featured?.id).toBe('g-notebook') // 80% > 20%
  })
})
