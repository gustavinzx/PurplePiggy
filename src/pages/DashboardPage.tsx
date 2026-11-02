import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { AppShell } from '../components/AppShell'
import { Card } from '../components/Card'
import { Mascot } from '../components/Mascot'
import { ProgressRing } from '../components/ProgressRing'
import { TransactionModal } from '../components/TransactionModal'
import {
  calculateAvailableBalance,
  calculateMonthlySummary,
  calculateGoalMetrics,
} from '../lib/finance'
import { formatCurrency, formatPercent } from '../lib/format'
import {
  Eye,
  EyeOff,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Calculator,
  ChevronRight,
  Home,
  ShoppingCart,
  Bus,
  HeartPulse,
  Users,
  Sparkles,
  ShoppingBag,
  GraduationCap,
  CircleEllipsis,
} from 'lucide-react'
import type { Database } from '../types/database.types'

type Transaction = Database['public']['Tables']['transactions']['Row']
type Category = Database['public']['Tables']['categories']['Row']
type Goal = Database['public']['Tables']['financial_goals']['Row']

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const { user, profile, refreshProfile } = useAuth()

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Record<string, Category>>({})
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [hideBalance, setHideBalance] = useState(profile?.hide_balance ?? false)

  // Modais de transação
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalType, setModalType] = useState<'income' | 'expense'>('expense')

  useEffect(() => {
    if (profile) {
      setHideBalance(profile.hide_balance)
    }
  }, [profile])

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user])

  const loadDashboardData = async () => {
    if (!user) return
    setLoading(true)

    try {
      // 1. Categorias
      const { data: cats } = await supabase
        .from('categories')
        .select('*')
      const catMap: Record<string, Category> = {}
      cats?.forEach((c) => {
        catMap[c.id] = c
      })
      setCategories(catMap)

      // 2. Transações
      const { data: txs } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('occurred_on', { ascending: false })
      setTransactions(txs || [])

      // 3. Metas
      const { data: userGoals } = await supabase
        .from('financial_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
      setGoals(userGoals || [])
    } catch (err) {
      console.error('Erro ao carregar dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleHideBalance = async () => {
    const newVal = !hideBalance
    setHideBalance(newVal)
    if (user) {
      await supabase
        .from('profiles')
        .update({ hide_balance: newVal })
        .eq('id', user.id)
      refreshProfile()
    }
  }

  const openAddTransaction = (t: 'income' | 'expense') => {
    setModalType(t)
    setIsModalOpen(true)
  }

  // Cálculos financeiros com as funções puras
  const initialBalance = Number(profile?.initial_balance ?? 0)
  const availableBalance = calculateAvailableBalance(initialBalance, transactions)
  const monthlySummary = calculateMonthlySummary(transactions, new Date())

  // Transações recentes (4 últimas)
  const recentTransactions = transactions.slice(0, 4)

  // Meta de reserva
  const emergencyGoal = goals.find((g) => g.category === 'emergency') || goals[0]

  // Metas para exibição nos anéis (até 3)
  const displayGoals = goals.slice(0, 3)

  // Despesas por categoria do mês atual
  const curMonthStr = new Date().toISOString().slice(0, 7)
  const currentMonthExpenses = transactions.filter(
    (t) => t.type === 'expense' && t.occurred_on.startsWith(curMonthStr)
  )

  const categoryTotals: Record<string, number> = {}
  currentMonthExpenses.forEach((t) => {
    categoryTotals[t.category_id] = (categoryTotals[t.category_id] || 0) + Number(t.amount)
  })

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

  const firstName = profile?.full_name?.split(' ')[0] || 'Ana'

  return (
    <AppShell showNav={true} className="px-5 py-6 flex flex-col gap-5">
      {/* 1. Header do Dashboard com mascote */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-deep font-sans flex items-center gap-1.5">
            Olá, {firstName}! 👋
          </h1>
          <p className="text-xs font-semibold text-textSec">
            Sua vida financeira no caminho certo.
          </p>
        </div>
        <div className="shrink-0 -mr-1">
          <Mascot size="sm" />
        </div>
      </div>

      {/* 2. Card "Saldo disponível" (degradê roxo oficial) */}
      <div className="bg-gradient-to-r from-primary to-deep text-white rounded-[24px] p-5 shadow-soft relative overflow-hidden">
        {/* Blob sutil no fundo do card */}
        <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />

        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-white/80">Saldo disponível</span>
          <button
            onClick={toggleHideBalance}
            className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            aria-label={hideBalance ? 'Mostrar saldo' : 'Ocultar saldo'}
          >
            {hideBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <div className="text-3xl font-extrabold font-sans tracking-tight mb-3">
          {hideBalance ? '••••••••' : formatCurrency(availableBalance)}
        </div>

        <div className="flex items-center justify-between text-[11px] font-bold text-white/85">
          {monthlySummary.variationPct !== null ? (
            <span className="bg-white/20 backdrop-blur-xs px-2.5 py-1 rounded-full flex items-center gap-1">
              {monthlySummary.variationPct >= 0 ? '▲' : '▼'}{' '}
              {monthlySummary.variationPct >= 0 ? '+' : ''}
              {monthlySummary.variationPct}%
            </span>
          ) : (
            <span className="bg-white/20 px-2.5 py-1 rounded-full">Saldo estável</span>
          )}
          <span className="text-white/70">Atualizado hoje</span>
        </div>
      </div>

      {/* 3. Linha com 2 mini-cards: Receitas e Despesas */}
      <div className="grid grid-cols-2 gap-3">
        {/* Receitas */}
        <div className="bg-white rounded-[20px] p-4 border border-lilac/15 shadow-card flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-xl bg-success/15 text-success flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" strokeWidth={2.5} />
            </div>
            <span className="text-xs font-bold text-textSec">Receitas</span>
          </div>
          <div className="text-base font-extrabold text-deep">
            {hideBalance ? '••••' : formatCurrency(monthlySummary.income)}
          </div>
        </div>

        {/* Despesas */}
        <div className="bg-white rounded-[20px] p-4 border border-lilac/15 shadow-card flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-xl bg-pink/20 text-danger flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" strokeWidth={2.5} />
            </div>
            <span className="text-xs font-bold text-textSec">Despesas</span>
          </div>
          <div className="text-base font-extrabold text-danger">
            {hideBalance ? '••••' : formatCurrency(monthlySummary.expense)}
          </div>
        </div>
      </div>

      {/* 4. Atalhos rápidos */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => openAddTransaction('expense')}
          className="flex-1 bg-white hover:bg-bg border border-lilac/25 rounded-2xl py-2.5 px-3 flex items-center justify-center gap-1.5 text-xs font-bold text-deep transition-all shadow-xs"
        >
          <div className="w-5 h-5 rounded-full bg-danger/10 text-danger flex items-center justify-center">
            <Plus className="w-3.5 h-3.5" />
          </div>
          <span>Gasto</span>
        </button>

        <button
          onClick={() => openAddTransaction('income')}
          className="flex-1 bg-white hover:bg-bg border border-lilac/25 rounded-2xl py-2.5 px-3 flex items-center justify-center gap-1.5 text-xs font-bold text-deep transition-all shadow-xs"
        >
          <div className="w-5 h-5 rounded-full bg-success/10 text-success flex items-center justify-center">
            <Plus className="w-3.5 h-3.5" />
          </div>
          <span>Receita</span>
        </button>

        <button
          onClick={() => navigate('/simulador')}
          className="flex-1 bg-white hover:bg-bg border border-lilac/25 rounded-2xl py-2.5 px-3 flex items-center justify-center gap-1.5 text-xs font-bold text-primary transition-all shadow-xs"
        >
          <Calculator className="w-4 h-4 text-primary" />
          <span>Simulador</span>
        </button>
      </div>

      {/* 5. Painel de Gastos com barra empilhada (como no layout) */}
      <div className="bg-white rounded-[22px] p-5 border border-lilac/15 shadow-card">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-textSec">Painel de gastos</span>
          <Link
            to="/gastos"
            className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5"
          >
            Este mês <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="text-xl font-extrabold text-deep mb-3">
          {formatCurrency(monthlySummary.expense)}
        </div>

        {/* Barra empilhada multicolorida */}
        <div className="w-full h-3 rounded-full bg-bg overflow-hidden flex mb-3">
          {monthlySummary.expense > 0 ? (
            Object.entries(categoryTotals).map(([catId, amount]) => {
              const cat = categories[catId]
              const pct = (amount / monthlySummary.expense) * 100
              return (
                <div
                  key={catId}
                  className="h-full transition-all duration-500"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: cat?.color || '#B037F8',
                  }}
                  title={`${cat?.name || 'Outros'}: ${formatCurrency(amount)} (${Math.round(pct)}%)`}
                />
              )
            })
          ) : (
            <div className="w-full h-full bg-lilac/20" />
          )}
        </div>

        {/* Legenda simples */}
        <div className="flex flex-wrap gap-2 text-[10px] font-bold text-textSec">
          {Object.entries(categoryTotals).slice(0, 4).map(([catId, amount]) => {
            const cat = categories[catId]
            return (
              <span key={catId} className="flex items-center gap-1">
                <span
                  className="w-2 h-2 rounded-full inline-block"
                  style={{ backgroundColor: cat?.color || '#B037F8' }}
                />
                {cat?.name}: {formatCurrency(amount)}
              </span>
            )
          })}
        </div>
      </div>

      {/* 6. Card Reserva de emergência */}
      {emergencyGoal && (
        <div className="bg-white rounded-[22px] p-5 border border-lilac/15 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-textSec flex items-center gap-1.5">
              <span>★</span> {emergencyGoal.name}
            </span>
            <span className="text-xs font-extrabold text-primary">
              {formatPercent((Number(emergencyGoal.saved_amount) / Number(emergencyGoal.target_amount)) * 100)}
            </span>
          </div>

          <div className="text-sm font-extrabold text-deep mb-2">
            {formatCurrency(emergencyGoal.saved_amount)} de {formatCurrency(emergencyGoal.target_amount)}
          </div>

          <div className="w-full h-2.5 bg-bg rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-lilac rounded-full transition-all duration-700"
              style={{
                width: `${Math.min(
                  100,
                  (Number(emergencyGoal.saved_amount) / Number(emergencyGoal.target_amount)) * 100
                )}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* 7. Progresso das metas (anéis circulares) */}
      {displayGoals.length > 0 && (
        <div className="bg-white rounded-[22px] p-5 border border-lilac/15 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-textSec">Progresso das metas</span>
            <Link
              to="/metas"
              className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5"
            >
              Ver todas <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {displayGoals.map((g) => {
              const metrics = calculateGoalMetrics(g)
              return (
                <div key={g.id} className="flex flex-col items-center text-center">
                  <ProgressRing progress={metrics.progressPct} size={64} strokeWidth={6} />
                  <span className="text-[11px] font-bold text-deep mt-2 truncate w-full">
                    {g.name}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 8. Transações Recentes */}
      <div className="bg-white rounded-[22px] p-5 border border-lilac/15 shadow-card">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-textSec">Transações recentes</span>
          <Link
            to="/gastos"
            className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5"
          >
            Ver todas <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentTransactions.length > 0 ? (
          <div className="flex flex-col divide-y divide-lilac/10">
            {recentTransactions.map((tx) => {
              const cat = categories[tx.category_id]
              const isIncome = tx.type === 'income'
              return (
                <Link
                  key={tx.id}
                  to={`/gastos/${tx.id}`}
                  className="py-3 flex items-center justify-between hover:bg-bg/50 px-1 rounded-xl transition-colors"
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
                      <div className="text-[11px] font-semibold text-textSec">
                        {cat?.name || 'Gasto'}
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
          <div className="py-6 text-center text-xs font-bold text-textSec">
            Nenhuma transação recente. Que tal registrar a primeira? ✨
          </div>
        )}
      </div>

      {/* Frase motivacional acolhedora */}
      <div className="bg-baby/40 border border-blue-100/60 rounded-2xl p-3.5 text-center text-xs font-semibold text-deep/80">
        💜 "Pequenos passos também são conquistas."
      </div>

      {/* Modal de Transação */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialType={modalType}
        onSuccess={loadDashboardData}
      />
    </AppShell>
  )
}
