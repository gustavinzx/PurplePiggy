export interface BudgetRecord {
  id: string
  category_id: string | null
  limit_amount: number
  month?: string
}

export interface GoalRecord {
  id: string
  name: string
  category: string
  saved_amount: number
  target_amount: number
  completed_at?: string | null
  deadline?: string | null
  created_at?: string
}

export interface ContributionRecord {
  goal_id: string
  amount: number
  kind: 'deposit' | 'withdrawal'
  occurred_on: string
}

export interface CategoryRecord {
  id: string
  name: string
  slug?: string
}

export interface AlertNotification {
  id: string
  type: 'budget_100' | 'budget_80' | 'goal_no_deposit' | 'goal_near_completion' | 'card_limit' | 'learning_daily'
  title: string
  message: string
  severity: 'danger' | 'warning' | 'info'
  categoryName?: string
  goalName?: string
  percentage?: number
  actionPath?: string
  actionLabel?: string
}

export interface AlertOptions {
  notifyBudget?: boolean
  notifyGoals?: boolean
  notifyLearning?: boolean
  cardAlertLimit?: number
  totalCardSpent?: number
  streakCount?: number
}

/**
 * Seletor puro para calcular notificações e alertas do app:
 * 1. Categoria em 100% ou mais do limite de orçamento (alerta vermelho/danger).
 * 2. Categoria em 80% ou mais do limite de orçamento (alerta amarelo/warning).
 * 3. Meta sem aporte no mês corrente (alerta informativo).
 * 4. Limite de alerta do cartão de crédito e lembretes de estudo (quando habilitados no Perfil).
 */
