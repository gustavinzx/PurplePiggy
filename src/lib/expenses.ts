export type PeriodFilter = 'mes' | '3m' | '1a'

export interface ExpenseItem {
  id: string
  amount: number
  type: string
  category_id: string
  occurred_on: string
  description: string
  created_at?: string
  connection_id?: string | null
}

export interface CategoryInfo {
  id: string
  name: string
  slug?: string
  color?: string
}

export interface MonthlyBarItem {
  key: string // 'YYYY-MM'
  label: string // 'Jun', 'Nov'
  value: number
  isCurrent: boolean
  isSelected: boolean
}

export interface PeriodSummary {
  totalExpenses: number
  variationPct: number | null
  prevTotalExpenses: number | null
}

export interface CategorySlice {
  id: string
  name: string
  amount: number
  percentage: number
  color: string
}

export interface TopCategoryResult {
  topCategory: CategorySlice | null
  categories: CategorySlice[]
}

const MONTH_SHORT_NAMES = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
]

export const CATEGORY_COLORS = [
  '#7D2BD6', // 1. Roxo (Moradia)
  '#FF79A8', // 2. Rosa (Alimentação)
  '#F5B83D', // 3. Amarelo / Ouro (Transporte)
  '#60A5FA', // 4. Azul (Outros)
  '#CF91F6', // 5. Lilás
]

export function getCategoryChartColor(categoryNameOrSlug: string, index: number): string {
  const key = (categoryNameOrSlug || '').toLowerCase()
  if (key.includes('moradia') || key.includes('casa') || key.includes('aluguel') || key.includes('conta')) {
    return '#7D2BD6'
  }
  if (key.includes('alimenta') || key.includes('mercado') || key.includes('comida') || key.includes('restaurante')) {
    return '#FF79A8'
  }
  if (key.includes('transporte') || key.includes('uber') || key.includes('combust')) {
    return '#F5B83D'
  }
  if (key.includes('outro') || key.includes('lazer') || key.includes('saúde') || key.includes('saude')) {
    return '#60A5FA'
  }
  return CATEGORY_COLORS[index % CATEGORY_COLORS.length]
}

/**
 * 1. getMonthlySeries:
 * - 'mes': 6 barras (5 meses anteriores até o mês atual)
 * - '3m': 3 barras (2 meses anteriores até o mês atual)
 * - '1a': 12 barras (11 meses anteriores até o mês atual)
 */
export function getMonthlySeries(
  transactions: ExpenseItem[],
  period: PeriodFilter,
  referenceDate: Date = new Date(),
  selectedMonth?: string
): MonthlyBarItem[] {
  const count = period === '3m' ? 3 : period === '1a' ? 12 : 6
  const refYear = referenceDate.getFullYear()
  const refMonth = referenceDate.getMonth()

  // Se nenhum mês foi explicitamente selecionado, seleciona o mês de referência
  const activeMonthKey = selectedMonth || `${refYear}-${String(refMonth + 1).padStart(2, '0')}`

  const series: MonthlyBarItem[] = []

  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(refYear, refMonth - i, 1)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const key = `${year}-${month}`
    const label = MONTH_SHORT_NAMES[d.getMonth()]

    // Soma despesas do mês correspondente
    const monthExpenses = transactions
      .filter((t) => t.type === 'expense' && t.occurred_on.startsWith(key))
      .reduce((sum, t) => sum + Number(t.amount || 0), 0)

    series.push({
      key,
      label,
      value: Number(monthExpenses.toFixed(2)),
      isCurrent: i === 0,
      isSelected: key === activeMonthKey,
    })
  }

  return series
}

/**
 * Helper para obter a lista de meses correspondentes a um período ou mês selecionado
 */
