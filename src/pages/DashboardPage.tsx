import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { AppShell } from '../components/AppShell'
import { Mascot } from '../components/Mascot'
import { Card } from '../components/Card'
import { CategoryCircle } from '../components/CategoryIcon'
import { BackgroundBlobs } from '../components/BackgroundBlobs'
import { TransactionModal } from '../components/TransactionModal'
import { NotificationBottomSheet } from '../components/NotificationBottomSheet'
import { getAlerts, getFeaturedGoal, AlertNotification } from '../lib/alerts'
import {
  calculateAvailableBalance,
  calculateMonthlySummary,
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
  Bell,
} from 'lucide-react'
import type { Database } from '../types/database.types'

type Transaction = Database['public']['Tables']['transactions']['Row']
type Category = Database['public']['Tables']['categories']['Row']
type Goal = Database['public']['Tables']['financial_goals']['Row']
type Budget = Database['public']['Tables']['budgets']['Row']
type Contribution = Database['public']['Tables']['goal_contributions']['Row']

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const { user, profile, refreshProfile } = useAuth()

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Record<string, Category>>({})
  const [goals, setGoals] = useState<Goal[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [alerts, setAlerts] = useState<AlertNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hideBalance, setHideBalance] = useState(profile?.hide_balance ?? false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)

  // Modal de transação
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
    setError(null)
    try {
      // 1. Categorias
      const { data: cats, error: errCats } = await supabase.from('categories').select('*')
      if (errCats) throw errCats
      const catMap: Record<string, Category> = {}
      cats?.forEach((c) => {
        catMap[c.id] = c
      })
      setCategories(catMap)

      // 2. Transações
      const { data: txs, error: errTxs } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('occurred_on', { ascending: false })
      if (errTxs) throw errTxs
      const txList = txs || []
      setTransactions(txList)

      // 3. Metas
      const { data: g, error: errGoals } = await supabase
        .from('financial_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
      if (errGoals) throw errGoals
      const gList = g || []
      setGoals(gList)

      // 4. Orçamentos
      const { data: bData } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
      const bList = bData || []
      setBudgets(bList)

      // 5. Aportes em metas
      const { data: cData } = await supabase
        .from('goal_contributions')
        .select('*')
        .eq('user_id', user.id)
      const cList = cData || []
      setContributions(cList)

      // Calcular gastos por categoria do mês atual para os alertas
      const currentMonth = new Date().toISOString().slice(0, 7)
      const expensesByCat: Record<string, number> = {}
      txList
        .filter((t) => t.type === 'expense' && t.occurred_on.startsWith(currentMonth))
        .forEach((t) => {
          expensesByCat[t.category_id] = (expensesByCat[t.category_id] || 0) + Number(t.amount)
        })

      // Calcular alertas via seletor puro
      const computedAlerts = getAlerts(
        bList,
        expensesByCat,
        gList,
        catMap,
        cList,
        currentMonth
      )
      setAlerts(computedAlerts)
    } catch (err: any) {
      console.error('Erro ao carregar dados do dashboard:', err)
      setError(err.message || 'Falha ao carregar dados.')
    } finally {
      setLoading(false)
    }
  }

  // Cálculos financeiros reais
  const initialBalance = Number(profile?.initial_balance ?? 0)
  const availableBalance = calculateAvailableBalance(initialBalance, transactions)
  const monthlySummary = calculateMonthlySummary(transactions, new Date())

  // Meta de reserva de emergência
  const emergencyGoal = goals.find((g) => g.category === 'emergency') || goals.find((g) => g.name.toLowerCase().includes('reserva'))
  const emergencySaved = emergencyGoal ? Number(emergencyGoal.saved_amount) : 6000
  const emergencyTarget = emergencyGoal ? Number(emergencyGoal.target_amount) : 10000
  const emergencyPct = emergencyTarget > 0 ? Math.round((emergencySaved / emergencyTarget) * 100) : 60

  // Meta em destaque (seletor puro: não-reserva, por prazo e progresso)
  const featuredGoal = getFeaturedGoal(goals)

  // Transações recentes (as 3 últimas conforme referência v2)
  const recentTransactions = transactions.slice(0, 3)

  const toggleHideBalance = async () => {
    const nextVal = !hideBalance
    setHideBalance(nextVal)
    if (user) {
      await supabase.from('profiles').update({ hide_balance: nextVal }).eq('id', user.id)
      refreshProfile()
    }
  }

  const firstName = profile?.full_name?.split(' ')[0] || 'Ana'

  // Auxiliar para ícone da meta em destaque
  const getGoalIconSrc = (goal: Goal): string => {
    const key = (goal.icon || goal.category || '').toLowerCase()
    if (key.includes('trip') || key.includes('viagem') || key.includes('travel')) return '/assets/icons/icon-goal-trip.webp'
    if (key.includes('laptop') || key.includes('notebook') || key.includes('tech')) return '/assets/icons/icon-goal-laptop.webp'
    if (key.includes('gym') || key.includes('academia') || key.includes('fit') || key.includes('saude')) return '/assets/icons/icon-goal-gym.webp'
    if (key.includes('home') || key.includes('casa') || key.includes('imovel')) return '/assets/icons/icon-goal-home.webp'
    if (key.includes('car') || key.includes('carro') || key.includes('auto')) return '/assets/icons/icon-goal-car.webp'
    if (key.includes('study') || key.includes('estudo') || key.includes('curso')) return '/assets/icons/icon-goal-study.webp'
    if (key.includes('star') || key.includes('estrela')) return '/assets/icons/icon-goal-star.webp'
    return '/assets/icons/icon-bau.png'
  }

  // Auxiliar para data da transação ("Hoje • Categoria", "Ontem • Categoria" ou "DD/MM • Categoria")
  const formatTransactionDate = (dateStr: string, catName: string) => {
    const today = new Date().toISOString().slice(0, 10)
    const yesterdayDate = new Date()
    yesterdayDate.setDate(yesterdayDate.getDate() - 1)
    const yesterday = yesterdayDate.toISOString().slice(0, 10)

    if (dateStr === today) {
      return `Hoje • ${catName}`
    }
    if (dateStr === yesterday) {
      return `Ontem • ${catName}`
    }
    const parts = dateStr.split('-')
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]} • ${catName}`
    }
    return `${dateStr} • ${catName}`
  }

  return (
    <AppShell showNav={true} className="relative pt-3 flex flex-col gap-3 select-none pb-24">
      {/* Fundo com manchas orgânicas lilás */}
      <BackgroundBlobs showSparkles={false} />

      {/* 1. Cabeçalho */}
      <div className="w-full flex items-start justify-between min-w-0 px-0.5">
        <div className="min-w-0 flex-1 pr-3">
          <h1 className="text-[22px] font-extrabold text-[#432171] font-nunito tracking-tight leading-tight truncate">
            Olá, {firstName}! 👋
          </h1>
          <p className="text-[13px] font-bold text-[#7D6A9C] leading-snug mt-1 font-nunito">
            Sua vida financeira<br />no caminho certo.
          </p>
        </div>

        {/* Botão de notificações: círculo branco de 40px com sino e ponto roxo condicional */}
        <button
          type="button"
          onClick={() => setIsNotificationsOpen(true)}
          aria-label="Notificações"
          className="relative w-10 h-10 rounded-full bg-white shadow-card border border-lilac/20 flex items-center justify-center text-[#432171] hover:bg-[#F8F5FC] active:scale-95 transition-all shrink-0 cursor-pointer"
        >
          <Bell className="w-5 h-5 text-[#432171]" />
          {alerts.length > 0 && (
            <span
              data-testid="notification-dot"
              className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#7D2BD6] ring-2 ring-white"
            />
          )}
        </button>
      </div>

      {/* ESTADO DE ERRO */}
      {error && !loading && (
        <Card variant="white" size="default" className="text-center py-8 px-4 flex flex-col items-center gap-3">
          <Mascot pose="retry" size="md" alt="Tentar novamente" />
          <h3 className="text-[15px] font-extrabold text-[#432171]">
            Não conseguimos carregar seus dados
          </h3>
          <p className="text-[12px] font-semibold text-[#7D6A9C]">{error}</p>
          <button
            onClick={loadDashboardData}
            className="px-5 py-2 rounded-full bg-[#7D2BD6] text-white font-extrabold text-xs shadow-md hover:bg-[#5B21B6] transition-all cursor-pointer"
          >
            Tentar novamente
          </button>
        </Card>
      )}

      {/* ESTADO VAZIO */}
      {!loading && !error && transactions.length === 0 && goals.length === 0 && (
        <Card variant="white" size="default" className="text-center py-8 px-4 flex flex-col items-center gap-3">
          <Mascot pose="empty" size="lg" alt="Cofrinho vazio" />
          <p className="text-[15px] font-extrabold text-[#432171] max-w-[240px] leading-snug">
            Vamos organizar isso juntas? Registre seu primeiro gasto.
          </p>
          <button
            onClick={() => {
              setModalType('expense')
              setIsModalOpen(true)
            }}
            className="mt-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#7D2BD6] to-[#B037F8] text-white font-extrabold text-xs shadow-md hover:opacity-95 transition-all cursor-pointer"
          >
            + Registrar primeiro gasto
          </button>
        </Card>
      )}

      {/* 2. Card de Saldo em degradê roxo com Mascote pig-wink ancorado no topo */}
      <div className="relative w-full mt-[72px] min-w-0" data-testid="balance-card-container">
        {/* Mascote pig-wink: ~128px, cerca de 35% dentro do card e 65% acima */}
        <div
          data-testid="mascot-wink-container"
          className="absolute -right-1 z-20 pointer-events-none select-none w-32 h-32 flex items-end justify-center"
          style={{
            top: '-83px',
          }}
        >
          <Mascot
            pose="wink"
            size="lg"
            priority
            alt="Mascote PurplePiggy piscando sobre o card de saldo"
            className="w-32 h-32 object-contain"
          />
        </div>

        <Card
          variant="saldo"
          size="default"
          className="relative w-full rounded-[28px] p-5 shadow-card-saldo overflow-hidden min-w-0 pr-28"
          style={{
            background: 'linear-gradient(135deg, #8E32D8 0%, #7D2BD6 40%, #521D83 100%)',
          }}
        >
          {/* Brilhos decorativos dentro do card (conforme referência 01-inicio.png) */}
          <div className="absolute right-[120px] top-7 w-3.5 h-3.5 opacity-85 pointer-events-none">
            <svg viewBox="0 0 24 24" fill="#FEDA70" className="w-full h-full">
              <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
            </svg>
          </div>
          <div className="absolute right-[132px] bottom-4 w-2.5 h-2.5 opacity-75 pointer-events-none">
            <svg viewBox="0 0 24 24" fill="#FEDA70" className="w-full h-full">
              <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
            </svg>
          </div>

          {/* Linha superior: Rótulo e Olho para ocultar/mostrar à esquerda do mascote */}
          <div className="flex items-center gap-2 mb-1.5 min-w-0">
            <span className="text-[13px] font-semibold text-white/90 font-nunito">Saldo disponível</span>
            <button
              onClick={toggleHideBalance}
              className="p-0.5 rounded-full text-white/80 hover:text-white transition-opacity cursor-pointer"
              aria-label={hideBalance ? 'Mostrar saldo' : 'Ocultar saldo'}
            >
              {hideBalance ? (
                <EyeOff className="w-4 h-4 text-white/90" strokeWidth={2} />
              ) : (
                <Eye className="w-4 h-4 text-white/90" strokeWidth={2} />
              )}
            </button>
          </div>

          {/* Valor grande */}
          <div className="text-[28px] font-extrabold font-nunito tracking-tight mb-3 leading-tight truncate min-w-0 text-white">
            {loading ? (
              <div className="w-36 h-8 bg-white/20 rounded-md animate-pulse" />
            ) : hideBalance ? (
              '••••••••'
            ) : (
              formatCurrency(availableBalance)
            )}
          </div>

          {/* Linha inferior: Chip de variação + Atualizado hoje */}
          <div className="flex items-center gap-2.5 text-[11px] font-bold min-w-0">
            {!loading && monthlySummary.variationPct !== null && (
              <div
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold shrink-0 ${
                  monthlySummary.variationPct >= 0
                    ? 'bg-[#DCFCE7] text-[#15803D]'
                    : 'bg-[#FCE7F3] text-[#BE185D]'
                }`}
              >
                {monthlySummary.variationPct >= 0 ? (
                  <ArrowUp className="w-3 h-3 text-[#15803D]" strokeWidth={2.5} />
                ) : (
                  <ArrowDown className="w-3 h-3 text-[#BE185D]" strokeWidth={2.5} />
                )}
                <span>
                  {monthlySummary.variationPct >= 0 ? '+' : ''}
                  {monthlySummary.variationPct}%
                </span>
              </div>
            )}
            <span className="text-white/80 font-medium text-[11px] shrink-0">
              Atualizado hoje
            </span>
          </div>
        </Card>
      </div>

      {/* 3. Cards Receitas e Despesas lado a lado */}
      <div className="w-full grid grid-cols-2 gap-3 min-w-0">
        {/* Card Receitas */}
        <Card variant="white" size="sm" className="w-full flex items-center gap-2.5 p-3.5 rounded-[20px] min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#DCFCE7] text-[#15803D] flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" strokeWidth={2.3} />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-[12px] font-bold text-[#432171] leading-tight">Receitas</span>
            <span className="text-[14px] font-extrabold text-[#432171] leading-tight truncate mt-0.5">
              {loading ? (
                <span className="inline-block w-16 h-4 bg-gray-200 rounded animate-pulse" />
              ) : hideBalance ? (
                '••••'
              ) : (
                formatCurrency(monthlySummary.income)
              )}
            </span>
          </div>
        </Card>

        {/* Card Despesas */}
        <Card variant="white" size="sm" className="w-full flex items-center gap-2.5 p-3.5 rounded-[20px] min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#FCE7F3] text-[#BE185D] flex items-center justify-center shrink-0">
            <TrendingDown className="w-5 h-5" strokeWidth={2.3} />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-[12px] font-bold text-[#432171] leading-tight">Despesas</span>
            <span className="text-[14px] font-extrabold text-[#432171] leading-tight truncate mt-0.5">
              {loading ? (
                <span className="inline-block w-16 h-4 bg-gray-200 rounded animate-pulse" />
              ) : hideBalance ? (
                '••••'
              ) : (
                formatCurrency(monthlySummary.expense)
              )}
            </span>
          </div>
        </Card>
      </div>

      {/* 4. Card "Reserva de emergência" */}
      <Card
        variant="white"
        size="default"
        onClick={() => navigate('/metas')}
        className="w-full rounded-[24px] p-4.5 cursor-pointer hover:border-primary/25 transition-all min-w-0"
      >
        <div className="flex items-center justify-between mb-2 min-w-0">
          <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
            <div className="w-9 h-9 rounded-xl bg-[#F3E8FF] flex items-center justify-center shrink-0">
              <Mascot pose="head" size="xs" alt="Reserva" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[14px] font-extrabold text-[#432171] block leading-tight">
                Reserva de emergência
              </span>
              <span className="text-[12px] font-bold text-[#7D6A9C] leading-tight block mt-0.5 truncate">
                {loading ? (
                  <span className="inline-block w-28 h-3.5 bg-gray-200 rounded animate-pulse" />
                ) : (
                  `${formatCurrency(emergencySaved)} de ${formatCurrency(emergencyTarget)}`
                )}
              </span>
            </div>
          </div>
          <span className="text-[15px] font-extrabold text-[#432171] shrink-0 ml-2">
            {emergencyPct}%
          </span>
        </div>
        {/* Barra na largura toda com mesmo padding interno */}
        <div className="w-full h-2.5 rounded-full bg-[#F3E8FF] overflow-hidden mt-2">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#7D2BD6] to-[#B037F8] transition-all duration-500"
            style={{ width: `${Math.min(emergencyPct, 100)}%` }}
          />
        </div>
      </Card>

      {/* 5. "Suas metas" + "Ver todas >" (Apenas UM card em destaque; se só houver reserva, não renderiza) */}
      {featuredGoal && (
        <div className="w-full min-w-0">
          <div className="flex items-center justify-between mb-1.5 px-0.5 min-w-0">
            <span className="text-[15px] font-extrabold text-[#432171] font-nunito">Suas metas</span>
            <Link
              to="/metas"
              className="text-[12px] font-extrabold text-[#7D2BD6] hover:text-[#5B21B6] flex items-center gap-0.5 shrink-0"
            >
              <span>Ver todas</span>
              <ChevronRight className="w-3.5 h-3.5" strokeWidth={2.5} />
            </Link>
          </div>

          <Card
            variant="white"
            size="default"
            onClick={() => navigate('/metas')}
            className="w-full rounded-[24px] p-4 cursor-pointer hover:border-primary/25 transition-all min-w-0"
          >
            <div className="flex items-center justify-between gap-3 min-w-0">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-12 h-12 rounded-2xl bg-[#FEF3C7] flex items-center justify-center shrink-0 shadow-xs p-1">
                  <img
                    src={getGoalIconSrc(featuredGoal)}
                    alt={featuredGoal.name}
                    className="w-10 h-10 object-contain"
                  />
                </div>
                <div className="min-w-0 flex-1 pr-1">
                  <span className="text-[14px] font-extrabold text-[#432171] block truncate leading-tight">
                    {featuredGoal.name}
                  </span>
                  <span className="text-[12px] font-bold text-[#7D6A9C] block mt-0.5 truncate">
                    {formatCurrency(featuredGoal.saved_amount)} de {formatCurrency(featuredGoal.target_amount)}
                  </span>
                  <div className="w-full h-2 rounded-full bg-[#F3E8FF] overflow-hidden mt-2">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#7D2BD6] to-[#CF91F6] transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          Math.round((featuredGoal.saved_amount / (featuredGoal.target_amount || 1)) * 100),
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
              <span className="text-[12px] font-black text-[#15803D] bg-[#DCFCE7] px-2.5 py-1 rounded-full shrink-0">
                {Math.min(
                  Math.round((featuredGoal.saved_amount / (featuredGoal.target_amount || 1)) * 100),
                  100
                )}%
              </span>
            </div>
          </Card>
        </div>
      )}

      {/* 6. "Transações recentes" + "Ver todas >" (as 3 últimas) */}
      <div className="w-full min-w-0">
        <div className="flex items-center justify-between mb-1.5 px-0.5 min-w-0">
          <span className="text-[15px] font-extrabold text-[#432171] font-nunito">Transações recentes</span>
          <Link
            to="/gastos"
            className="text-[12px] font-extrabold text-[#7D2BD6] hover:text-[#5B21B6] flex items-center gap-0.5 shrink-0"
          >
            <span>Ver todas</span>
            <ChevronRight className="w-3.5 h-3.5" strokeWidth={2.5} />
          </Link>
        </div>

        <Card variant="white" size="default" className="w-full rounded-[24px] p-3.5 min-w-0">
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
                const catName = cat?.name || 'Geral'
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
                        <div className="text-[14px] font-bold text-[#432171] leading-tight truncate">
                          {tx.description}
                        </div>
                        <div className="text-[11px] font-semibold text-[#7D6A9C] truncate mt-0.5">
                          {formatTransactionDate(tx.occurred_on, catName)}
                        </div>
                      </div>
                    </div>

                    <div
                      className={`text-[14px] font-extrabold shrink-0 ml-2 ${
                        isIncome ? 'text-[#15803D]' : 'text-[#432171]'
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
            <div className="py-4 text-center min-w-0">
              <p className="text-xs font-semibold text-[#7D6A9C]">
                Nenhuma transação recente encontrada.
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Bottom Sheet de Notificações */}
      <NotificationBottomSheet
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        alerts={alerts}
      />

      {/* Modal de Transação (usado se o usuário clicar para adicionar no estado vazio) */}
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
