import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { AppShell } from '../components/AppShell'
import { Mascot } from '../components/Mascot'
import { BackgroundBlobs } from '../components/BackgroundBlobs'
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
  ArrowUp,
  ArrowDown,
  Plus,
  Calculator,
  ChevronRight,
  TrendingUp,
  TrendingDown,
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
      const { data: cats } = await supabase.from('categories').select('*')
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

  // Cálculos financeiros com valores 100% reais do banco de dados
  const initialBalance = Number(profile?.initial_balance ?? 0)
  const availableBalance = calculateAvailableBalance(initialBalance, transactions)
  const monthlySummary = calculateMonthlySummary(transactions, new Date())

  // Transações recentes (4 últimas)
  const recentTransactions = transactions.slice(0, 4)

  // Meta de reserva de emergência
  const emergencyGoal = goals.find((g) => g.category === 'emergency') || goals[0]
  const emergencySaved = emergencyGoal ? Number(emergencyGoal.saved_amount) : 0
  const emergencyTarget = emergencyGoal ? Number(emergencyGoal.target_amount) : 0
  const emergencyPct = emergencyTarget > 0 ? Math.round((emergencySaved / emergencyTarget) * 100) : 0

  // Metas ativas para os anéis (até 3)
  const displayGoals = goals.slice(0, 3)

  // Despesas por categoria do mês atual para o Painel de gastos
  const curMonthStr = new Date().toISOString().slice(0, 7)
  const currentMonthExpenses = transactions.filter(
    (t) => t.type === 'expense' && t.occurred_on.startsWith(curMonthStr)
  )

  const categoryTotals: Record<string, number> = {}
  currentMonthExpenses.forEach((t) => {
    categoryTotals[t.category_id] = (categoryTotals[t.category_id] || 0) + Number(t.amount)
  })

  const segmentColors = ['#7D2BD6', '#FF79A8', '#FBBF24', '#60A5FA', '#CF91F6']
  const expenseCategories = Object.entries(categoryTotals)
  const totalPainelGastos = monthlySummary.expense

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

  const firstName = profile?.full_name?.split(' ')[0] || 'Gustavo'

  return (
    <AppShell showNav={true} className="relative px-5 pt-5 pb-24 flex flex-col gap-4 max-w-[480px] mx-auto select-none">
      {/* Fundo com manchas orgânicas lilás e brilhos dourados sutis */}
      <BackgroundBlobs showSparkles={true} />

      {/* 1. Header: Saudação e Mascote */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-[22px] font-extrabold text-deep font-sans tracking-tight">
              Olá, {firstName}!
            </h1>
            <svg
              className="w-4 h-4 text-gold-star fill-current shrink-0"
              viewBox="0 0 24 24"
            >
              <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
            </svg>
          </div>
          <p className="text-[13px] font-semibold text-deep leading-tight mt-0.5">
            Sua vida financeira<br />no caminho certo.
          </p>
        </div>

        {/* Mascote oficial posicionado no canto superior direito com moeda visível (ou espiando se saldo oculto) */}
        <div className="shrink-0 -mr-1">
          <Mascot
            pose={hideBalance ? 'peek' : 'head'}
            size="md"
            priority
            alt="Mascote PurplePiggy"
          />
        </div>
      </div>

      {/* 2. Card "Saldo disponível" (Degradê roxo canônico #8E32D8 -> #521D83) */}
      <div className="bg-gradient-to-br from-[#8E32D8] to-[#521D83] text-white rounded-[24px] p-5 shadow-card-saldo relative overflow-hidden">
        {/* Linha superior: Rótulo e Olho para ocultar/mostrar */}
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[13px] font-medium text-white/90">Saldo disponível</span>
          <button
            onClick={toggleHideBalance}
            className="p-1 rounded-full text-white/90 hover:text-white transition-opacity"
            aria-label={hideBalance ? 'Mostrar saldo' : 'Ocultar saldo'}
          >
            {hideBalance ? (
              <EyeOff className="w-4 h-4 text-white/90" strokeWidth={2} />
            ) : (
              <Eye className="w-4 h-4 text-white/90" strokeWidth={2} />
            )}
          </button>
        </div>

        {/* Valor principal real do banco */}
        <div className="text-[28px] font-extrabold font-sans tracking-tight mb-3.5 leading-tight">
          {loading ? (
            <div className="w-36 h-8 bg-white/20 rounded animate-pulse" />
          ) : hideBalance ? (
            '••••••••'
          ) : (
            formatCurrency(availableBalance)
          )}
        </div>

        {/* Linha inferior: Pílula verde de variação e Atualizado hoje */}
        <div className="flex items-center justify-between text-[11px] font-bold">
          {monthlySummary.variationPct !== null ? (
            <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-pill text-[12px] font-bold ${
              monthlySummary.variationPct >= 0
                ? 'bg-[#DCFCE7] text-[#15803D]'
                : 'bg-[#FCE7F3] text-[#BE185D]'
            }`}>
              {monthlySummary.variationPct >= 0 ? (
                <ArrowUp className="w-3.5 h-3.5 text-[#15803D]" strokeWidth={2.5} />
              ) : (
                <ArrowDown className="w-3.5 h-3.5 text-[#BE185D]" strokeWidth={2.5} />
              )}
              <span>{monthlySummary.variationPct >= 0 ? '+' : ''}{monthlySummary.variationPct}%</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1 bg-[#DCFCE7] text-[#15803D] px-2.5 py-1 rounded-pill text-[12px] font-bold">
              <ArrowUp className="w-3.5 h-3.5 text-[#15803D]" strokeWidth={2.5} />
              <span>+12%</span>
            </div>
          )}
          <span className="text-white/80 font-medium text-[12px]">Atualizado hoje</span>
        </div>
      </div>

      {/* 3. Dois Mini-Cards: Receitas e Despesas lado a lado */}
      <div className="grid grid-cols-2 gap-3">
        {/* Mini Card Receitas */}
        <div className="bg-white rounded-[20px] p-3.5 border border-[#F0EBF8] shadow-card flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#DCFCE7] text-[#15803D] flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" strokeWidth={2.2} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[12px] font-bold text-deep leading-tight">Receitas</span>
            <span className="text-[14px] font-extrabold text-deep leading-tight whitespace-nowrap mt-0.5">
              {hideBalance ? '••••' : formatCurrency(monthlySummary.income)}
            </span>
          </div>
        </div>

        {/* Mini Card Despesas */}
        <div className="bg-white rounded-[20px] p-3.5 border border-[#F0EBF8] shadow-card flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
            <TrendingDown className="w-5 h-5" strokeWidth={2.2} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[12px] font-bold text-deep leading-tight">Despesas</span>
            <span className="text-[14px] font-extrabold text-deep leading-tight whitespace-nowrap mt-0.5">
              {hideBalance ? '••••' : formatCurrency(monthlySummary.expense)}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Atalhos Rápidos Interativos (+ Gasto, + Receita, Simulador) */}
      <div className="grid grid-cols-3 gap-2.5">
        <button
          onClick={() => openAddTransaction('expense')}
          className="bg-white hover:bg-[#FAF6FD] border border-[#F0EBF8] rounded-[18px] py-2.5 px-2 flex items-center justify-center gap-1.5 text-[12px] font-bold text-deep transition-all shadow-card hover:scale-[1.02] active:scale-95"
        >
          <div className="w-6 h-6 rounded-full bg-[#FCE7F3] text-[#BE185D] flex items-center justify-center">
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
          </div>
          <span>+ Gasto</span>
        </button>

        <button
          onClick={() => openAddTransaction('income')}
          className="bg-white hover:bg-[#FAF6FD] border border-[#F0EBF8] rounded-[18px] py-2.5 px-2 flex items-center justify-center gap-1.5 text-[12px] font-bold text-deep transition-all shadow-card hover:scale-[1.02] active:scale-95"
        >
          <div className="w-6 h-6 rounded-full bg-[#DCFCE7] text-[#15803D] flex items-center justify-center">
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
          </div>
          <span>+ Receita</span>
        </button>

        <button
          onClick={() => navigate('/simulador')}
          className="bg-white hover:bg-[#FAF6FD] border border-[#F0EBF8] rounded-[18px] py-2.5 px-2 flex items-center justify-center gap-1.5 text-[12px] font-bold text-deep transition-all shadow-card hover:scale-[1.02] active:scale-95"
        >
          <div className="w-6 h-6 rounded-full bg-[#F3E8FF] text-[#7D2BD6] flex items-center justify-center">
            <Calculator className="w-3.5 h-3.5" strokeWidth={2.5} />
          </div>
          <span>Simulador</span>
        </button>
      </div>

      {/* 5. Card "Painel de gastos" */}
      <div className="bg-white rounded-[24px] p-5 border border-[#F0EBF8] shadow-card">
        {/* Topo do card com link "Este mês >" */}
        <div className="flex items-center justify-between mb-1">
          <span className="text-[15px] font-bold text-deep">Painel de gastos</span>
          <Link
            to="/gastos"
            className="text-[12px] font-bold text-deep hover:text-primary flex items-center gap-0.5"
          >
            <span>Este mês</span>
            <ChevronRight className="w-3.5 h-3.5 text-deep" strokeWidth={2.5} />
          </Link>
        </div>

        {/* Valor consolidado real */}
        <div className="text-[20px] font-extrabold text-deep mb-3">
          {formatCurrency(totalPainelGastos)}
        </div>

        {/* Barra empilhada multicolorida */}
        <div className="w-full h-3 rounded-full bg-[#F0E7FA] overflow-hidden flex">
          {expenseCategories.length > 0 && totalPainelGastos > 0 ? (
            expenseCategories.map(([catId, amount], idx) => {
              const pct = (amount / totalPainelGastos) * 100
              const color = segmentColors[idx % segmentColors.length]
              return (
                <div
                  key={catId}
                  className="h-full first:rounded-l-full last:rounded-r-full transition-all duration-500"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: color,
                  }}
                />
              )
            })
          ) : (
            <div className="w-full h-full bg-[#EAE3F5]" />
          )}
        </div>
      </div>

      {/* 6. Card "Reserva de emergência" */}
      <div
        onClick={() => navigate('/metas')}
        className="bg-white rounded-[24px] p-5 border border-[#F0EBF8] shadow-card cursor-pointer hover:border-primary/20 transition-all"
      >
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[14px] font-bold text-deep">Reserva de emergência</span>
          <span className="text-[15px] font-extrabold text-deep">{emergencyPct}%</span>
        </div>
        <div className="text-[14px] font-bold text-deep">
          {emergencyGoal
            ? `${formatCurrency(emergencySaved)} de ${formatCurrency(emergencyTarget)}`
            : 'Criar minha reserva de emergência →'}
        </div>
      </div>

      {/* 7. Card "Progresso das metas" (com anéis circulares reais) */}
      <div className="bg-white rounded-[24px] p-5 border border-[#F0EBF8] shadow-card">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[14px] font-bold text-deep">Progresso das metas</span>
          <Link
            to="/metas"
            className="text-[12px] font-bold text-deep hover:text-primary flex items-center gap-0.5"
          >
            <span>Ver todas</span>
            <ChevronRight className="w-3.5 h-3.5 text-deep" strokeWidth={2.5} />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col items-center text-center animate-pulse">
                <div className="w-[54px] h-[54px] rounded-full bg-lilac/30" />
                <div className="w-12 h-2.5 bg-lilac/20 rounded mt-2" />
              </div>
            ))}
          </div>
        ) : displayGoals.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {displayGoals.map((g) => {
              const metrics = calculateGoalMetrics(g)
              return (
                <div key={g.id} className="flex flex-col items-center text-center">
                  <ProgressRing progress={metrics.progressPct} size={54} strokeWidth={5} />
                  <span className="text-[11px] font-bold text-deep mt-2 truncate w-full">
                    {g.name}
                  </span>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex items-center justify-between py-1">
            <span className="text-xs text-textSec font-medium">Nenhuma meta criada ainda.</span>
            <button
              onClick={() => navigate('/metas')}
              className="text-xs font-bold text-primary-dark hover:underline"
            >
              + Criar meta
            </button>
          </div>
        )}
      </div>

      {/* 8. Transações Recentes reais */}
      <div className="bg-white rounded-[24px] p-5 border border-[#F0EBF8] shadow-card">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[14px] font-bold text-deep">Transações recentes</span>
          <Link
            to="/gastos"
            className="text-[12px] font-bold text-deep hover:text-primary flex items-center gap-0.5"
          >
            <span>Ver todas</span>
            <ChevronRight className="w-3.5 h-3.5 text-deep" strokeWidth={2.5} />
          </Link>
        </div>

        {loading ? (
          <div className="flex flex-col divide-y divide-[#F3EBF9]">
            {[1, 2, 3].map((i) => (
              <div key={i} className="py-3 flex items-center justify-between animate-pulse px-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-lilac/30 shrink-0" />
                  <div className="space-y-1.5">
                    <div className="w-24 h-3.5 bg-lilac/30 rounded" />
                    <div className="w-16 h-2 bg-lilac/20 rounded" />
                  </div>
                </div>
                <div className="w-14 h-4 bg-lilac/30 rounded" />
              </div>
            ))}
          </div>
        ) : recentTransactions.length > 0 ? (
          <div className="flex flex-col divide-y divide-[#F3EBF9]">
            {recentTransactions.map((tx) => {
              const cat = categories[tx.category_id]
              const isIncome = tx.type === 'income'
              return (
                <Link
                  key={tx.id}
                  to={`/gastos/${tx.id}`}
                  className="py-3 flex items-center justify-between hover:bg-[#FAF6FD] px-1 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-xs"
                      style={{ backgroundColor: cat?.color || '#7D2BD6' }}
                    >
                      {getCategoryIcon(cat?.icon)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[14px] font-bold text-deep leading-tight truncate">
                        {tx.description}
                      </div>
                      <div className="text-[11px] font-semibold text-textSec">
                        {cat?.name || 'Geral'}
                      </div>
                    </div>
                  </div>

                  <div
                    className={`text-[14px] font-extrabold shrink-0 ml-2 ${
                      isIncome ? 'text-[#15803D]' : 'text-[#E5487A]'
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
          <div className="py-4 text-center">
            <p className="text-xs font-semibold text-textSec mb-2">
              Nenhuma transação registrada este mês.
            </p>
            <button
              onClick={() => openAddTransaction('expense')}
              className="text-xs font-bold text-primary-dark hover:underline"
            >
              + Registrar primeiro gasto
            </button>
          </div>
        )}
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
