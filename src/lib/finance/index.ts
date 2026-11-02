/**
 * Módulo de Regras de Negócio e Cálculos Financeiros do PurplePiggy.
 * Todas as funções são puras e 100% testáveis.
 */

export interface TransactionItem {
  id?: string
  type: 'income' | 'expense'
  amount: number
  occurred_on: string
  category_id?: string
  payment_method?: string
}

export interface CategoryItem {
  id: string
  slug: string
  name: string
  is_essential?: boolean
}

export interface BudgetLimitItem {
  category_id: string | null
  limit_amount: number
}

export interface GoalItem {
  id: string
  name: string
  category: string
  target_amount: number
  saved_amount: number
  deadline?: string | null
}

export interface GoalContributionItem {
  goal_id: string
  amount: number
  kind: 'deposit' | 'withdrawal'
  occurred_on: string
}

/**
 * 8.1 Saldo disponível
 * Saldo inicial + total de receitas históricas - total de despesas históricas
 */
export function calculateAvailableBalance(
  initialBalance: number,
  transactions: TransactionItem[]
): number {
  const net = transactions.reduce((acc, t) => {
    return t.type === 'income' ? acc + Number(t.amount) : acc - Number(t.amount)
  }, 0)
  return Number((initialBalance + net).toFixed(2))
}

/**
 * 8.2 Resumo do mês e comparações com mês anterior
 */
export function calculateMonthlySummary(
  transactions: TransactionItem[],
  currentMonthDate: Date
) {
  const curYear = currentMonthDate.getFullYear()
  const curMonth = currentMonthDate.getMonth()

  const prevMonthDate = new Date(curYear, curMonth - 1, 1)
  const prevYear = prevMonthDate.getFullYear()
  const prevMonth = prevMonthDate.getMonth()

  let currentIncome = 0
  let currentExpense = 0
  let prevIncome = 0
  let prevExpense = 0

  for (const t of transactions) {
    const tDate = new Date(t.occurred_on + 'T00:00:00')
    const tYear = tDate.getFullYear()
    const tM = tDate.getMonth()

    if (tYear === curYear && tM === curMonth) {
      if (t.type === 'income') currentIncome += Number(t.amount)
      else currentExpense += Number(t.amount)
    } else if (tYear === prevYear && tM === prevMonth) {
      if (t.type === 'income') prevIncome += Number(t.amount)
      else prevExpense += Number(t.amount)
    }
  }

  const currentNet = currentIncome - currentExpense
  const prevNet = prevIncome - prevExpense

  // Variação do saldo: (resultado mês - resultado mês anterior) / |resultado mês anterior|
  let variationPct: number | null = null
  if (prevNet !== 0) {
    variationPct = Number((((currentNet - prevNet) / Math.abs(prevNet)) * 100).toFixed(1))
  }

  // Variação das despesas: (despesas atuais - despesas anteriores) / despesas anteriores
  let expenseVariationPct: number | null = null
  if (prevExpense > 0) {
    expenseVariationPct = Number((((currentExpense - prevExpense) / prevExpense) * 100).toFixed(1))
  }

  return {
    income: Number(currentIncome.toFixed(2)),
    expense: Number(currentExpense.toFixed(2)),
    net: Number(currentNet.toFixed(2)),
    variationPct,
    prevIncome: Number(prevIncome.toFixed(2)),
    prevExpense: Number(prevExpense.toFixed(2)),
    expenseVariationPct,
  }
}

/**
 * 8.3 Alertas e status de orçamento
 * ratio = gasto / limite
 * ratio >= 1.0 -> limite excedido (rosa)
 * ratio >= 0.8 -> atenção (dourado)
 * normal -> roxo
 */
export function getBudgetAlertStatus(spent: number, limit: number): {
  ratio: number
  status: 'normal' | 'warning' | 'danger'
  percent: number
  isOverLimit: boolean
  isNearLimit: boolean
} {
  if (limit <= 0) {
    return { ratio: 0, status: 'normal', percent: 0, isOverLimit: false, isNearLimit: false }
  }
  const ratio = spent / limit
  const percent = Math.min(Math.round(ratio * 100), 100)

  if (ratio >= 1.0) {
    return { ratio, status: 'danger', percent, isOverLimit: true, isNearLimit: false }
  }
  if (ratio >= 0.8) {
    return { ratio, status: 'warning', percent, isNearLimit: true, isOverLimit: false }
  }
  return { ratio, status: 'normal', percent, isOverLimit: false, isNearLimit: false }
}

