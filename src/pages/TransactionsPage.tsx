import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { AppShell } from '../components/AppShell'
import { Button } from '../components/Button'
import { Mascot } from '../components/Mascot'
import { TransactionModal } from '../components/TransactionModal'
import { formatCurrency, formatDate } from '../lib/format'
import {
  Search,
  Filter,
  Plus,
  Home,
  ShoppingCart,
  Bus,
  HeartPulse,
  Users,
  Sparkles,
  ShoppingBag,
  GraduationCap,
  CircleEllipsis,
  Calendar,
} from 'lucide-react'
import type { Database } from '../types/database.types'

type Transaction = Database['public']['Tables']['transactions']['Row']
type Category = Database['public']['Tables']['categories']['Row']

export const TransactionsPage: React.FC = () => {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Record<string, Category>>({})
  const [loading, setLoading] = useState(true)

  // Filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [period, setPeriod] = useState<'this_month' | 'last_month' | 'all'>('this_month')
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income'>('all')

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

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
    // Busca por texto
    if (
      searchTerm &&
      !t.description.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false
    }

    // Filtro de categoria
    if (selectedCategory !== 'all' && t.category_id !== selectedCategory) {
      return false
    }

    // Filtro de tipo
    if (typeFilter !== 'all' && t.type !== typeFilter) {
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

  // Gráfico mensal dos últimos 5 meses (Ago, Set, Out, Nov, Dez)
  const months = ['Ago', 'Set', 'Out', 'Nov', 'Dez']
  const monthlyExpensesMock = [
    { label: 'Ago', value: 1600 },
    { label: 'Set', value: 1800 },
    { label: 'Out', value: 1750 },
    { label: 'Nov', value: totalExpenses > 0 ? totalExpenses : 1960 },
    { label: 'Dez', value: 1400 },
  ]
  const maxMonthVal = Math.max(...monthlyExpensesMock.map((m) => m.value))

  const getCategoryIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Home':
        return <Home className="w-4 h-4" />
      case 'ShoppingCart':
        return <ShoppingCart className="w-4 h-4" />
      case 'Bus':
        return <Bus className="w-4 h-4" />
      case 'HeartPulse':
        return <HeartPulse className="w-4 h-4" />
      case 'Users':
        return <Users className="w-4 h-4" />
      case 'GraduationCap':
        return <GraduationCap className="w-4 h-4" />
      case 'Sparkles':
        return <Sparkles className="w-4 h-4" />
      case 'ShoppingBag':
        return <ShoppingBag className="w-4 h-4" />
      default:
        return <CircleEllipsis className="w-4 h-4" />
    }
  }

  return (
    <AppShell showNav={true} className="py-6 flex flex-col gap-4">
      {/* Título da tela */}
      <div className="w-full min-w-0">
        <h1 className="text-xl font-extrabold text-deep font-sans mb-1">
          Seus gastos
        </h1>
        <p className="text-xs font-semibold text-textSec">
          Acompanhe para onde seu dinheiro está indo.
        </p>
      </div>

      {/* Chips de Filtro (fiel ao layout) */}
      <div className="w-full flex items-center gap-2 min-w-0">
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as any)}
          className="h-9 px-3 bg-white border border-lilac/30 rounded-xl text-xs font-bold text-deep focus:outline-none focus:border-primary shadow-xs"
        >
          <option value="this_month">Este mês</option>
          <option value="last_month">Mês anterior</option>
          <option value="all">Todo o histórico</option>
        </select>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="h-9 px-3 bg-white border border-lilac/30 rounded-xl text-xs font-bold text-deep focus:outline-none focus:border-primary shadow-xs"
        >
          <option value="all">Todas as categorias</option>
          {Object.values(categories).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as any)}
          className="h-9 px-3 bg-white border border-lilac/30 rounded-xl text-xs font-bold text-deep focus:outline-none focus:border-primary shadow-xs"
        >
          <option value="all">Todos</option>
          <option value="expense">Despesas</option>
          <option value="income">Receitas</option>
        </select>
      </div>

      {/* Busca */}
      <div className="w-full relative flex items-center min-w-0">
        <Search className="w-4 h-4 text-textSec absolute left-3.5" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar transação..."
          className="w-full h-10 pl-10 pr-4 bg-white border border-lilac/25 rounded-2xl text-xs font-semibold text-deep focus:outline-none focus:border-primary shadow-xs"
        />
      </div>

      {/* Total de despesas e Gráfico de barras mensais (Layout oficial) */}
      <div className="w-full bg-white rounded-[22px] p-5 border border-lilac/15 shadow-card min-w-0">
        <span className="text-xs font-bold text-textSec">Total de despesas</span>
        <div className="text-2xl font-extrabold text-deep font-sans mb-4">
          {formatCurrency(totalExpenses)}
        </div>

        {/* Gráfico de barras verticais do layout */}
        <div className="flex items-end justify-between h-24 pt-2 px-3 border-b border-lilac/15 pb-2">
          {monthlyExpensesMock.map((m) => {
            const heightPct = Math.round((m.value / maxMonthVal) * 100)
            const isCurrent = m.label === 'Nov'
            return (
              <div key={m.label} className="flex flex-col items-center gap-1.5 flex-1">
                <div className="w-5 bg-bg rounded-t-lg h-16 flex items-end justify-center">
                  <div
                    className={`w-full rounded-t-lg transition-all duration-500 ${
                      isCurrent
                        ? 'bg-gradient-to-t from-primary to-lilac'
                        : 'bg-lilac/40'
                    }`}
                    style={{ height: `${heightPct}%` }}
                  />
                </div>
                <span
                  className={`text-[10px] font-bold ${
                    isCurrent ? 'text-primary' : 'text-textSec'
                  }`}
                >
                  {m.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Lista de Transações Recentes */}
      <div className="bg-white rounded-[22px] p-5 border border-lilac/15 shadow-card">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-textSec">Transações recentes</span>
          <span className="text-xs font-bold text-textSec/70">{filtered.length} lançamentos</span>
        </div>

        {loading ? (
          <div className="w-full flex flex-col divide-y divide-lilac/10 min-w-0">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-full py-3 flex items-center justify-between animate-pulse px-1 min-w-0"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-lilac/30 shrink-0" />
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
          <div className="flex flex-col divide-y divide-lilac/10">
            {filtered.map((tx) => {
              const cat = categories[tx.category_id]
              const isIncome = tx.type === 'income'
              return (
                <Link
                  key={tx.id}
                  to={`/gastos/${tx.id}`}
                  className="py-3 flex items-center justify-between hover:bg-bg/60 px-1 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-xs"
                      style={{ backgroundColor: cat?.color || '#B037F8' }}
                    >
                      {getCategoryIcon(cat?.icon)}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-deep leading-tight">
                        {tx.description}
                      </div>
                      <div className="text-[11px] font-semibold text-textSec flex items-center gap-1.5 mt-0.5">
                        <span>{cat?.name || 'Gasto'}</span>
                        <span>•</span>
                        <span>{formatDate(tx.occurred_on)}</span>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`text-sm font-extrabold ${
                      isIncome ? 'text-success' : 'text-danger'
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

      {/* Botão flutuante/fixo "+ Adicionar gasto" do layout */}
      <div className="pt-2">
        <Button
          size="lg"
          fullWidth
          icon={<Plus className="w-5 h-5" />}
          onClick={() => setIsModalOpen(true)}
        >
          Adicionar gasto
        </Button>
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
