import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { AppShell } from '../components/AppShell'
import { Mascot } from '../components/Mascot'
import { Decor } from '../components/Decor'
import { CategoryCircle } from '../components/CategoryIcon'
import { BackgroundBlobs } from '../components/BackgroundBlobs'
import { ProgressRing } from '../components/ProgressRing'
import { TransactionModal } from '../components/TransactionModal'
import { toast } from 'sonner'
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
  Bell,
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
    <AppShell showNav={true} className="relative pt-4 flex flex-col gap-3.5 select-none pb-24">
      {/* Fundo com manchas orgânicas lilás e brilhos dourados sutis */}
      <BackgroundBlobs showSparkles={true} />

      {/* 1. Header: Saudação oficial + Botão de Notificação (Fiel à Imagem 3) */}
      <div className="w-full pt-1 pb-0 flex items-center justify-between min-w-0">
        <div className="min-w-0 flex-1">
          <h1 className="text-[22px] font-extrabold text-[#432171] font-nunito tracking-tight leading-tight truncate">
            Olá, {firstName}! 👋
          </h1>
          <p className="text-[13px] font-bold text-[#7D6A9C] leading-tight mt-0.5 font-nunito">
            Sua vida financeira no caminho certo.
          </p>
        </div>
        <button
          type="button"
          onClick={() => toast('Nenhuma notificação nova no momento.')}
          aria-label="Notificações"
          className="w-10 h-10 rounded-full bg-white shadow-card border border-lilac/20 flex items-center justify-center text-[#432171] hover:bg-[#F8F5FC] active:scale-95 transition-all shrink-0 ml-3 cursor-pointer"
        >
          <Bell className="w-4.5 h-4.5 text-[#432171]" />
        </button>
      </div>

      {/* 2. Card "Saldo disponível" com Mascote apoiado diretamente na borda superior */}
      <div className="relative w-full mt-6 min-w-0">
        {/* Mascote PurplePiggy espiando com as patinhas apoiadas perfeitamente na borda do card */}
        <div
          className="absolute right-3 z-20 pointer-events-none select-none"
          style={{ bottom: 'calc(100% - 22px)' }}
        >
          <Mascot
            pose="peek"
            size="lg"
            priority
            alt="Mascote PurplePiggy apoiado sobre o card de saldo"
            className="w-28 h-28 object-contain drop-shadow-md"
          />
        </div>
        <div className="w-full bg-gradient-to-br from-[#8E32D8] via-[#7D2BD6] to-[#521D83] text-white rounded-[24px] p-5 shadow-card-saldo relative overflow-hidden min-w-0">
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
                <span>+2,5%</span>
              </div>
            )}
            <span className="text-white/80 font-medium text-[12px] shrink-0">Atualizado hoje</span>
          </div>
        </div>
      </div>

      {/* 3. Dois Mini-Cards: Receitas e Despesas lado a lado fiel à Imagem 3 */}
      <div className="w-full grid grid-cols-2 gap-3 min-w-0">
        {/* Mini Card Receitas */}
        <div className="w-full bg-white rounded-[20px] p-3.5 border border-[#F0EBF8] shadow-card flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#DCFCE7] text-[#15803D] flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" strokeWidth={2.2} />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-[12px] font-bold text-deep leading-tight">Receitas</span>
            <span className="text-[14px] font-extrabold text-deep leading-tight truncate mt-0.5">
              {hideBalance ? '••••' : formatCurrency(monthlySummary.income)}
            </span>
          </div>
        </div>

        {/* Mini Card Despesas */}
        <div className="w-full bg-white rounded-[20px] p-3.5 border border-[#F0EBF8] shadow-card flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#FCE7F3] text-[#BE185D] flex items-center justify-center shrink-0">
            <TrendingDown className="w-5 h-5" strokeWidth={2.2} />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-[12px] font-bold text-deep leading-tight">Despesas</span>
            <span className="text-[14px] font-extrabold text-deep leading-tight truncate mt-0.5">
              {hideBalance ? '••••' : formatCurrency(monthlySummary.expense)}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Card "Reserva de emergência" (Fiel à Imagem 3: com ícone de porquinho e barra cheia) */}
      <div
        onClick={() => navigate('/metas')}
        className="w-full bg-white rounded-[24px] p-4.5 border border-[#F0EBF8] shadow-card cursor-pointer hover:border-primary/20 transition-all min-w-0"
      >
        <div className="flex items-center justify-between mb-2 min-w-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#F3E8FF] flex items-center justify-center shrink-0">
              <Mascot pose="head" size="xs" />
            </div>
            <div className="min-w-0">
              <span className="text-[14px] font-extrabold text-deep block leading-tight">Reserva de emergência</span>
              <span className="text-[12px] font-bold text-[#7D6A9C] leading-tight block mt-0.5 truncate">
                {emergencyGoal
                  ? `${formatCurrency(emergencySaved)} de ${formatCurrency(emergencyTarget)}`
                  : 'R$ 6.000,00 de R$ 10.000,00'}
              </span>
            </div>
          </div>
          <span className="text-[15px] font-extrabold text-deep shrink-0 ml-2">{emergencyPct}%</span>
        </div>
        {/* Barra de progresso da reserva de emergência */}
        <div className="w-full h-2.5 rounded-full bg-[#F3E8FF] overflow-hidden mt-2">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#8E32D8] to-[#B037F8] transition-all duration-500"
            style={{ width: `${Math.min(emergencyPct, 100)}%` }}
          />
        </div>
      </div>

      {/* 5. Seção "Suas metas" com link Ver todas > (Fiel à Imagem 3: card horizontal com baú) */}
      <div className="w-full min-w-0">
        <div className="flex items-center justify-between mb-2 px-1 min-w-0">
          <span className="text-[15px] font-extrabold text-deep font-nunito">Suas metas</span>
          <Link
            to="/metas"
            className="text-[12px] font-extrabold text-[#7D2BD6] hover:text-[#5B21B6] flex items-center gap-0.5 shrink-0"
          >
            <span>Ver todas</span>
            <ChevronRight className="w-3.5 h-3.5" strokeWidth={2.5} />
          </Link>
        </div>

        {displayGoals.length > 0 ? (
          <div
            onClick={() => navigate('/metas')}
            className="w-full bg-white rounded-[22px] p-4 border border-[#F0EBF8] shadow-card flex items-center justify-between cursor-pointer hover:border-primary/20 transition-all min-w-0"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-11 h-11 rounded-2xl bg-[#FEF3C7] flex items-center justify-center shrink-0 shadow-xs">
                <img src="/assets/icons/icon-bau.png" alt="Baú de Metas" className="w-6 h-6 object-contain" />
              </div>
              <div className="min-w-0 flex-1 pr-2">
                <span className="text-[14px] font-extrabold text-deep block truncate">
                  {displayGoals[0].name}
                </span>
                <span className="text-[12px] font-bold text-[#7D6A9C] block mt-0.5 truncate">
                  {formatCurrency(displayGoals[0].saved_amount)} de {formatCurrency(displayGoals[0].target_amount)}
                </span>
                <div className="w-full h-2 rounded-full bg-[#F3E8FF] overflow-hidden mt-2">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#7D2BD6] to-[#CF91F6] transition-all duration-500"
                    style={{
                      width: `${Math.min(Math.round((displayGoals[0].saved_amount / displayGoals[0].target_amount) * 100), 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
            <span className="text-[12px] font-black text-[#15803D] bg-[#DCFCE7] px-2.5 py-1 rounded-full shrink-0">
              {Math.min(Math.round((displayGoals[0].saved_amount / displayGoals[0].target_amount) * 100), 100)}%
            </span>
          </div>
        ) : (
          <div
            onClick={() => navigate('/metas')}
            className="w-full bg-white rounded-[22px] p-4 border border-[#F0EBF8] shadow-card flex items-center justify-between cursor-pointer hover:border-primary/20 transition-all min-w-0"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-11 h-11 rounded-2xl bg-[#FEF3C7] flex items-center justify-center shrink-0 shadow-xs">
                <img src="/assets/icons/icon-bau.png" alt="Baú de Metas" className="w-6 h-6 object-contain" />
              </div>
              <div className="min-w-0 flex-1 pr-2">
                <span className="text-[14px] font-extrabold text-deep block truncate">Viagem dos sonhos</span>
                <span className="text-[12px] font-bold text-[#7D6A9C] block mt-0.5 truncate">
                  R$ 1.750,00 de R$ 5.000,00
                </span>
                <div className="w-full h-2 rounded-full bg-[#F3E8FF] overflow-hidden mt-2">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#7D2BD6] to-[#CF91F6] w-[35%]" />
                </div>
              </div>
            </div>
            <span className="text-[12px] font-black text-[#15803D] bg-[#DCFCE7] px-2.5 py-1 rounded-full shrink-0">
              35%
            </span>
          </div>
        )}
      </div>

      {/* 6. Transações Recentes reais (Fiel à Imagem 3) */}
      <div className="w-full bg-white rounded-[24px] p-4.5 border border-[#F0EBF8] shadow-card min-w-0">
        <div className="flex items-center justify-between mb-2 min-w-0">
          <span className="text-[14px] font-extrabold text-deep">Transações recentes</span>
          <Link
            to="/gastos"
            className="text-[12px] font-extrabold text-[#7D2BD6] hover:text-[#5B21B6] flex items-center gap-0.5 shrink-0"
          >
            <span>Ver todas</span>
            <ChevronRight className="w-3.5 h-3.5" strokeWidth={2.5} />
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

export default DashboardPage
