import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { AppShell } from '../components/AppShell'
import { Card } from '../components/Card'
import { Mascot } from '../components/Mascot'
import { CategoryCircle } from '../components/CategoryIcon'
import { BackgroundBlobs } from '../components/BackgroundBlobs'
import { ProgressRing } from '../components/ProgressRing'
import { TransactionModal } from '../components/TransactionModal'
import {
  calculateAvailableBalance,
  calculateMonthlySummary,
  calculateGoalMetrics,
} from '../lib/finance'
import { formatCurrency } from '../lib/format'
import {
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Plus,
  Calculator,
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
      const { data: g } = await supabase
        .from('financial_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      setGoals(g || [])
    } finally {
      setLoading(false)
    }
  }

  // Cálculos financeiros reais
  const initialBalance = Number(profile?.initial_balance ?? 0)
  const availableBalance = calculateAvailableBalance(initialBalance, transactions)
  const monthlySummary = calculateMonthlySummary(transactions, new Date())

  // Meta de reserva de emergência
  const emergencyGoal = goals.find((g) => g.category === 'emergency') || goals[0]
  const emergencySaved = emergencyGoal ? Number(emergencyGoal.saved_amount) : 0
  const emergencyTarget = emergencyGoal ? Number(emergencyGoal.target_amount) : 0
  const emergencyPct = emergencyTarget > 0 ? Math.round((emergencySaved / emergencyTarget) * 100) : 60

  // Painel de gastos: consolidado por categorias
  const currentMonth = new Date().toISOString().slice(0, 7)
  const currentMonthExpenses = transactions.filter(
    (t) => t.type === 'expense' && t.occurred_on.startsWith(currentMonth)
  )

  const expensesByCategory: Record<string, number> = {}
  currentMonthExpenses.forEach((t) => {
    expensesByCategory[t.category_id] =
      (expensesByCategory[t.category_id] || 0) + Number(t.amount)
  })

  const totalPainelGastos = currentMonthExpenses.reduce(
    (acc, t) => acc + Number(t.amount),
    0
  )

  // Cores dos segmentos da barra empilhada
  const segmentColors = ['#8E32D8', '#B037F8', '#F5B83D', '#2FBF71', '#38BDF8', '#F472B6']
  const expenseCategories = Object.entries(expensesByCategory)

  // Metas para exibir nos anéis circulares (até 3)
  const displayGoals = goals.slice(0, 3)

  // Transações recentes (até 5)
  const recentTransactions = transactions.slice(0, 5)

  const toggleHideBalance = async () => {
    const nextVal = !hideBalance
    setHideBalance(nextVal)
    if (user) {
      await supabase.from('profiles').update({ hide_balance: nextVal }).eq('id', user.id)
      refreshProfile()
    }
  }

  const firstName = profile?.full_name?.split(' ')[0] || 'Gustavo'

  return (
    <AppShell showNav={true} className="relative pt-4 flex flex-col gap-3.5 select-none">
      {/* Fundo com manchas orgânicas lilás e brilhos dourados sutis */}
      <BackgroundBlobs showSparkles={true} />

      {/* 1. Header: Saudação oficial */}
      <div className="w-full pt-1 pb-0 min-w-0 max-w-[260px]">
        <h1 className="text-[22px] font-extrabold text-[#33105D] font-sans tracking-tight leading-tight truncate">
          Olá, {firstName}! 👋
        </h1>
        <p className="text-[13px] font-bold text-[#581C87]/75 leading-tight mt-0.5">
          Sua vida financeira<br />no caminho certo.
        </p>
      </div>

      {/* 2. Card "Saldo disponível" com Mascote pig-peek GRANDE apoiado na borda superior */}
      <div className="relative w-full mt-3 min-w-0">
        {/* Mascote pig-peek grande com patinhas apoiadas na borda superior do card */}
        <div
          className="absolute right-2 z-20 pointer-events-none select-none"
          style={{ top: 0, transform: 'translateY(-79.6%)' }}
        >
          <div className="w-32 h-auto drop-shadow-md">
            <Mascot
              pose="peek"
              priority
              alt="Mascote PurplePiggy espiando sobre o card de saldo"
              className="w-full h-auto object-contain"
            />
          </div>
        </div>
        <div className="w-full bg-gradient-to-br from-[#8E32D8] to-[#521D83] text-white rounded-[24px] p-5 shadow-card-saldo relative overflow-hidden min-w-0">
          {/* Linha superior: Rótulo e Olho para ocultar/mostrar */}
          <div className="flex items-center justify-between mb-1.5 min-w-0">
            <span className="text-[13px] font-medium text-white/90">Saldo disponível</span>
            <button
              onClick={toggleHideBalance}
              className="p-1 rounded-full text-white/90 hover:text-white transition-opacity cursor-pointer"
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
          <div className="text-[28px] font-extrabold font-sans tracking-tight mb-3.5 leading-tight truncate min-w-0">
            {loading ? (
              <div className="w-full max-w-[144px] h-8 bg-white/20 rounded animate-pulse" />
            ) : hideBalance ? (
              '••••••••'
            ) : (
              formatCurrency(availableBalance)
            )}
          </div>

          {/* Linha inferior: Pílula verde de variação e Atualizado hoje */}
          <div className="flex items-center justify-between text-[11px] font-bold min-w-0">
            {monthlySummary.variationPct !== null ? (
              <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-pill text-[12px] font-bold shrink-0 ${
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
              <div className="inline-flex items-center gap-1 bg-[#DCFCE7] text-[#15803D] px-2.5 py-1 rounded-pill text-[12px] font-bold shrink-0">
                <ArrowUp className="w-3.5 h-3.5 text-[#15803D]" strokeWidth={2.5} />
                <span>+12%</span>
              </div>
            )}
            <span className="text-white/80 font-medium text-[12px] shrink-0">Atualizado hoje</span>
          </div>
        </div>
      </div>

      {/* 3. Dois Mini-Cards: Receitas e Despesas lado a lado fiel a design/telas/06-home.png */}
      <div className="w-full grid grid-cols-2 gap-3 min-w-0">
        {/* Mini Card Receitas */}
        <Card size="sm" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#DCFCE7] text-[#15803D] flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" strokeWidth={2.2} />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-[12px] font-bold text-deep leading-tight">Receitas</span>
            <span className="text-[14px] font-extrabold text-deep leading-tight truncate mt-0.5">
              {hideBalance ? '••••' : formatCurrency(monthlySummary.income)}
            </span>
          </div>
        </Card>

        {/* Mini Card Despesas */}
        <Card size="sm" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
            <TrendingDown className="w-5 h-5" strokeWidth={2.2} />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-[12px] font-bold text-deep leading-tight">Despesas</span>
            <span className="text-[14px] font-extrabold text-deep leading-tight truncate mt-0.5">
              {hideBalance ? '••••' : formatCurrency(monthlySummary.expense)}
            </span>
          </div>
        </Card>
      </div>

      {/* 4. Atalhos Rápidos Interativos (+ Gasto, + Receita, Simulador) */}
      <div className="w-full grid grid-cols-3 gap-2.5 min-w-0">
        <button
          onClick={() => {
            setModalType('expense')
            setIsModalOpen(true)
          }}
          className="w-full bg-white hover:bg-[#FAF6FD] border border-[#F0EBF8] rounded-[18px] py-2.5 px-2 flex items-center justify-center gap-1.5 text-[12px] font-bold text-deep transition-all shadow-card hover:scale-[1.02] active:scale-95 min-w-0 cursor-pointer"
        >
          <div className="w-6 h-6 rounded-full bg-[#FCE7F3] text-[#BE185D] flex items-center justify-center shrink-0">
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
          </div>
          <span className="truncate">+ Gasto</span>
        </button>

        <button
          onClick={() => {
            setModalType('income')
            setIsModalOpen(true)
          }}
          className="w-full bg-white hover:bg-[#FAF6FD] border border-[#F0EBF8] rounded-[18px] py-2.5 px-2 flex items-center justify-center gap-1.5 text-[12px] font-bold text-deep transition-all shadow-card hover:scale-[1.02] active:scale-95 min-w-0 cursor-pointer"
        >
          <div className="w-6 h-6 rounded-full bg-[#DCFCE7] text-[#15803D] flex items-center justify-center shrink-0">
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
          </div>
          <span className="truncate">+ Receita</span>
        </button>

        <button
          onClick={() => navigate('/simulador')}
          className="w-full bg-white hover:bg-[#FAF6FD] border border-[#F0EBF8] rounded-[18px] py-2.5 px-2 flex items-center justify-center gap-1.5 text-[12px] font-bold text-deep transition-all shadow-card hover:scale-[1.02] active:scale-95 min-w-0 cursor-pointer"
        >
          <div className="w-6 h-6 rounded-full bg-[#F3E8FF] text-[#7D2BD6] flex items-center justify-center shrink-0">
            <Calculator className="w-3.5 h-3.5" strokeWidth={2.5} />
          </div>
          <span className="truncate">Simulador</span>
        </button>
      </div>

      {/* 4. Card "Painel de gastos" com link Este mês > e barra segmentada multicolorida */}
      <Card>
        <div className="flex items-center justify-between mb-1 min-w-0">
          <span className="text-[15px] font-extrabold text-deep">Painel de gastos</span>
          <Link
            to="/gastos"
            className="text-[12px] font-extrabold text-deep hover:text-primary flex items-center gap-0.5 shrink-0"
          >
            <span>Este mês</span>
            <ChevronRight className="w-3.5 h-3.5 text-deep" strokeWidth={2.5} />
          </Link>
        </div>

        {/* Valor consolidado */}
        <div className="text-[20px] font-extrabold text-deep mb-2.5 truncate min-w-0">
          {formatCurrency(totalPainelGastos > 0 ? totalPainelGastos : 1420)}
        </div>

        {/* Barra empilhada multicolorida */}
        <div className="w-full h-3 rounded-full bg-[#F0E7FA] overflow-hidden flex min-w-0">
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
            <>
              <div className="h-full w-[35%] bg-[#8E32D8] rounded-l-full" />
              <div className="h-full w-[25%] bg-[#B037F8]" />
              <div className="h-full w-[20%] bg-[#F5B83D]" />
              <div className="h-full w-[20%] bg-[#2FBF71] rounded-r-full" />
            </>
          )}
        </div>
      </Card>

      {/* 5. Card "Reserva de emergência" fiel a design/telas/06-home.png */}
      <Card
        onClick={() => navigate('/metas')}
        hoverEffect={true}
      >
        <div className="flex items-center justify-between mb-1 min-w-0">
          <span className="text-[14px] font-extrabold text-deep">Reserva de emergência</span>
          <span className="text-[15px] font-extrabold text-deep shrink-0">{emergencyPct}%</span>
        </div>
        <div className="text-[13px] font-bold text-deep/75 truncate min-w-0">
          {emergencyGoal
            ? `${formatCurrency(emergencySaved)} de ${formatCurrency(emergencyTarget)}`
            : 'R$ 6.000,00 de R$ 10.000,00'}
        </div>
        {/* Barra de progresso da reserva de emergência */}
        <div className="w-full h-2 rounded-full bg-[#F3E8FF] overflow-hidden mt-2.5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#8E32D8] to-[#6C22BD] transition-all duration-500"
            style={{ width: `${Math.min(emergencyPct, 100)}%` }}
          />
        </div>
      </Card>

      {/* 6. Card "Progresso das metas" com anéis circulares */}
      <Card>
        <div className="flex items-center justify-between mb-3.5 min-w-0">
          <span className="text-[14px] font-extrabold text-deep">Progresso das metas</span>
          <Link
            to="/metas"
            className="text-[12px] font-extrabold text-deep hover:text-primary flex items-center gap-0.5 shrink-0"
          >
            <span>Ver todas</span>
            <ChevronRight className="w-3.5 h-3.5 text-deep" strokeWidth={2.5} />
          </Link>
        </div>

        {loading ? (
          <div className="w-full grid grid-cols-3 gap-2 min-w-0">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-full flex flex-col items-center text-center animate-pulse min-w-0">
                <div className="w-[54px] h-[54px] rounded-full bg-lilac/30 shrink-0" />
                <div className="w-12 h-2.5 bg-lilac/20 rounded mt-2" />
              </div>
            ))}
          </div>
        ) : displayGoals.length > 0 ? (
          <div className="w-full grid grid-cols-3 gap-2 min-w-0">
            {displayGoals.map((g) => {
              const metrics = calculateGoalMetrics(g)
              return (
                <div key={g.id} className="w-full flex flex-col items-center text-center min-w-0">
                  <ProgressRing progress={metrics.progressPct} size={54} strokeWidth={5} />
                  <span className="text-[11px] font-extrabold text-deep mt-2 truncate w-full">
                    {g.name}
                  </span>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex items-center justify-between py-1 min-w-0">
            <span className="text-xs text-textSec font-medium truncate">Nenhuma meta criada ainda.</span>
            <button
              onClick={() => navigate('/metas')}
              className="text-xs font-bold text-primary-dark hover:underline shrink-0 ml-2 cursor-pointer"
            >
              + Criar meta
            </button>
          </div>
        )}
      </Card>

      {/* 7. Transações Recentes reais */}
      <Card>
        <div className="flex items-center justify-between mb-2 min-w-0">
          <span className="text-[14px] font-extrabold text-deep">Transações recentes</span>
          <Link
            to="/gastos"
            className="text-[12px] font-extrabold text-deep hover:text-primary flex items-center gap-0.5 shrink-0"
          >
            <span>Ver todas</span>
            <ChevronRight className="w-3.5 h-3.5 text-deep" strokeWidth={2.5} />
          </Link>
        </div>

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
        ) : recentTransactions.length > 0 ? (
          <div className="w-full flex flex-col divide-y divide-[#F3EBF9] min-w-0">
            {recentTransactions.map((tx) => {
              const cat = categories[tx.category_id]
              const isIncome = tx.type === 'income'
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
                      <div className="text-[14px] font-bold text-deep leading-tight truncate">
                        {tx.description}
                      </div>
                      <div className="text-[11px] font-semibold text-textSec truncate">
                        {cat?.name || 'Geral'}
                      </div>
                    </div>
                  </div>

                  <div
                    className={`text-[14px] font-extrabold shrink-0 ml-2 ${
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
          <div className="py-3 text-center min-w-0">
            <p className="text-xs font-semibold text-textSec mb-1.5">
              Nenhuma transação registrada este mês.
            </p>
            <button
              onClick={() => {
                setModalType('expense')
                setIsModalOpen(true)
              }}
              className="text-xs font-bold text-primary-dark hover:underline cursor-pointer"
            >
              + Registrar primeiro gasto
            </button>
          </div>
        )}
      </Card>

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

export default DashboardPage