/**
 * 8.4 Orçamento inicial pós-diagnóstico
 * Divide gastos essenciais: Moradia 40%, Alimentação 30%, Transporte 15%, Saúde 10%, Família 5%
 */
export function generateInitialBudget(
  monthlyIncome: number,
  essentialExpenses: number
) {
  return {
    totalBudget: monthlyIncome,
    categories: {
      moradia: Number((essentialExpenses * 0.40).toFixed(2)),
      alimentacao: Number((essentialExpenses * 0.30).toFixed(2)),
      transporte: Number((essentialExpenses * 0.15).toFixed(2)),
      saude: Number((essentialExpenses * 0.10).toFixed(2)),
      familia: Number((essentialExpenses * 0.05).toFixed(2)),
    },
  }
}

/**
 * 8.4 Sugestão de limites baseada nos gastos históricos reais
 * Média dos últimos até 3 meses completos * 1.10, arredondada para cima ao múltiplo de R$ 10.
 */
export function suggestCategoryLimits(
  categoryTransactions: { categoryId: string; amount: number; month: string }[],
  monthlyIncome: number
): { limits: Record<string, number>; totalSuggested: number; exceedsIncome: boolean } {
  // Agrupar por categoria e por mês
  const map: Record<string, Record<string, number>> = {}
  for (const item of categoryTransactions) {
    if (!map[item.categoryId]) map[item.categoryId] = {}
    map[item.categoryId][item.month] = (map[item.categoryId][item.month] || 0) + item.amount
  }

  const limits: Record<string, number> = {}
  let totalSuggested = 0

  for (const [catId, monthsMap] of Object.entries(map)) {
    const monthlyValues = Object.values(monthsMap)
    if (monthlyValues.length === 0) continue

    const sum = monthlyValues.reduce((a, b) => a + b, 0)
    const avg = sum / monthlyValues.length
    const withBuffer = avg * 1.10
    // Arredondar para cima ao múltiplo de R$ 10
    const rounded = Math.ceil(withBuffer / 10) * 10
    limits[catId] = rounded
    totalSuggested += rounded
  }

  return {
    limits,
    totalSuggested,
    exceedsIncome: totalSuggested > monthlyIncome,
  }
}

/**
 * 8.5 Metas e Previsão
 */
export function calculateGoalMetrics(
  goal: GoalItem,
  contributions: GoalContributionItem[] = []
) {
  const saved = Number(goal.saved_amount)
  const target = Number(goal.target_amount)
  const remaining = Math.max(0, target - saved)
  const progressRatio = target > 0 ? Math.min(saved / target, 1) : 0
  const progressPct = Math.round(progressRatio * 100)

  // Meses restantes até o prazo
  let monthsUntilDeadline: number | null = null
  let monthlyRequired: number | null = null

  if (goal.deadline) {
    const deadlineDate = new Date(goal.deadline + 'T00:00:00')
    const now = new Date()
    const diffMonths =
      (deadlineDate.getFullYear() - now.getFullYear()) * 12 +
      (deadlineDate.getMonth() - now.getMonth())
    monthsUntilDeadline = Math.max(1, diffMonths)
    monthlyRequired = Number((remaining / monthsUntilDeadline).toFixed(2))
  }

  // Previsão baseada na média de aportes dos últimos 3 meses
  let estimatedCompletionDate: string | null = null
  const deposits = contributions.filter(c => c.kind === 'deposit')
  if (deposits.length > 0 && remaining > 0) {
    const totalDeposited = deposits.reduce((acc, c) => acc + Number(c.amount), 0)
    // média simples por aporte ou mês
    const avgMonthlyDeposit = totalDeposited / Math.min(deposits.length, 3)
    if (avgMonthlyDeposit > 0) {
      const monthsNeeded = Math.ceil(remaining / avgMonthlyDeposit)
      const forecast = new Date()
      forecast.setMonth(forecast.getMonth() + monthsNeeded)
      estimatedCompletionDate = forecast.toISOString().split('T')[0]
    }
  }

  return {
    saved,
    target,
    remaining: Number(remaining.toFixed(2)),
    progressPct,
    monthlyRequired,
    monthsUntilDeadline,
    estimatedCompletionDate,
    isCompleted: saved >= target,
  }
}

/**
 * 8.5 Degraus para reserva de emergência
 */
