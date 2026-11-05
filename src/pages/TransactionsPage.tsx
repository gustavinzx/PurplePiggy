import React, { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { AppShell } from '../components/AppShell'
import { Mascot } from '../components/Mascot'
import { Card } from '../components/Card'
import { CategoryCircle } from '../components/CategoryIcon'
import { BackgroundBlobs } from '../components/BackgroundBlobs'
import { TransactionModal } from '../components/TransactionModal'
import {
  getMonthlySeries,
  getPeriodSummary,
  getTopCategories,
  PeriodFilter,
  ExpenseItem,
  MonthlyBarItem,
} from '../lib/expenses'
import { formatCurrency } from '../lib/format'
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  ChevronRight,
  ArrowDown,
  ArrowUp,
  Plus,
  Search,
  X,
  Filter,
} from 'lucide-react'
import type { Database } from '../types/database.types'

type Transaction = Database['public']['Tables']['transactions']['Row']
type Category = Database['public']['Tables']['categories']['Row']

export const TransactionsPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  // 1. Estado de período sincronizado com a URL (?periodo=mes|3m|1a)
  const periodParam = (searchParams.get('periodo') as PeriodFilter) || 'mes'
  const validPeriod: PeriodFilter = ['mes', '3m', '1a'].includes(periodParam) ? periodParam : 'mes'

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Record<string, Category>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Mês selecionado no gráfico (ou null para usar o mês atual)
  const [selectedMonth, setSelectedMonth] = useState<string | undefined>(undefined)

  // Modais
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false)
  const [isAllTransactionsOpen, setIsAllTransactionsOpen] = useState(false)

  // Filtros internos da modal "Ver todas"
  const [allSearchTerm, setAllSearchTerm] = useState('')
  const [allCategoryFilter, setAllCategoryFilter] = useState('all')
  const [allSortOrder, setAllSortOrder] = useState<'recent' | 'amount_desc' | 'amount_asc'>('recent')

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const { data: cats, error: errCats } = await supabase.from('categories').select('*')
      if (errCats) throw errCats
      const catMap: Record<string, Category> = {}
      cats?.forEach((c) => {
        catMap[c.id] = c
      })
      setCategories(catMap)

      const { data: txs, error: errTxs } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('occurred_on', { ascending: false })
      if (errTxs) throw errTxs
      setTransactions(txs || [])
    } catch (err: any) {
      console.error('Erro ao carregar despesas:', err)
      setError(err.message || 'Falha ao carregar despesas.')
    } finally {
      setLoading(false)
    }
  }

  const setPeriod = (newPeriod: PeriodFilter) => {
    setSelectedMonth(undefined) // reseta seleção de barra ao trocar período
    setSearchParams({ periodo: newPeriod })
  }

  // Despesas puras
  const expenseTransactions: ExpenseItem[] = useMemo(() => {
    return transactions.filter((t) => t.type === 'expense') as ExpenseItem[]
  }, [transactions])

  // Séries mensais para o gráfico de barras
  const monthlySeries: MonthlyBarItem[] = useMemo(() => {
    return getMonthlySeries(expenseTransactions, validPeriod, new Date(), selectedMonth)
  }, [expenseTransactions, validPeriod, selectedMonth])

  // Mês ativo
  const activeMonthKey = selectedMonth || (monthlySeries.length > 0 ? monthlySeries[monthlySeries.length - 1].key : undefined)

  // Resumo do período (total e variação)
  const summary = useMemo(() => {
    return getPeriodSummary(expenseTransactions, validPeriod, activeMonthKey, new Date())
  }, [expenseTransactions, validPeriod, activeMonthKey])

  // Maiores categorias e dados do gráfico de rosca
  const topCategoriesResult = useMemo(() => {
    return getTopCategories(expenseTransactions, categories, validPeriod, activeMonthKey, new Date())
  }, [expenseTransactions, categories, validPeriod, activeMonthKey])

  // Despesas do período ativo para a seção "Transações recentes" (apenas despesas!)
  const periodExpenses = useMemo(() => {
    if (!activeMonthKey) return []
    return expenseTransactions
      .filter((t) => t.occurred_on.startsWith(activeMonthKey))
      .sort((a, b) => new Date(b.occurred_on).getTime() - new Date(a.occurred_on).getTime())
  }, [expenseTransactions, activeMonthKey])

  // As 3 despesas mais recentes para exibição imediata
  const recentExpenses = periodExpenses.slice(0, 3)

  // Despesas filtradas para a modal "Ver todas"
  const allFilteredExpenses = useMemo(() => {
    return periodExpenses.filter((tx) => {
      if (allCategoryFilter !== 'all' && tx.category_id !== allCategoryFilter) {
        return false
      }
      if (allSearchTerm.trim() !== '') {
        const term = allSearchTerm.toLowerCase()
        const descMatch = tx.description.toLowerCase().includes(term)
        const catName = categories[tx.category_id]?.name.toLowerCase() || ''
        if (!descMatch && !catName.includes(term)) return false
      }
      return true
    }).sort((a, b) => {
      if (allSortOrder === 'amount_desc') return Number(b.amount) - Number(a.amount)
      if (allSortOrder === 'amount_asc') return Number(a.amount) - Number(b.amount)
      return new Date(b.occurred_on).getTime() - new Date(a.occurred_on).getTime()
    })
  }, [periodExpenses, allCategoryFilter, allSearchTerm, allSortOrder, categories])

  // Formatação de data contextual
  const formatTransactionDate = (dateStr: string, catName: string) => {
    const today = new Date().toISOString().slice(0, 10)
    const yesterdayDate = new Date()
    yesterdayDate.setDate(yesterdayDate.getDate() - 1)
    const yesterday = yesterdayDate.toISOString().slice(0, 10)

    let prefix = ''
    if (dateStr === today) {
      prefix = 'Hoje'
    } else if (dateStr === yesterday) {
      prefix = 'Ontem'
    } else {
      const parts = dateStr.split('-')
      prefix = parts.length === 3 ? `${parts[2]}/${parts[1]}` : dateStr
    }
    return `${prefix} • ${catName}`
  }

  // Dimensionamento do gráfico de barras (altura máxima)
  const maxBarValue = Math.max(...monthlySeries.map((s) => s.value), 1)

  // Gráfico de rosca SVG (Donut Chart)
  const donutSlices = useMemo(() => {
    const total = topCategoriesResult.categories.reduce((acc, c) => acc + c.amount, 0)
    if (total <= 0) return []

    const r = 36
    const perimeter = 2 * Math.PI * r
    let accumulatedOffset = 0

    return topCategoriesResult.categories.map((c) => {
      const sliceLength = (c.amount / total) * perimeter
      const sliceOffset = accumulatedOffset
      accumulatedOffset += sliceLength
      return {
        ...c,
        dashArray: `${sliceLength} ${perimeter}`,
        dashOffset: -sliceOffset,
      }
    })
  }, [topCategoriesResult])

  return (
    <AppShell showNav={true} className="relative pt-2.5 flex flex-col gap-2.5 select-none pb-40">
      {/* Fundo suave com manchas orgânicas */}
      <BackgroundBlobs showSparkles={false} />

      {/* 1. Cabeçalho */}
      <div className="w-full flex items-center justify-between min-w-0 px-0.5">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Botão voltar (círculo branco de 40px) */}
          <Link
            to="/inicio"
            aria-label="Voltar para Início"
            className="w-10 h-10 rounded-full bg-white shadow-card border border-lilac/20 flex items-center justify-center text-[#432171] hover:bg-[#F8F5FC] active:scale-95 transition-all shrink-0 cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-[#432171]" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-[22px] font-extrabold text-[#432171] font-nunito tracking-tight leading-tight truncate">
              Seus gastos
            </h1>
            <p className="text-[13px] font-bold text-[#7D6A9C] leading-snug mt-0.5 font-nunito">
              Acompanhe e entenda para<br />controlar melhor.
            </p>
          </div>
        </div>

        {/* Botão calendário (abre seletor de mês) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsMonthPickerOpen(!isMonthPickerOpen)}
            aria-label="Selecionar período"
            className="w-10 h-10 rounded-full bg-white shadow-card border border-lilac/20 flex items-center justify-center text-[#432171] hover:bg-[#F8F5FC] active:scale-95 transition-all shrink-0 cursor-pointer"
          >
            <Calendar className="w-5 h-5 text-[#432171]" />
          </button>

          {/* Popover do Seletor de Mês */}
          {isMonthPickerOpen && (
            <div className="absolute right-0 top-12 z-50 w-48 bg-white rounded-2xl shadow-xl border border-lilac/20 py-2 animate-in fade-in zoom-in-95">
              <div className="px-3 py-1 text-[11px] font-black text-[#7D6A9C] uppercase tracking-wider border-b border-[#F0EBF8]">
                Selecionar Mês
              </div>
              <div className="max-h-56 overflow-y-auto py-1">
                {monthlySeries.map((m) => (
                  <button
                    key={m.key}
                    onClick={() => {
                      setSelectedMonth(m.key)
                      setIsMonthPickerOpen(false)
                    }}
                    className={`w-full text-left px-3.5 py-1.5 text-[12px] font-bold flex items-center justify-between transition-colors ${
                      m.key === activeMonthKey
                        ? 'text-[#7D2BD6] bg-[#FAF5FF]'
                        : 'text-[#432171] hover:bg-[#F8F5FC]'
                    }`}
                  >
                    <span>{m.label} ({m.key.slice(0, 4)})</span>
                    {m.key === activeMonthKey && (
                      <span className="w-2 h-2 rounded-full bg-[#7D2BD6]" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Seletor Segmentado: "Este mês", "Últimos 3 meses", "1 ano" */}
      <div className="w-full flex items-center gap-2 py-0.5 min-w-0">
        <button
          type="button"
          onClick={() => {
            if (validPeriod === 'mes') {
              setIsMonthPickerOpen(!isMonthPickerOpen)
            } else {
              setPeriod('mes')
            }
          }}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-extrabold transition-all cursor-pointer ${
            validPeriod === 'mes'
              ? 'bg-[#7D2BD6] text-white shadow-sm'
              : 'bg-white/90 text-[#7D6A9C] hover:bg-white border border-lilac/25'
          }`}
        >
          <span>Este mês</span>
          <ChevronDown className="w-3.5 h-3.5 opacity-80" strokeWidth={2.5} />
        </button>

        <button
          type="button"
          onClick={() => setPeriod('3m')}
          className={`px-3.5 py-2 rounded-full text-[13px] font-extrabold transition-all cursor-pointer ${
            validPeriod === '3m'
              ? 'bg-[#7D2BD6] text-white shadow-sm'
              : 'bg-white/90 text-[#7D6A9C] hover:bg-white border border-lilac/25'
          }`}
        >
          Últimos 3 meses
        </button>

        <button
          type="button"
          onClick={() => setPeriod('1a')}
          className={`px-3.5 py-2 rounded-full text-[13px] font-extrabold transition-all cursor-pointer ${
            validPeriod === '1a'
              ? 'bg-[#7D2BD6] text-white shadow-sm'
              : 'bg-white/90 text-[#7D6A9C] hover:bg-white border border-lilac/25'
          }`}
        >
          1 ano
        </button>
      </div>

      {/* ESTADO DE ERRO */}
      {error && !loading && (
        <Card variant="white" size="default" className="text-center py-8 px-4 flex flex-col items-center gap-3">
          <Mascot pose="retry" size="md" alt="Tentar novamente" />
          <h3 className="text-[15px] font-extrabold text-[#432171]">Não conseguimos carregar seus gastos</h3>
          <p className="text-[12px] font-semibold text-[#7D6A9C]">{error}</p>
          <button
            onClick={loadData}
            className="px-5 py-2 rounded-full bg-[#7D2BD6] text-white font-extrabold text-xs shadow-md hover:bg-[#5B21B6] transition-all cursor-pointer"
          >
            Tentar novamente
          </button>
        </Card>
      )}

      {/* ESTADO VAZIO */}
      {!loading && !error && expenseTransactions.length === 0 && (
        <Card variant="white" size="default" className="text-center py-10 px-4 flex flex-col items-center gap-3">
          <Mascot pose="empty" size="lg" alt="Cofrinho vazio" />
          <p className="text-[15px] font-extrabold text-[#432171] max-w-[240px] leading-snug">
            Nenhum gasto registrado neste período.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="mt-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#7D2BD6] to-[#B037F8] text-white font-extrabold text-xs shadow-md hover:opacity-95 transition-all cursor-pointer"
          >
            + Adicionar gasto
          </button>
        </Card>
      )}

      {/* 3. Card "Total de despesas" + Gráfico de Barras Mensal */}
      <Card variant="white" size="default" className="w-full rounded-[28px] p-5 shadow-card min-w-0">
        {/* Cabeçalho do Card: Total e Chip de Variação */}
        <div className="flex flex-col min-w-0 mb-4">
          <span className="text-[13px] font-bold text-[#7D6A9C] font-nunito leading-tight">
            Total de despesas
          </span>
          <div className="flex items-center gap-3 mt-1 min-w-0">
            <span className="text-[28px] font-extrabold text-[#432171] tracking-tight leading-tight truncate">
              {loading ? (
                <span className="inline-block w-36 h-8 bg-gray-200 rounded animate-pulse" />
              ) : (
                formatCurrency(summary.totalExpenses)
              )}
            </span>

            {/* Chip de variação contra o período anterior equivalente */}
            {!loading && summary.variationPct !== null && (
              <div
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black shrink-0 ${
                  summary.variationPct <= 0
                    ? 'bg-[#DCFCE7] text-[#15803D]'
                    : 'bg-[#FCE7F3] text-[#BE185D]'
                }`}
              >
                {summary.variationPct <= 0 ? (
                  <ArrowDown className="w-3 h-3 text-[#15803D]" strokeWidth={2.5} />
                ) : (
                  <ArrowUp className="w-3 h-3 text-[#BE185D]" strokeWidth={2.5} />
                )}
                <span>
                  {summary.variationPct > 0 ? '+' : ''}
                  {summary.variationPct}%
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 4. Gráfico de Barras Mensal com altura fixa para não pular */}
        <div className="w-full h-[155px] flex flex-col justify-end pt-5 min-w-0">
          <div className="w-full h-[100px] flex items-end justify-between gap-1.5 sm:gap-2 px-1 min-w-0">
            {monthlySeries.map((item) => {
              const heightPct = maxBarValue > 0 ? Math.max((item.value / maxBarValue) * 100, 10) : 10
              const isActive = item.isSelected

              return (
                <div
                  key={item.key}
                  onClick={() => setSelectedMonth(item.key)}
                  className="flex-1 flex flex-col items-center h-full justify-end relative cursor-pointer group"
                >
                  {/* Tooltip com valor na barra ativa */}
                  {isActive && (
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center animate-in fade-in zoom-in-95 pointer-events-none">
                      <div className="bg-[#432171] text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-md whitespace-nowrap">
                        {item.value > 0 ? formatCurrency(item.value).replace(',00', '') : 'R$ 0'}
                      </div>
                      <div className="w-0 h-0 border-x-[3.5px] border-x-transparent border-t-[4px] border-t-[#432171]" />
                    </div>
                  )}

                  {/* Trilho claro atrás */}
                  <div className="w-full max-w-[42px] h-full bg-[#F3E8FF] rounded-t-xl rounded-b-md flex items-end overflow-hidden p-0.5">
                    {/* Barra de valor */}
                    <div
                      className={`w-full rounded-t-lg rounded-b-sm transition-all duration-300 ${
                        isActive
                          ? 'bg-[#5B21B6]' // Barra ativa mais escura como no mockup Nov
                          : 'bg-[#B037F8] hover:bg-[#9333EA]' // Outras barras em roxo intermediário
                      }`}
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>

                  {/* Rótulo do Mês */}
                  <span
                    className={`text-[11px] mt-1.5 font-nunito leading-none ${
                      isActive ? 'font-black text-[#432171]' : 'font-bold text-[#7D6A9C]'
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </Card>

      {/* 5. Card "Maior categoria" com Gráfico de Rosca */}
      <Card variant="white" size="default" className="w-full rounded-[24px] p-4.5 shadow-card min-w-0">
        <div className="flex items-center justify-between gap-3 min-w-0">
          {/* Informações da Maior Categoria */}
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-[#F5EEFF] flex items-center justify-center shrink-0 mt-0.5">
              <CategoryCircle
                name={
                  topCategoriesResult.topCategory?.name.toLowerCase() || 'alimentação'
                }
                size="md"
              />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[12px] font-bold text-[#7D6A9C] block leading-tight font-nunito">
                Maior categoria
              </span>
              <span className="text-[14px] font-extrabold text-[#432171] block leading-tight truncate mt-0.5">
                {topCategoriesResult.topCategory?.name || 'Sem gastos'}
              </span>
              <span className="text-[20px] font-black text-[#7D2BD6] block leading-tight mt-1">
                {topCategoriesResult.topCategory?.percentage || 0}%
              </span>
              <span className="text-[12px] font-bold text-[#7D6A9C] block leading-tight mt-0.5 truncate">
                {formatCurrency(topCategoriesResult.topCategory?.amount || 0)}
              </span>
            </div>
          </div>

          {/* Gráfico de Rosca (Donut SVG) */}
          <div className="w-[88px] h-[88px] relative flex items-center justify-center shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              {/* Trilho base */}
              <circle
                cx="50"
                cy="50"
                r="36"
                fill="transparent"
                stroke="#F3E8FF"
                strokeWidth="16"
              />
              {/* Fatias das categorias */}
              {donutSlices.map((slice) => (
                <circle
                  key={slice.id}
                  cx="50"
                  cy="50"
                  r="36"
                  fill="transparent"
                  stroke={slice.color}
                  strokeWidth="16"
                  strokeDasharray={slice.dashArray}
                  strokeDashoffset={slice.dashOffset}
                  strokeLinecap="butt"
                  className="transition-all duration-500"
                />
              ))}
            </svg>
          </div>
        </div>
      </Card>

      {/* 6. "Transações recentes" + "Ver todas >" (SÓ DESPESAS do período!) */}
      <div className="w-full min-w-0">
        <div className="flex items-center justify-between mb-1.5 px-0.5 min-w-0">
          <span className="text-[15px] font-extrabold text-[#432171] font-nunito">Transações recentes</span>
          <button
            type="button"
            onClick={() => setIsAllTransactionsOpen(true)}
            className="text-[12px] font-extrabold text-[#7D2BD6] hover:text-[#5B21B6] flex items-center gap-0.5 shrink-0 cursor-pointer"
          >
            <span>Ver todas</span>
            <ChevronRight className="w-3.5 h-3.5" strokeWidth={2.5} />
          </button>
        </div>

        <Card variant="white" size="default" className="w-full rounded-[24px] p-3.5 shadow-card min-w-0">
          {loading ? (
            <div className="w-full flex flex-col divide-y divide-[#F3EBF9] min-w-0">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-full py-2.5 flex items-center justify-between animate-pulse px-1 min-w-0">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-2xl bg-lilac/30 shrink-0" />
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="w-24 h-3.5 bg-lilac/30 rounded" />
                      <div className="w-16 h-2 bg-lilac/20 rounded" />
                    </div>
                  </div>
                  <div className="w-14 h-4 bg-lilac/30 rounded shrink-0 ml-2" />
                </div>
              ))}
            </div>
          ) : recentExpenses.length > 0 ? (
            <div className="w-full flex flex-col divide-y divide-[#F3EBF9] min-w-0">
              {recentExpenses.map((tx) => {
                const cat = categories[tx.category_id]
                const catName = cat?.name || 'Geral'

                return (
                  <Link
                    key={tx.id}
                    to={`/gastos/${tx.id}`}
                    className="w-full py-2.5 flex items-center justify-between hover:bg-[#FAF6FD] px-1 rounded-xl transition-colors min-w-0"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <CategoryCircle
                        name={cat?.slug || cat?.icon || cat?.name || 'outros'}
                        size="md"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-[14px] font-bold text-[#432171] leading-tight truncate">
                          {tx.description}
                        </div>
                        <div className="text-[11px] font-semibold text-[#7D6A9C] truncate mt-0.5">
                          {formatTransactionDate(tx.occurred_on, catName)}
                        </div>
                      </div>
                    </div>

                    <div className="text-[14px] font-extrabold text-[#432171] shrink-0 ml-2">
                      - {formatCurrency(tx.amount)}
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="py-4 text-center min-w-0">
              <p className="text-xs font-semibold text-[#7D6A9C]">
                Nenhum gasto recente registrado neste período.
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* 7. Botão fixo "Adicionar gasto" (pílula roxa logo acima da bottom nav) */}
      <div className="fixed bottom-[calc(var(--nav-h,64px)+16px)] left-1/2 -translate-x-1/2 z-40 pointer-events-auto">
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="bg-gradient-to-r from-[#7D2BD6] to-[#B037F8] text-white font-extrabold text-[14px] px-6 py-2.5 rounded-full shadow-xl hover:opacity-95 active:scale-95 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4.5 h-4.5 text-white" strokeWidth={2.8} />
          <span>Adicionar gasto</span>
        </button>
      </div>

      {/* MODAL / BOTTOM SHEET "VER TODAS" (com busca, filtro por categoria e ordenação) */}
      {isAllTransactionsOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#3B1A78]/50 backdrop-blur-xs flex items-end justify-center animate-fadeIn"
          onClick={() => setIsAllTransactionsOpen(false)}
        >
          <div
            className="w-full max-w-[430px] bg-white rounded-t-[32px] p-5 shadow-2xl flex flex-col relative max-h-[90vh] animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-[#E2D4F0] rounded-full mx-auto mb-3 shrink-0" />

            <div className="flex items-center justify-between pb-3 border-b border-[#F0EBF8] mb-3">
              <div className="flex items-center gap-2">
                <h2 className="text-[18px] font-extrabold text-[#432171] font-nunito">
                  Todas as despesas
                </h2>
                <span className="bg-[#7D2BD6] text-white text-[11px] font-black px-2 py-0.5 rounded-full">
                  {allFilteredExpenses.length}
                </span>
              </div>
              <button
                onClick={() => setIsAllTransactionsOpen(false)}
                className="w-8 h-8 rounded-full bg-[#F5EEFF] hover:bg-[#EBDCFE] flex items-center justify-center text-[#432171] cursor-pointer"
              >
                <X className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </div>

            {/* Campo de Busca */}
            <div className="relative mb-3">
              <Search className="w-4 h-4 text-[#7D6A9C] absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                value={allSearchTerm}
                onChange={(e) => setAllSearchTerm(e.target.value)}
                placeholder="Buscar despesa ou categoria..."
                className="w-full bg-[#F8F5FC] text-[#432171] text-xs font-semibold pl-9 pr-8 py-2.5 rounded-xl border border-[#E9D5FF] focus:outline-none focus:border-[#7D2BD6]"
              />
              {allSearchTerm && (
                <button
                  onClick={() => setAllSearchTerm('')}
                  className="absolute right-2.5 top-2.5 text-[#7D6A9C] hover:text-[#432171]"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filtro por Categoria e Ordenação */}
            <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1 text-xs">
              <select
                value={allCategoryFilter}
                onChange={(e) => setAllCategoryFilter(e.target.value)}
                className="bg-[#F8F5FC] text-[#432171] font-bold text-xs px-2.5 py-1.5 rounded-lg border border-[#E9D5FF] focus:outline-none"
              >
                <option value="all">Todas as categorias</option>
                {Object.values(categories).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                value={allSortOrder}
                onChange={(e) => setAllSortOrder(e.target.value as any)}
                className="bg-[#F8F5FC] text-[#432171] font-bold text-xs px-2.5 py-1.5 rounded-lg border border-[#E9D5FF] focus:outline-none"
              >
                <option value="recent">Mais recentes</option>
                <option value="amount_desc">Maior valor</option>
                <option value="amount_asc">Menor valor</option>
              </select>
            </div>

            {/* Lista completa de despesas */}
            <div className="overflow-y-auto divide-y divide-[#F3EBF9] pr-1 pb-4 flex-1">
              {allFilteredExpenses.length > 0 ? (
                allFilteredExpenses.map((tx) => {
                  const cat = categories[tx.category_id]
                  const catName = cat?.name || 'Geral'

                  return (
                    <Link
                      key={tx.id}
                      to={`/gastos/${tx.id}`}
                      onClick={() => setIsAllTransactionsOpen(false)}
                      className="w-full py-3 flex items-center justify-between hover:bg-[#FAF6FD] px-2 rounded-xl transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <CategoryCircle
                          name={cat?.slug || cat?.icon || cat?.name || 'outros'}
                          size="md"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-[14px] font-bold text-[#432171] truncate">
                            {tx.description}
                          </div>
                          <div className="text-[11px] font-semibold text-[#7D6A9C] truncate">
                            {formatTransactionDate(tx.occurred_on, catName)}
                          </div>
                        </div>
                      </div>
                      <div className="text-[14px] font-extrabold text-[#432171] shrink-0 ml-2">
                        - {formatCurrency(tx.amount)}
                      </div>
                    </Link>
                  )
                })
              ) : (
                <div className="py-8 flex flex-col items-center justify-center text-center gap-2">
                  <Mascot pose="search" size="md" alt="Busca sem resultado" />
                  <p className="text-[14px] font-extrabold text-[#432171]">
                    Nenhuma despesa encontrada
                  </p>
                  <p className="text-xs text-[#7D6A9C]">
                    Tente ajustar os termos de busca ou filtros de categoria.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Adicionar Transação */}
      <TransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        initialType="expense"
        onSuccess={loadData}
      />
    </AppShell>
  )
}

export default TransactionsPage
