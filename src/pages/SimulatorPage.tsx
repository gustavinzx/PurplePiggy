import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { AppShell } from '../components/AppShell'
import { Button } from '../components/Button'
import { TransactionModal } from '../components/TransactionModal'
import {
  simulatePurchase,
  calculateAvailableBalance,
  calculateMonthlySummary,
} from '../lib/finance'
import { formatCurrency, formatPercent } from '../lib/format'
import {
  Sliders,
  DollarSign,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  ArrowRight,
  TrendingUp,
  CreditCard,
  Plus,
} from 'lucide-react'
import { toast } from 'sonner'
import type { Database } from '../types/database.types'

type Goal = Database['public']['Tables']['financial_goals']['Row']

export const SimulatorPage: React.FC = () => {
  const navigate = useNavigate()
  const { user, profile } = useAuth()

  const [purchaseAmount, setPurchaseAmount] = useState<number>(500)
  const [installments, setInstallments] = useState<number>(1)
  const [interestRate, setInterestRate] = useState<number>(0) // 0%
  const [goals, setGoals] = useState<Goal[]>([])
  const [availableBalance, setAvailableBalance] = useState<number>(2540)
  const [monthlyBudget, setMonthlyBudget] = useState<number>(3000)

  // Modais de ação
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false)
  const [selectedGoalToApply, setSelectedGoalToApply] = useState<Goal | null>(null)
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
  }

  const simResult = simulatePurchase({
    purchaseAmount,
    installments,
    monthlyInterestRate: interestRate / 100,
    availableBalance,
    totalMonthlyBudget: monthlyBudget,
  })

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
    <AppShell showNav={true} className="px-5 py-6 flex flex-col gap-4">
      {/* Título da tela */}
      <div>
        <h1 className="text-xl font-extrabold text-deep font-sans mb-1">
          Simulador de compras
        </h1>
        <p className="text-xs font-semibold text-textSec leading-relaxed">
          Antes de comprar, veja como essa escolha pode impactar seu planejamento.
        </p>
      </div>

      {/* Card Roxo com Slider (fiel ao layout oficial) */}
      <div className="bg-gradient-to-r from-primary to-deep text-white rounded-[24px] p-5 shadow-soft">
        <span className="text-xs font-bold text-white/80">Quanto custa sua compra?</span>
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

      {/* Seção "O que esse valor pode representar?" (Layout oficial) */}
      <div className="bg-white rounded-[22px] p-5 border border-lilac/15 shadow-card flex flex-col gap-3">
        <span className="text-xs font-bold text-textSec">O que esse valor pode representar?</span>

        <div className="flex flex-col gap-2.5">
          {goals.length > 0 ? (
            goals.slice(0, 3).map((g) => (
              <div
                key={g.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-bg border border-lilac/15"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gold/20 text-amber-700 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-deep">{g.name}</div>
                    <div className="text-[10px] text-textSec font-semibold">
                      Avançaria em{' '}
                      {formatPercent((purchaseAmount / Number(g.target_amount)) * 100)} a meta
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleApplyToGoal(g)}
                  disabled={isApplyingGoal}
                  className="text-xs font-bold text-primary hover:underline bg-primary/10 px-2.5 py-1 rounded-full"
                >
                  Guardar nela
                </button>
              </div>
            ))
          ) : (
            <>
              <div className="flex items-center justify-between p-3 rounded-2xl bg-bg border border-lilac/15">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-deep">Reserva de emergência</span>
                </div>
                <span className="text-xs font-extrabold text-deep">
                  {formatCurrency(purchaseAmount)}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-bg border border-lilac/15">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-deep">Educação e cursos</span>
                </div>
                <span className="text-xs font-extrabold text-deep">
                  {formatCurrency(purchaseAmount)}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-bg border border-lilac/15">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-deep">Sonho pessoal</span>
                </div>
                <span className="text-xs font-extrabold text-deep">
                  {formatCurrency(purchaseAmount)}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Impacto no Orçamento (Layout oficial) */}
      <div className="bg-white rounded-[22px] p-5 border border-lilac/15 shadow-card">
        <span className="text-xs font-bold text-textSec">Impacto no orçamento</span>
        <div className="text-base font-extrabold text-deep mt-1 mb-2">
          {simResult.balanceStatusText}
        </div>

        <div className="w-full h-2.5 bg-bg rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-gradient-to-r from-primary to-lilac rounded-full transition-all duration-700"
            style={{ width: `${Math.min(100, simResult.pctOfAvailableBalance || 0)}%` }}
          />
        </div>

        {/* Simulação ilustrativa de economia */}
        <div className="bg-baby/50 p-3 rounded-xl border border-blue-100 text-[11px] font-semibold text-deep">
          📈 Se guardasse esse valor por 12 meses, você teria cerca de{' '}
          <strong>{formatCurrency(simResult.futureValue12m)}</strong>.
          <p className="text-[10px] text-textSec mt-1">{simResult.disclaimer}</p>
        </div>
      </div>

      {/* Ações inferiores */}
      <div className="flex flex-col gap-2.5 pt-1">
        <Button
          size="lg"
          fullWidth
          variant="secondary"
          onClick={() => setIsExpenseModalOpen(true)}
        >
          Registrar como gasto
        </Button>
      </div>

      <TransactionModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        initialType="expense"
      />
    </AppShell>
  )
}