export function getAlerts(
  budgets: BudgetRecord[],
  expenses: Record<string, number> | { category_id: string; amount: number; occurred_on?: string; type?: string }[],
  goals: GoalRecord[],
  categories: Record<string, CategoryRecord> = {},
  contributions: ContributionRecord[] = [],
  currentMonth: string = new Date().toISOString().slice(0, 7),
  options: AlertOptions = {}
): AlertNotification[] {
  const alerts: AlertNotification[] = []
  const notifyBudget = options.notifyBudget ?? true
  const notifyGoals = options.notifyGoals ?? true
  const notifyLearning = options.notifyLearning ?? false

  // Normalizar gastos por categoria
  const expensesMap: Record<string, number> = {}
  if (Array.isArray(expenses)) {
    expenses.forEach((tx) => {
      if (!tx.type || tx.type === 'expense') {
        if (!tx.occurred_on || tx.occurred_on.startsWith(currentMonth)) {
          expensesMap[tx.category_id] = (expensesMap[tx.category_id] || 0) + Number(tx.amount || 0)
        }
      }
    })
  } else if (expenses && typeof expenses === 'object') {
    Object.entries(expenses).forEach(([catId, amt]) => {
      expensesMap[catId] = Number(amt || 0)
    })
  }

  // 1 & 2: Checagem de Orçamentos (80% e 100%)
  if (notifyBudget) {
    budgets.forEach((b) => {
      const limit = Number(b.limit_amount || 0)
      if (limit <= 0 || !b.category_id) return

      // Se o orçamento especifica mês, checar se coincide com o mês atual
      if (b.month && b.month !== currentMonth) return

      const spent = expensesMap[b.category_id] || 0
      const cat = categories[b.category_id]
      const catName = cat?.name || 'Categoria'
      const pct = Math.round((spent / limit) * 100)

      if (spent >= limit) {
        alerts.push({
          id: `budget-100-${b.id || b.category_id}`,
          type: 'budget_100',
          title: `Limite atingido: ${catName}`,
          message: `Você atingiu 100% do orçamento estipulado para ${catName}.`,
          severity: 'danger',
          categoryName: catName,
          percentage: pct,
          actionPath: '/orcamento',
          actionLabel: 'Ajustar orçamento',
        })
      } else if (spent >= limit * 0.8) {
        alerts.push({
          id: `budget-80-${b.id || b.category_id}`,
          type: 'budget_80',
          title: `Atenção ao limite: ${catName}`,
          message: `Você já consumiu ${pct}% do limite estipulado para ${catName}.`,
          severity: 'warning',
          categoryName: catName,
          percentage: pct,
          actionPath: '/orcamento',
          actionLabel: 'Ver orçamento',
        })
      }
    })

    // Checagem de alerta de gastos no cartão de crédito se configurado no Perfil
    if (options.cardAlertLimit && options.cardAlertLimit > 0 && (options.totalCardSpent || 0) >= options.cardAlertLimit * 0.8) {
      const cardSpent = Number(options.totalCardSpent || 0)
      const cardLimit = Number(options.cardAlertLimit)
      const pct = Math.round((cardSpent / cardLimit) * 100)
      alerts.push({
        id: `card-limit-${currentMonth}`,
        type: 'card_limit',
        title: cardSpent >= cardLimit ? 'Teto do cartão atingido' : 'Atenção aos gastos no cartão',
        message: `Seus gastos no cartão de crédito estão em ${pct}% do limite de alerta configurado (R$ ${cardLimit.toFixed(0)}).`,
        severity: cardSpent >= cardLimit ? 'danger' : 'warning',
        percentage: pct,
        actionPath: '/gastos',
        actionLabel: 'Ver lançamentos',
      })
    }
  }

  // 3: Metas sem aporte neste mês
  if (notifyGoals) {
    const activeGoals = goals.filter((g) => !g.completed_at)

    activeGoals.forEach((g) => {
      const hasDepositThisMonth = contributions.some((c) => {
        return (
          c.goal_id === g.id &&
          (c.kind === 'deposit' || Number(c.amount) > 0) &&
          c.occurred_on.startsWith(currentMonth)
        )
      })

      if (!hasDepositThisMonth) {
        alerts.push({
          id: `goal-no-deposit-${g.id}`,
          type: 'goal_no_deposit',
          title: `Meta sem aporte: ${g.name}`,
          message: `Você ainda não guardou dinheiro para a meta "${g.name}" este mês. Que tal poupar hoje?`,
          severity: 'info',
          goalName: g.name,
          actionPath: '/metas',
          actionLabel: 'Guardar agora',
        })
      }
    })
  }

  // 4: Lembrete de Educação Financeira / Ofensiva Diária
  if (notifyLearning) {
    const streak = options.streakCount ?? 0
    alerts.push({
      id: `learning-daily-${currentMonth}`,
      type: 'learning_daily',
      title: streak > 0 ? `Mantenha sua ofensiva de ${streak} dias!` : 'Missão diária disponível!',
      message: 'Pratique 1 lição rápida hoje na trilha de aprendizado para ganhar +XP e evoluir seu nível.',
      severity: 'info',
      actionPath: '/aprender',
      actionLabel: 'Ir para Aprender',
    })
  }

  return alerts
}

/**
 * Seletor puro para a meta em destaque na tela de Início (Prompt 1f):
 * "a primeira que NÃO seja a reserva de emergência, por prazo e depois por maior progresso;
 * se só existir a reserva, não mostre a seção."
 */
export function getFeaturedGoal<T extends GoalRecord>(goals: T[]): T | null {
  if (!goals || goals.length === 0) return null

  const nonEmergencyGoals = goals.filter((g) => {
    const isEmergency =
      g.category === 'emergency' ||
      g.name.toLowerCase().includes('reserva de emergência') ||
      g.name.toLowerCase().includes('reserva de emergencia')
    return !isEmergency && !g.completed_at
  })

  if (nonEmergencyGoals.length === 0) {
    return null
  }

  const sorted = [...nonEmergencyGoals].sort((a, b) => {
    const deadA = a.deadline ? new Date(a.deadline).getTime() : Infinity
    const deadB = b.deadline ? new Date(b.deadline).getTime() : Infinity

    if (deadA !== deadB) {
      return deadA - deadB
    }

    const pctA = a.target_amount > 0 ? a.saved_amount / a.target_amount : 0
    const pctB = b.target_amount > 0 ? b.saved_amount / b.target_amount : 0
    return pctB - pctA
  })

  return sorted[0] || null
}
