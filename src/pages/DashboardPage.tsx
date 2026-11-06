import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { AppShell } from '../components/AppShell'
import { Card } from '../components/Card'
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
  Plus,
  Calculator,
} from 'lucide-react'
import type { Database } from '../types/database.types'
import { getBankNameFromTransaction, getBankLogo } from '../lib/openFinance'

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
  const [unreadAlertsCount, setUnreadAlertsCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hideBalance, setHideBalance] = useState(profile?.hide_balance ?? false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [bankMap, setBankMap] = useState<Record<string, string>>({})

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
        .order('occurred_on', { ascending: false }).order('created_at', { ascending: false })
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

      // Conexões de bancos (Open Finance)
      const { data: bankConns } = await supabase
        .from('bank_connections')
        .select('id, institution_name')
        .eq('user_id', user.id)

      const bMap: Record<string, string> = {}
      bankConns?.forEach((bc) => {
        if (bc.id && bc.institution_name) {
          bMap[bc.id] = bc.institution_name
        }
      })
      setBankMap(bMap)

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
      let totalCardSpent = 0
      txList
        .filter((t) => t.type === 'expense' && t.occurred_on.startsWith(currentMonth))
        .forEach((t) => {
          expensesByCat[t.category_id] = (expensesByCat[t.category_id] || 0) + Number(t.amount)
          if (t.payment_method === 'credit_card') {
            totalCardSpent += Number(t.amount)
          }
        })

      // Calcular alertas via seletor puro respeitando as preferências do Perfil
      const computedAlerts = getAlerts(
        bList,
        expensesByCat,
        gList,
        catMap,
        cList,
        currentMonth,
        {
          notifyBudget: profile?.notify_budget ?? true,
          notifyGoals: profile?.notify_goals ?? true,
          notifyLearning: profile?.notify_learning ?? false,
          cardAlertLimit: Number(profile?.card_alert_limit || 0),
          totalCardSpent,
        }
      )
      setAlerts(computedAlerts)
      try {
        const dismissed: string[] = JSON.parse(localStorage.getItem('pp_dismissed_alert_ids') || '[]')
        setUnreadAlertsCount(computedAlerts.filter((a) => !dismissed.includes(a.id)).length)
      } catch {
        setUnreadAlertsCount(computedAlerts.length)
      }
    } catch (err: any) {
      console.error('Erro ao carregar dados do dashboard:', err)
      setError(err.message || 'Falha ao carregar dados.')
    } finally {
      setLoading(false)
    }
  }

  // Cálculos financeiros reais
  const initialBalance = Number(profile?.initial_balance ?? 0)
  const availableBalance = calculateAvailableBalance(initialBalance, transactions.filter((t) => t.occurred_on.startsWith(new Date().toISOString().slice(0, 7))))
  const monthlySummary = calculateMonthlySummary(transactions, new Date())

  // Meta de reserva de emergência
  const emergencyGoal = goals.find((g) => g.category === 'emergency') || goals.find((g) => g.name.toLowerCase().includes('reserva'))
  const emergencySaved = emergencyGoal ? Number(emergencyGoal.saved_amount) : 0
  const emergencyTarget = emergencyGoal ? Number(emergencyGoal.target_amount) : 0
  const emergencyPct = emergencyTarget > 0 ? Math.min(100, Math.round((emergencySaved / emergencyTarget) * 100)) : 0

  // Painel de gastos: consolidado por categorias do mês atual
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

  // Ordenar categorias de gastos do maior para o menor e aplicar as 4 cores da referência (Roxo, Rosa #FF79A8, Amarelo, Azul)
  const sortedExpenseCategories = Object.entries(expensesByCategory).sort((a, b) => b[1] - a[1])
  const top3Categories = sortedExpenseCategories.slice(0, 3)
  const restCategories = sortedExpenseCategories.slice(3)

  const getSegmentColor = (catNameOrSlug: string, idx: number): string => {
    const k = (catNameOrSlug || '').toLowerCase()
    if (k.includes('moradia') || k.includes('casa') || k.includes('aluguel') || k.includes('conta')) return '#7D2BD6'
    if (k.includes('alimenta') || k.includes('mercado') || k.includes('comida') || k.includes('restaurante')) return '#FF79A8'
    if (k.includes('transporte') || k.includes('uber') || k.includes('combust')) return '#F5B83D'
    if (k.includes('outro') || k.includes('lazer') || k.includes('saúde') || k.includes('saude')) return '#60A5FA'
    const palette = ['#7D2BD6', '#FF79A8', '#F5B83D', '#60A5FA']
    return palette[idx % palette.length]
  }

  const painelSegments = top3Categories.map(([catId, amount], idx) => {
    const cat = categories[catId]
    const catName = cat?.name || 'Geral'
    const pct = totalPainelGastos > 0 ? Math.round((amount / totalPainelGastos) * 100) : 0
    return {
      id: catId,
      name: catName,
      amount,
      pct,
      color: getSegmentColor(cat?.slug || catName, idx),
    }
  })

  if (restCategories.length > 0 && totalPainelGastos > 0) {
    const restSum = restCategories.reduce((acc, [, amt]) => acc + amt, 0)
    const restPct = Math.max(1, 100 - painelSegments.reduce((acc, s) => acc + s.pct, 0))
    painelSegments.push({
      id: 'outros',
      name: 'Outros',
      amount: restSum,
      pct: restPct,
      color: '#60A5FA',
    })
  }


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
    <AppShell showNav={true} className="relative pt-7 flex flex-col gap-3 select-none pb-24">
      {/* Fundo com manchas orgânicas lilás */}
      <BackgroundBlobs showSparkles={false} />

      {/* 1. Cabeçalho */}
      <div className="w-full flex items-start justify-between min-w-0 px-0.5 mt-3">
        <div className="min-w-0 flex-1 pr-3">
          <h1 className="text-[22px] font-extrabold text-[#432171] font-nunito tracking-tight leading-tight truncate">
            Olá, {firstName}! 👋
          </h1>
          <p className="text-[13px] font-bold text-[#7D6A9C] leading-snug mt-1 font-nunito">
            Sua vida financeira<br />no caminho certo.
          </p>
        </div>

        {/* Botão de notificações: círculo branco de 40px com sino e contador de alertas */}
        <button
          type="button"
          onClick={() => setIsNotificationsOpen(true)}
          aria-label="Notificações"
          className="relative w-10 h-10 rounded-full bg-white shadow-card border border-lilac/20 flex items-center justify-center text-[#432171] hover:bg-[#F8F5FC] active:scale-95 transition-all shrink-0 cursor-pointer"
        >
          <Bell className="w-5 h-5 text-[#432171]" />
          {unreadAlertsCount > 0 && (
            <span
              data-testid="notification-dot"
              className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#7D2BD6] text-white text-[10px] font-black flex items-center justify-center ring-2 ring-white"
            >
              {unreadAlertsCount}
            </span>
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
      <div className="relative w-full mt-[38px] min-w-0" data-testid="balance-card-container">
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
          <div className="w-9 h-9 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
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

      {/* 4. Atalhos Rápidos Interativos (+ Gasto, + Receita, Simulador) */}
      <div className="w-full grid grid-cols-3 gap-2.5 min-w-0">
        <button
          type="button"
          onClick={() => {
            setModalType('expense')
            setIsModalOpen(true)
          }}
          className="w-full bg-white hover:bg-[#FAF6FD] border border-[#F0EBF8] rounded-[20px] py-2.5 px-2 flex items-center justify-center gap-1.5 text-[12px] font-extrabold text-[#432171] transition-all shadow-card hover:scale-[1.02] active:scale-95 min-w-0 cursor-pointer"
        >
          <div className="w-6 h-6 rounded-full bg-[#FCE7F3] text-[#BE185D] flex items-center justify-center shrink-0">
            <Plus className="w-3.5 h-3.5" strokeWidth={2.8} />
          </div>
          <span className="truncate">+ Gasto</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setModalType('income')
            setIsModalOpen(true)
          }}
          className="w-full bg-white hover:bg-[#FAF6FD] border border-[#F0EBF8] rounded-[20px] py-2.5 px-2 flex items-center justify-center gap-1.5 text-[12px] font-extrabold text-[#432171] transition-all shadow-card hover:scale-[1.02] active:scale-95 min-w-0 cursor-pointer"
        >
          <div className="w-6 h-6 rounded-full bg-[#DCFCE7] text-[#15803D] flex items-center justify-center shrink-0">
            <Plus className="w-3.5 h-3.5" strokeWidth={2.8} />
          </div>
          <span className="truncate">+ Receita</span>
        </button>

        <button
          type="button"
          onClick={() => navigate('/simulador')}
          className="w-full bg-white hover:bg-[#FAF6FD] border border-[#F0EBF8] rounded-[20px] py-2.5 px-2 flex items-center justify-center gap-1.5 text-[12px] font-extrabold text-[#432171] transition-all shadow-card hover:scale-[1.02] active:scale-95 min-w-0 cursor-pointer"
        >
          <div className="w-6 h-6 rounded-full bg-[#F3E8FF] text-[#7D2BD6] flex items-center justify-center shrink-0">
            <Calculator className="w-3.5 h-3.5" strokeWidth={2.8} />
          </div>
          <span className="truncate">Simulador</span>
        </button>
      </div>

      {/* 5. Card "Painel de gastos" com link Este mês > e barra segmentada multicolorida */}
      <Card
        variant="white"
        size="default"
        onClick={() => navigate('/gastos')}
        className="w-full rounded-[24px] p-4.5 border border-[#F0EBF8] shadow-card cursor-pointer hover:border-primary/25 transition-all min-w-0"
      >
        <div className="flex items-center justify-between mb-1.5 min-w-0">
          <span className="text-[14px] font-extrabold text-[#432171] block leading-tight">Painel de gastos</span>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/orcamento"
              onClick={(e) => e.stopPropagation()}
              className="text-[11px] font-extrabold text-[#7D6A9C] hover:text-[#7D2BD6] bg-[#F5EEFF] px-2.5 py-0.5 rounded-full transition-colors"
            >
              Orçamento
            </Link>
            <Link
              to="/gastos"
              onClick={(e) => e.stopPropagation()}
              className="text-[12px] font-extrabold text-[#7D2BD6] hover:text-[#5B21B6] flex items-center gap-0.5"
            >
              <span>Este mês</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#7D2BD6]" strokeWidth={2.5} />
            </Link>
          </div>
        </div>

        {/* Valor consolidado */}
        <div className="text-[20px] font-black text-[#432171] mb-2.5 truncate min-w-0 font-nunito leading-tight">
          {loading ? (
            <span className="inline-block w-24 h-6 bg-gray-200 rounded animate-pulse" />
          ) : hideBalance ? (
            '••••••••'
          ) : (
            formatCurrency(totalPainelGastos > 0 ? totalPainelGastos : monthlySummary.expense)
          )}
        </div>

        {/* Barra empilhada multicolorida por categorias (Roxo, Rosa #FF79A8, Amarelo, Azul) */}
        <div className="w-full h-3 rounded-full bg-[#F3E8FF] overflow-hidden flex min-w-0">
          {painelSegments.length > 0 && totalPainelGastos > 0 ? (
            painelSegments.map((seg) => (
              <div
                key={seg.id}
                className="h-full first:rounded-l-full last:rounded-r-full transition-all duration-500"
                style={{
                  width: `${(seg.amount / totalPainelGastos) * 100}%`,
                  backgroundColor: seg.color,
                }}
              />
            ))
          ) : null}
        </div>

        {/* Legenda das categorias e porcentagens igual ao print 3 enviado */}
        {painelSegments.length > 0 && totalPainelGastos > 0 && (
          <div className="mt-3 flex flex-col gap-1.5">
            {painelSegments.map((seg) => (
              <div key={seg.id} className="flex items-center justify-between text-[12px]">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: seg.color }}
                  />
                  <span className="font-bold text-[#432171] truncate">{seg.name}</span>
                </div>
                <span className="font-extrabold text-[#7D6A9C] shrink-0 ml-2">{seg.pct}%</span>
              </div>
            ))}
          </div>
        )}
      </Card>


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
                        <div className="flex items-center gap-1.5 truncate mt-0.5">
                          <span className="text-[11px] font-semibold text-[#7D6A9C]">
                            {formatTransactionDate(tx.occurred_on, catName)}
                          </span>
                          {(() => {
                            const bankName = getBankNameFromTransaction(tx, bankMap)
                            if (!bankName) return null
                            const logo = getBankLogo(bankName)
                            return (
                              <span className="inline-flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded-full bg-[#FAF5FF] text-[#5B21B6] border border-purple-200/60 shrink-0">
                                {logo && <img src={logo} alt="" className="w-3 h-3 rounded-xs object-contain" />}
                                <span>{bankName}</span>
                              </span>
                            )
                          })()}
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
        onDismissCountChange={setUnreadAlertsCount}
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