function getPeriodMonthKeys(
  period: PeriodFilter,
  referenceDate: Date,
  selectedMonth?: string
): { currentKeys: string[]; prevKeys: string[] } {
  const refYear = referenceDate.getFullYear()
  const refMonth = referenceDate.getMonth()

  if (selectedMonth) {
    // Quando um mês individual está selecionado (por toque na barra ou modo mês)
    const [yStr, mStr] = selectedMonth.split('-')
    const selYear = Number(yStr)
    const selMonth = Number(mStr) - 1

    const prevDate = new Date(selYear, selMonth - 1, 1)
    const prevKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`
    return {
      currentKeys: [selectedMonth],
      prevKeys: [prevKey],
    }
  }

  if (period === '3m') {
    const currentKeys: string[] = []
    const prevKeys: string[] = []
    for (let i = 0; i < 3; i++) {
      const dCur = new Date(refYear, refMonth - i, 1)
      currentKeys.push(`${dCur.getFullYear()}-${String(dCur.getMonth() + 1).padStart(2, '0')}`)
      const dPrev = new Date(refYear, refMonth - 3 - i, 1)
      prevKeys.push(`${dPrev.getFullYear()}-${String(dPrev.getMonth() + 1).padStart(2, '0')}`)
    }
    return { currentKeys, prevKeys }
  }

  if (period === '1a') {
    const currentKeys: string[] = []
    const prevKeys: string[] = []
    for (let i = 0; i < 12; i++) {
      const dCur = new Date(refYear, refMonth - i, 1)
      currentKeys.push(`${dCur.getFullYear()}-${String(dCur.getMonth() + 1).padStart(2, '0')}`)
      const dPrev = new Date(refYear, refMonth - 12 - i, 1)
      prevKeys.push(`${dPrev.getFullYear()}-${String(dPrev.getMonth() + 1).padStart(2, '0')}`)
    }
    return { currentKeys, prevKeys }
  }

  // 'mes' default: mês atual
  const curKey = `${refYear}-${String(refMonth + 1).padStart(2, '0')}`
  const dPrev = new Date(refYear, refMonth - 1, 1)
  const prevKey = `${dPrev.getFullYear()}-${String(dPrev.getMonth() + 1).padStart(2, '0')}`
  return { currentKeys: [curKey], prevKeys: [prevKey] }
}

/**
 * 2. getPeriodSummary:
 * Calcula total de despesas e variação percentual contra o período anterior equivalente
 */
export function getPeriodSummary(
  transactions: ExpenseItem[],
  period: PeriodFilter,
  selectedMonth?: string,
  referenceDate: Date = new Date()
): PeriodSummary {
  const { currentKeys, prevKeys } = getPeriodMonthKeys(period, referenceDate, selectedMonth)

  // Despesas do período atual
  const totalExpenses = transactions
    .filter(
      (t) =>
        t.type === 'expense' &&
        currentKeys.some((k) => t.occurred_on.startsWith(k))
    )
    .reduce((sum, t) => sum + Number(t.amount || 0), 0)

  // Despesas do período anterior equivalente
  const prevExpenses = transactions
    .filter(
      (t) =>
        t.type === 'expense' &&
        prevKeys.some((k) => t.occurred_on.startsWith(k))
    )
    .reduce((sum, t) => sum + Number(t.amount || 0), 0)

  // Variação percentual: (atual - anterior) / anterior * 100
  let variationPct: number | null = null
  if (prevExpenses > 0) {
    variationPct = Number((((totalExpenses - prevExpenses) / prevExpenses) * 100).toFixed(1))
  }

  return {
    totalExpenses: Number(totalExpenses.toFixed(2)),
    variationPct,
    prevTotalExpenses: prevExpenses > 0 ? Number(prevExpenses.toFixed(2)) : null,
  }
}

/**
 * 3. getTopCategories:
 * Calcula maiores categorias de despesas no período selecionado e monta fatias para o gráfico de rosca
 */
export function getTopCategories(
  transactions: ExpenseItem[],
  categories: Record<string, CategoryInfo>,
  period: PeriodFilter,
  selectedMonth?: string,
  referenceDate: Date = new Date()
): TopCategoryResult {
  const { currentKeys } = getPeriodMonthKeys(period, referenceDate, selectedMonth)

  // Filtrar despesas do período
  const periodExpenses = transactions.filter(
    (t) =>
      t.type === 'expense' &&
      currentKeys.some((k) => t.occurred_on.startsWith(k))
  )

  const totalAmount = periodExpenses.reduce((sum, t) => sum + Number(t.amount || 0), 0)

  if (totalAmount <= 0) {
    return { topCategory: null, categories: [] }
  }

  // Agrupar por categoria
  const catSums: Record<string, number> = {}
  periodExpenses.forEach((t) => {
    catSums[t.category_id] = (catSums[t.category_id] || 0) + Number(t.amount || 0)
  })

  // Ordenar decrescente
  const sorted = Object.entries(catSums).sort((a, b) => b[1] - a[1])

  // Separar até 4 categorias principais + Outras (seguindo as cores do print 3: Moradia, Alimentação, Transporte, Outros)
  const topCategories = sorted.slice(0, 4)
  const rest = sorted.slice(4)

  const slices: CategorySlice[] = topCategories.map(([catId, amt], idx) => {
    const cat = categories[catId]
    const catName = cat?.name || 'Geral'
    const pct = Math.round((amt / totalAmount) * 100)
    return {
      id: catId,
      name: catName,
      amount: Number(amt.toFixed(2)),
      percentage: pct,
      color: getCategoryChartColor(cat?.slug || catName, idx),
    }
  })

  if (rest.length > 0) {
    const restTotal = rest.reduce((sum, [, amt]) => sum + amt, 0)
    const restPct = Math.max(1, 100 - slices.reduce((sum, s) => sum + s.percentage, 0))
    slices.push({
      id: 'outros',
      name: 'Outras',
      amount: Number(restTotal.toFixed(2)),
      percentage: restPct,
      color: '#60A5FA',
    })
  }

  return {
    topCategory: slices[0] || null,
    categories: slices,
  }
}
