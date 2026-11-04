import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { AppShell } from '../components/AppShell'
import { Button } from '../components/Button'
import { Mascot } from '../components/Mascot'
import {
  simulatePurchase,
  calculateAvailableBalance,
} from '../lib/finance'
import { formatCurrency, formatPercent } from '../lib/format'
import {
  Sparkles,
  Clock,
  Briefcase,
  ShoppingBag,
  ShieldCheck,
  GraduationCap,
  ArrowRight,
  TrendingUp,
} from 'lucide-react'
import { toast } from 'sonner'
import type { Database } from '../types/database.types'

type Goal = Database['public']['Tables']['financial_goals']['Row']

export const SimulatorPage: React.FC = () => {
  const navigate = useNavigate()
  const { user, profile } = useAuth()

  const [activeTab, setActiveTab] = useState<'impact' | 'hours'>('impact')
  const [purchaseAmount, setPurchaseAmount] = useState<number>(500)
  const [installments, setInstallments] = useState<number>(1)
  const [interestRate, setInterestRate] = useState<number>(0)
  const [goals, setGoals] = useState<Goal[]>([])
  const [availableBalance, setAvailableBalance] = useState<number>(2540)
  const [monthlyBudget, setMonthlyBudget] = useState<number>(3000)
  const [monthlyIncome, setMonthlyIncome] = useState<number>(2500)

  // Modais de ação
  const [isApplyingGoal, setIsApplyingGoal] = useState(false)

  useEffect(() => {
    if (user) {
      loadUserData()
    }
  }, [user])

  const loadUserData = async () => {
    if (!user) return

    // 1. Transações para saldo disponível
    const { data: txs } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)

    if (txs) {
      const balance = calculateAvailableBalance(Number(profile?.initial_balance ?? 0), txs)
      setAvailableBalance(balance)
    }

    // 2. Metas reais da usuária
    const { data: userGoals } = await supabase
      .from('financial_goals')
      .select('*')
      .eq('user_id', user.id)
    if (userGoals) setGoals(userGoals)

    // 3. Orçamento do mês
    const curMonth = new Date().toISOString().slice(0, 7) + '-01'
    const { data: b } = await supabase
      .from('budgets')
      .select('limit_amount')
      .eq('user_id', user.id)
      .eq('month', curMonth)
      .is('category_id', null)
      .single()

    if (b) setMonthlyBudget(Number(b.limit_amount))

    // 4. Renda mensal do diagnóstico
    const { data: diag } = await supabase
      .from('financial_diagnosis')
      .select('monthly_income')
      .eq('user_id', user.id)
      .single()

    if (diag?.monthly_income) {
      setMonthlyIncome(Number(diag.monthly_income))
    }
  }

  const simResult = simulatePurchase({
    purchaseAmount,
    installments,
    monthlyInterestRate: interestRate / 100,
    availableBalance,
    totalMonthlyBudget: monthlyBudget,
  })

  // Cálculo de horas de trabalho de vida
  // 160h úteis mensais (padrão CLT / 40h semanais)
  const hourlyRate = monthlyIncome > 0 ? monthlyIncome / 160 : 15.62
  const workHoursNeeded = Math.max(1, Math.round(purchaseAmount / hourlyRate))
  const workDaysNeeded = (workHoursNeeded / 8).toFixed(1)

  // Aplicar o valor simulado diretamente em uma meta da usuária
  const handleApplyToGoal = async (goal: Goal) => {
    if (!user) return
    setIsApplyingGoal(true)
    try {
      const { error } = await supabase.from('goal_contributions').insert({
        user_id: user.id,
        goal_id: goal.id,
        kind: 'deposit',
        amount: purchaseAmount,
        occurred_on: new Date().toISOString().split('T')[0],
      })

      if (error) throw error

      toast.success(`Parabéns! R$ ${purchaseAmount} guardados na meta "${goal.name}"! 💜`)
      navigate('/metas')
    } catch (err) {
      toast.error('Erro ao aplicar valor na meta.')
    } finally {
      setIsApplyingGoal(false)
    }
  }

  return (
    <AppShell showNav={true} className="px-5 py-6 flex flex-col gap-4 select-none">
      {/* Título da tela com mascote ideia */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-deep font-sans mb-1">
            Simulador de compras
          </h1>
          <p className="text-xs font-semibold text-textSec leading-relaxed">
            Antes de comprar, veja o impacto real no seu tempo e no seu bolso.
          </p>
        </div>
        <div className="shrink-0 -mr-1">
          <Mascot size="sm" pose="idea" />
        </div>
      </div>

      {/* Alternador de Abas: Impacto no Orçamento vs Custo em Horas de Trabalho */}
      <div className="w-full grid grid-cols-2 gap-1.5 p-1 bg-white border border-[#F0EBF8] rounded-2xl shadow-xs">
        <button
          onClick={() => setActiveTab('impact')}
          className={`py-2 px-3 rounded-xl text-[12px] font-extrabold transition-all ${
            activeTab === 'impact'
              ? 'bg-[#8E32D8] text-white shadow-xs'
              : 'text-deep/70 hover:text-deep hover:bg-[#FAF6FD]'
          }`}
        >
          Impacto no Orçamento
        </button>
        <button
          onClick={() => setActiveTab('hours')}
          className={`py-2 px-3 rounded-xl text-[12px] font-extrabold transition-all ${
            activeTab === 'hours'
              ? 'bg-[#8E32D8] text-white shadow-xs'
              : 'text-deep/70 hover:text-deep hover:bg-[#FAF6FD]'
          }`}
        >
          Horas de Trabalho ⏱️
        </button>
      </div>

      {/* Card Roxo com Slider (Comum a ambas as abas) */}
      <div className="bg-gradient-to-r from-primary to-deep text-white rounded-[24px] p-5 shadow-soft">
        <span className="text-xs font-bold text-white/80">Quanto custa sua compra pretendida?</span>
        <div className="text-3xl font-extrabold font-sans mt-1 mb-4">
          {formatCurrency(purchaseAmount)}
        </div>

        {/* Slider de R$ 50 a R$ 2.000 */}
        <input
          type="range"
          min="50"
          max="2000"
          step="25"
          value={Math.min(purchaseAmount, 2000)}
          onChange={(e) => setPurchaseAmount(Number(e.target.value))}
          className="w-full accent-gold h-2 bg-white/30 rounded-lg appearance-none cursor-pointer mb-2"
        />

        <div className="flex justify-between text-[11px] font-bold text-white/75">
          <span>R$ 50</span>
          <span>R$ 2.000</span>
        </div>

        {/* Seletor de Parcelamento */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/15">
          <span className="text-xs font-semibold text-white/80">Pagamento:</span>
          <select
            value={installments}
            onChange={(e) => setInstallments(Number(e.target.value))}
            className="bg-white/20 text-white font-bold text-xs rounded-xl px-2.5 py-1.5 focus:outline-none appearance-none"
          >
            <option value="1" className="text-deep">À vista</option>
            <option value="2" className="text-deep">2x</option>
            <option value="3" className="text-deep">3x</option>
            <option value="6" className="text-deep">6x</option>
            <option value="10" className="text-deep">10x</option>
            <option value="12" className="text-deep">12x</option>
          </select>

          {installments > 1 && (
            <span className="text-xs text-white/90 font-bold ml-auto">
              {installments}x de {formatCurrency(simResult.monthlyInstallment)}
            </span>
          )}
        </div>
      </div>

      {/* ABA 1: Impacto no Orçamento e Metas */}
      {activeTab === 'impact' && (
        <div className="bg-white rounded-[22px] p-5 border border-lilac/15 shadow-card flex flex-col gap-3">
          <span className="text-xs font-bold text-textSec">O que esse valor pode representar nas suas metas?</span>

          <div className="flex flex-col gap-2.5">
            {goals.length > 0 ? (
              goals.slice(0, 3).map((g) => (
                <div
                  key={g.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-bg border border-lilac/15"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-xl bg-gold/20 text-amber-700 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-deep truncate">{g.name}</div>
                      <div className="text-[10px] text-textSec font-semibold">
                        Avançaria em{' '}
                        {formatPercent((purchaseAmount / Number(g.target_amount)) * 100)} a meta
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleApplyToGoal(g)}
                    disabled={isApplyingGoal}
                    className="text-xs font-bold text-primary hover:underline bg-primary/10 px-2.5 py-1 rounded-full shrink-0 ml-2"
                  >
                    Guardar nela
                  </button>
                </div>
              ))
            ) : (
              <div className="p-4 text-center">
                <p className="text-xs text-textSec font-semibold mb-2">
                  Você ainda não tem metas ativas para comparar.
                </p>
                <button
                  onClick={() => navigate('/metas')}
                  className="text-xs font-bold text-primary hover:underline"
                >
                  + Criar primeira meta
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ABA 2: Comparativo com Horas Trabalhadas e Alternativas Mais Úteis */}
      {activeTab === 'hours' && (
        <div className="flex flex-col gap-3">
          {/* Card Principal: Horas Trabalhadas */}
          <div className="bg-white rounded-[24px] p-5 border border-lilac/15 shadow-card flex flex-col gap-3">
            <div className="flex items-center gap-2 text-deep font-extrabold text-sm">
              <Clock className="w-4 h-4 text-[#8E32D8]" />
              <span>Quanto da sua vida custa essa compra?</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF5FF] border border-[#F0EBF8] flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-deep/70">Equivalente em esforço:</span>
                <div className="text-2xl font-extrabold text-[#8E32D8] font-sans mt-0.5">
                  {workHoursNeeded} horas de trabalho
                </div>
                <span className="text-[11px] font-semibold text-deep/60">
                  Aproximadamente {workDaysNeeded} dias inteiros de trabalho de 8 horas.
                </span>
              </div>
              <div className="w-12 h-12 rounded-full bg-[#E9D5FF] flex items-center justify-center shrink-0">
                <Briefcase className="w-6 h-6 text-[#8E32D8]" />
              </div>
            </div>

            <p className="text-xs text-deep/80 leading-relaxed font-medium">
              Considerando sua renda estimada de{' '}
              <strong>{formatCurrency(monthlyIncome)}/mês</strong>, cada hora trabalhada vale cerca de{' '}
              <strong>{formatCurrency(hourlyRate)} líquida</strong>.
            </p>
          </div>

          {/* Comparativo com Alternativas Mais Úteis */}
          <div className="bg-white rounded-[24px] p-5 border border-lilac/15 shadow-card flex flex-col gap-3">
            <div className="flex items-center gap-2 text-deep font-extrabold text-sm">
              <ShoppingBag className="w-4 h-4 text-[#8E32D8]" />
              <span>O que você poderia conquistar com esse mesmo valor?</span>
            </div>

            <div className="flex flex-col gap-2.5">
              <div className="p-3 rounded-2xl bg-[#F0FDF4] border border-[#DCFCE7] flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#DCFCE7] text-[#15803D] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#15803D]">Tranquilidade e Segurança</div>
                  <div className="text-[11px] text-deep/70 font-medium">
                    Acelerar sua reserva de emergência ou quitar pendências sem juros.
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[#EFF6FF] border border-[#DBEAFE] flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#DBEAFE] text-[#1D4ED8] flex items-center justify-center shrink-0">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#1D4ED8]">Investimento em Você</div>
                  <div className="text-[11px] text-deep/70 font-medium">
                    Daria para fazer até {Math.max(1, Math.floor(purchaseAmount / 150))} cursos ou ferramentas para alavancar sua renda.
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[#FAF6FD] border border-[#F0EBF8] flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#F3E8FF] text-[#8E32D8] flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-deep">Regra das 48 Horas</div>
                  <div className="text-[11px] text-deep/70 font-medium">
                    Se você esperar 2 dias antes de comprar, 70% das compras por impulso são evitadas com naturalidade!
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}

export default SimulatorPage