export function getEmergencyFundSteps(essentialExpensesMonthly: number) {
  return {
    step1Week: Number((essentialExpensesMonthly / 4).toFixed(2)),
    step1Month: Number(essentialExpensesMonthly.toFixed(2)),
    step3Months: Number((essentialExpensesMonthly * 3).toFixed(2)),
    step6Months: Number((essentialExpensesMonthly * 6).toFixed(2)),
  }
}

/**
 * 8.6 Simulador de compras
 */
export interface PurchaseSimulationInput {
  purchaseAmount: number
  installments?: number
  monthlyInterestRate?: number // Ex: 0.02 para 2% a.m.
  availableBalance: number
  totalMonthlyBudget: number
  categorySpent?: number
  categoryBudgetLimit?: number
}

export function simulatePurchase(input: PurchaseSimulationInput) {
  const {
    purchaseAmount,
    installments = 1,
    monthlyInterestRate = 0,
    availableBalance,
    totalMonthlyBudget,
  } = input

  // Impacto no saldo disponível
  let pctOfAvailableBalance: number | null = null
  let balanceStatusText: string = ''

  if (availableBalance > 0) {
    pctOfAvailableBalance = Number(((purchaseAmount / availableBalance) * 100).toFixed(1))
    balanceStatusText = `${pctOfAvailableBalance}% do saldo disponível`
  } else {
    balanceStatusText = 'Saldo disponível zerado ou negativo'
  }

  // Cálculo de parcelas
  let monthlyInstallment = purchaseAmount
  let totalPaid = purchaseAmount
  let totalInterest = 0

  if (installments > 1) {
    if (monthlyInterestRate > 0) {
      // Fórmula de amortização Price: PMT = PV * i / (1 - (1+i)^(-n))
      const i = monthlyInterestRate
      const n = installments
      monthlyInstallment = (purchaseAmount * i) / (1 - Math.pow(1 + i, -n))
      totalPaid = monthlyInstallment * n
      totalInterest = totalPaid - purchaseAmount
    } else {
      monthlyInstallment = purchaseAmount / installments
      totalPaid = purchaseAmount
      totalInterest = 0
    }
  }

  // Impacto no orçamento mensal
  let pctOfMonthlyBudget: number | null = null
  if (totalMonthlyBudget > 0) {
    pctOfMonthlyBudget = Number(((monthlyInstallment / totalMonthlyBudget) * 100).toFixed(1))
  }

  // Simulação ilustrativa de economia (12 meses com taxa fixa ilustrativa de 0.8% a.m.)
  const illustrativeRate = 0.008
  const futureValue12m = Number((purchaseAmount * Math.pow(1 + illustrativeRate, 12)).toFixed(2))

  return {
    purchaseAmount,
    installments,
    monthlyInstallment: Number(monthlyInstallment.toFixed(2)),
    totalPaid: Number(totalPaid.toFixed(2)),
    totalInterest: Number(totalInterest.toFixed(2)),
    pctOfAvailableBalance,
    balanceStatusText,
    pctOfMonthlyBudget,
    futureValue12m,
    disclaimer: 'Simulação simples e ilustrativa. Não é recomendação de investimento.',
  }
}

/**
 * 8.7 Diagnóstico financeiro -> Comprometimento e mensagem
 */
export function evaluateFinancialDiagnosis(
  income: number,
  essentialExpenses: number
) {
  if (income <= 0) {
    return {
      ratioPct: 100,
      level: 'high' as const,
      message: 'Seus essenciais ocupam quase toda a renda. Vamos olhar com carinho onde dá para respirar e proteger o que importa.',
    }
  }

  const ratio = (essentialExpenses / income) * 100
  const ratioPct = Number(ratio.toFixed(1))

  if (ratio <= 60) {
    return {
      ratioPct,
      level: 'healthy' as const,
      message: 'Seus gastos essenciais cabem bem na renda. Dá para começar a guardar aos poucos.',
    }
  } else if (ratio <= 85) {
    return {
      ratioPct,
      level: 'moderate' as const,
      message: 'Seus essenciais ocupam boa parte da renda, e isso é comum. Vamos organizar isso juntas, um passo de cada vez.',
    }
  } else {
    return {
      ratioPct,
      level: 'high' as const,
      message: 'Seus essenciais ocupam quase toda a renda. Vamos olhar com carinho onde dá para respirar e proteger o que importa.',
    }
  }
}
