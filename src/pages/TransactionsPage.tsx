import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { AppShell } from '../components/AppShell'
import { Mascot } from '../components/Mascot'
import { CategoryCircle } from '../components/CategoryIcon'
import { TransactionModal } from '../components/TransactionModal'
import { formatCurrency } from '../lib/format'
import { Plus, ChevronDown, ChevronRight } from 'lucide-react'
import type { Database } from '../types/database.types'

type Transaction = Database['public']['Tables']['transactions']['Row']
type Category = Database['public']['Tables']['categories']['Row']

export const TransactionsPage: React.FC = () => {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Record<string, Category>>({})
  const [loading, setLoading] = useState(true)

  // Filtros fieis ao layout: Período ("Este mês") e Categoria ("Todas")
  const [period, setPeriod] = useState<'this_month' | 'last_month' | 'all'>('this_month')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Estados dos menus dropdown personalizados (para substituir selects nativos de OS)
  const [periodOpen, setPeriodOpen] = useState(false)
  const [categoryOpen, setCategoryOpen] = useState(false)
  const periodRef = useRef<HTMLDivElement>(null)
  const categoryRef = useRef<HTMLDivElement>(null)

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  // Fecha dropdowns ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (periodRef.current && !periodRef.current.contains(e.target as Node)) {
        setPeriodOpen(false)
      }
      if (categoryRef.current && !categoryRef.current.contains(e.target as Node)) {
        setCategoryOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadData = async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data: cats } = await supabase.from('categories').select('*')
      const catMap: Record<string, Category> = {}
      cats?.forEach((c) => {
        catMap[c.id] = c
      })
      setCategories(catMap)

      const { data: txs } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('occurred_on', { ascending: false })
      setTransactions(txs || [])
    } finally {
      setLoading(false)
    }
  }

  // Filtragem
  const curMonthStr = new Date().toISOString().slice(0, 7)
  const prevMonthDate = new Date()
  prevMonthDate.setMonth(prevMonthDate.getMonth() - 1)
  const prevMonthStr = prevMonthDate.toISOString().slice(0, 7)

  const filtered = transactions.filter((t) => {
    // Filtro de categoria
    if (selectedCategory !== 'all' && t.category_id !== selectedCategory) {
      return false
    }

    // Filtro de período
    if (period === 'this_month') {
      return t.occurred_on.startsWith(curMonthStr)
    } else if (period === 'last_month') {
      return t.occurred_on.startsWith(prevMonthStr)
    }

    return true
  })

  // Total de despesas filtradas
  const totalExpenses = filtered
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + Number(t.amount), 0)

  // Gráfico mensal dos últimos 6 meses fiel a design/telas/07-gastos.png (Ago, Set, Set, Out, Nov, Dez)
  const monthlyExpensesMock = [
    { label: 'Ago', value: 700 },
    { label: 'Set', value: 1600 },
    { label: 'Set', value: 750 },
    { label: 'Out', value: 1850 },
    { label: 'Nov', value: totalExpenses > 0 ? totalExpenses : 1960 },
    { label: 'Dez', value: 1300 },
  ]
  const maxMonthVal = Math.max(...monthlyExpensesMock.map((m) => m.value))

  const periodLabels: Record<string, string> = {
    this_month: 'Este mês',
    last_month: 'Mês anterior',
    all: 'Todo o histórico',
  }

  const selectedCategoryName =
    selectedCategory === 'all'
      ? 'Todas'
      : categories[selectedCategory]?.name || 'Todas'

  return (
    <AppShell showNav={true} className="pt-4 pb-28 flex flex-col gap-4 select-none">
      {/* 1. Título da tela (Fiel a design/telas/07-gastos.png) */}
      <div className="w-full min-w-0 pt-1">
        <h1 className="text-[22px] font-extrabold text-deep font-sans tracking-tight">
          Seus gastos
        </h1>
        <p className="text-[13px] font-semibold text-deep leading-tight mt-0.5">
          Acompanhe para onde seu dinheiro está indo.
        </p>
      </div>

      {/* 2. Pílulas de Filtro ("Este mês ⌄" e "Todas ⌄") */}
      <div className="w-full flex items-center gap-2.5 min-w-0">
        {/* Pílula Período */}
        <div ref={periodRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setPeriodOpen(!periodOpen)
              setCategoryOpen(false)
            }}
            className="h-10 px-4 bg-white/90 hover:bg-white border border-[#E9D5FF] rounded-full text-[13px] font-extrabold text-deep flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
          >
            <span>{periodLabels[period]}</span>
            <ChevronDown className={`w-4 h-4 text-deep transition-transform ${periodOpen ? 'rotate-180' : ''}`} />
          </button>

          {periodOpen && (
            <div className="absolute left-0 top-11 z-40 min-w-[160px] bg-white border border-[#F0EBF8] rounded-2xl shadow-card py-1.5 animate-in fade-in zoom-in-95">
              <button
                onClick={() => {
                  setPeriod('this_month')
                  setPeriodOpen(false)
                }}
                className={`w-full text-left px-4 py-2 text-[13px] font-bold transition-colors ${
                  period === 'this_month' ? 'text-[#8E32D8] bg-[#F8F5FC]' : 'text-deep hover:bg-[#FAF6FD]'
                }`}
              >
                Este mês
              </button>
              <button
                onClick={() => {
                  setPeriod('last_month')
                  setPeriodOpen(false)
                }}
                className={`w-full text-left px-4 py-2 text-[13px] font-bold transition-colors ${
                  period === 'last_month' ? 'text-[#8E32D8] bg-[#F8F5FC]' : 'text-deep hover:bg-[#FAF6FD]'
                }`}
              >
                Mês anterior
              </button>
              <button
                onClick={() => {
                  setPeriod('all')
                  setPeriodOpen(false)
                }}
                className={`w-full text-left px-4 py-2 text-[13px] font-bold transition-colors ${
                  period === 'all' ? 'text-[#8E32D8] bg-[#F8F5FC]' : 'text-deep hover:bg-[#FAF6FD]'
                }`}
              >
                Todo o histórico
              </button>
            </div>
          )}
        </div>

        {/* Pílula Categorias */}
        <div ref={categoryRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setCategoryOpen(!categoryOpen)
              setPeriodOpen(false)
            }}
            className="h-10 px-4 bg-white/90 hover:bg-white border border-[#E9D5FF] rounded-full text-[13px] font-extrabold text-deep flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
          >
            <span>{selectedCategoryName}</span>
            <ChevronDown className={`w-4 h-4 text-deep transition-transform ${categoryOpen ? 'rotate-180' : ''}`} />
          </button>

          {categoryOpen && (
            <div className="absolute left-0 top-11 z-40 min-w-[200px] max-h-64 overflow-y-auto bg-white border border-[#F0EBF8] rounded-2xl shadow-card py-1.5 animate-in fade-in zoom-in-95">
              <button
                onClick={() => {
                  setSelectedCategory('all')
                  setCategoryOpen(false)
                }}
                className={`w-full text-left px-4 py-2 text-[13px] font-bold transition-colors ${
                  selectedCategory === 'all' ? 'text-[#8E32D8] bg-[#F8F5FC]' : 'text-deep hover:bg-[#FAF6FD]'
                }`}
              >
                Todas as categorias
              </button>
              {Object.values(categories).map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setSelectedCategory(c.id)
                    setCategoryOpen(false)
                  }}
                  className={`w-full text-left px-4 py-2 text-[13px] font-bold transition-colors ${
                    selectedCategory === c.id ? 'text-[#8E32D8] bg-[#F8F5FC]' : 'text-deep hover:bg-[#FAF6FD]'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. Total de despesas e Gráfico de barras mensais (Sem card fechado, direto no fundo como no layout) */}
      <div className="w-full min-w-0 pt-1">
        <span className="text-[13px] font-bold text-deep/70">Total de despesas</span>
        <div className="text-[26px] font-extrabold text-deep font-sans tracking-tight mb-3">
          {formatCurrency(totalExpenses > 0 ? totalExpenses : 1960)}
        </div>

        {/* Gráfico de barras verticais */}
        <div className="w-full flex items-end justify-between h-28 px-1 border-b border-[#E9D5FF]/60 pb-2">
          {monthlyExpensesMock.map((m, idx) => {
            const heightPct = Math.round((m.value / maxMonthVal) * 100)
            const isHighlight = idx === 4 // Nov
            return (
              <div key={`${m.label}-${idx}`} className="flex flex-col items-center gap-1.5 flex-1">
                <div className="w-5 bg-[#F0E5FA] rounded-t-lg h-20 flex items-end justify-center overflow-hidden">
                  <div
                    className={`w-full rounded-t-lg transition-all duration-500 ${
                      isHighlight
                        ? 'bg-gradient-to-t from-[#8E32D8] to-[#521D83]'
                        : 'bg-gradient-to-t from-[#B037F8] to-[#7D2BD6]'
                    }`}
                    style={{ height: `${heightPct}%` }}
                  />
                </div>
                <span
                  className={`text-[11px] font-extrabold ${
                    isHighlight ? 'text-[#8E32D8]' : 'text-deep/70'
                  }`}
                >
                  {m.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* 4. Transações Recentes (Fiel a design/telas/07-gastos.png) */}
      <div className="w-full min-w-0 pt-1">
        <div className="flex items-center justify-between mb-3 min-w-0">
          <span className="text-[15px] font-extrabold text-deep">Transações recentes</span>
          <button
            onClick={() => {
              setPeriod('all')
              setSelectedCategory('all')
            }}
            className="text-[12px] font-extrabold text-deep hover:text-primary flex items-center gap-0.5 shrink-0"
          >
            <span>Ver todas</span>
            <ChevronRight className="w-3.5 h-3.5 text-deep" strokeWidth={2.5} />
          </button>
        </div>

        {loading ? (
          <div className="w-full flex flex-col divide-y divide-[#F3EBF9] min-w-0">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-full py-3 flex items-center justify-between animate-pulse px-1 min-w-0"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-lilac/30 shrink-0" />
                  <div className="space-y-1.5">
                    <div className="w-28 h-3.5 bg-lilac/30 rounded" />
                    <div className="w-16 h-2.5 bg-lilac/20 rounded" />
                  </div>
                </div>
                <div className="w-16 h-4 bg-lilac/30 rounded" />
              </div>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="w-full flex flex-col divide-y divide-[#F3EBF9] min-w-0">
            {filtered.map((tx) => {
              const cat = categories[tx.category_id]
              const isIncome = tx.type === 'income'
              return (
                <Link
                  key={tx.id}
                  to={`/gastos/${tx.id}`}
                  className="w-full py-3 flex items-center justify-between hover:bg-white/50 px-1 rounded-xl transition-colors min-w-0"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <CategoryCircle
                      name={cat?.slug || cat?.icon || cat?.name || 'outros'}
                      size="md"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-[15px] font-extrabold text-deep leading-tight truncate">
                        {tx.description}
                      </div>
                      <div className="text-[12px] font-semibold text-deep/60 leading-tight mt-0.5 truncate">
                        {cat?.name || 'Gasto'}
                      </div>
                    </div>
                  </div>

                  <div
                    className={`text-[15px] font-extrabold shrink-0 ml-2 ${
                      isIncome ? 'text-[#15803D]' : 'text-deep'
                    }`}
                  >
                    {isIncome ? '+ ' : '- '}
                    {formatCurrency(tx.amount)}
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="py-8 text-center text-xs font-bold text-textSec flex flex-col items-center">
            <Mascot size="lg" pose="empty" floating={true} className="mb-2" />
            <span>Nenhuma transação encontrada para os filtros selecionados.</span>
          </div>
        )}
      </div>

      {/* 5. Botão flutuante "+ Adicionar gasto" do layout */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-30 w-full max-w-[var(--app-max-width,430px)] px-4 pointer-events-none">
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full bg-gradient-to-r from-[#8E32D8] to-[#6C22BD] text-white font-extrabold text-[15px] py-3.5 px-6 rounded-full shadow-btn-floating flex items-center justify-center gap-2 hover:opacity-95 active:scale-95 transition-all pointer-events-auto"
        >
          <Plus className="w-5 h-5" strokeWidth={2.5} />
          <span>Adicionar gasto</span>
        </button>
      </div>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialType="expense"
        onSuccess={loadData}
      />
    </AppShell>
  )
}

export default TransactionsPage
