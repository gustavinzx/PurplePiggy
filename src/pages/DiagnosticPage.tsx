import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { Mascot } from '../components/Mascot'
import { AppShell } from '../components/AppShell'
import { BackgroundBlobs } from '../components/BackgroundBlobs'
import { evaluateFinancialDiagnosis, generateInitialBudget, getEmergencyFundSteps } from '../lib/finance'
import { formatCurrency } from '../lib/format'
import {
  ArrowLeft,
  Check,
  ShieldCheck,
  Compass,
  SlidersHorizontal,
  TrendingUp,
  AlertTriangle,
  Wallet,
  PiggyBank,
  Plane,
  GraduationCap,
  Laptop,
  Target,
  CreditCard,
  ShoppingBag,
  ClipboardCheck,
  EyeOff,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import confetti from 'canvas-confetti'

export const DiagnosticPage: React.FC = () => {
  const navigate = useNavigate()
  const { user, refreshProfile } = useAuth()

  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSummaryModal, setShowSummaryModal] = useState(false)

  // Respostas do questionário (strings para permitir apagar completamente o input de renda/gastos)
  const [feeling, setFeeling] = useState<'start_organizing' | 'partial_control' | 'improve_planning' | 'in_debt'>('start_organizing')
  const [incomeInput, setIncomeInput] = useState<string>('3000')
  const [expensesInput, setExpensesInput] = useState<string>('1800')
  const [hasEmergencyFund, setHasEmergencyFund] = useState<'no' | 'small' | 'three_months_plus'>('small')
  const [mainGoal, setMainGoal] = useState<string>('Reserva de emergência')
  const [customGoalName, setCustomGoalName] = useState<string>('')
  const [spendingHabit, setSpendingHabit] = useState<'plans' | 'impulse_sometimes' | 'uses_credit_a_lot' | 'no_tracking'>('impulse_sometimes')

  const monthlyIncome = Math.max(0, Number(incomeInput.replace(/\D/g, '')) || 0)
  const essentialExpenses = Math.max(0, Number(expensesInput.replace(/\D/g, '')) || 0)
  const resolvedGoalName =
    mainGoal === 'Outro objetivo' && customGoalName.trim().length > 0
      ? customGoalName.trim()
      : mainGoal

  const handleIncomeChange = (raw: string) => {
    const digitsOnly = raw.replace(/\D/g, '').replace(/^0+(?=\d)/, '')
    setIncomeInput(digitsOnly)
  }

  const handleExpensesChange = (raw: string) => {
    const digitsOnly = raw.replace(/\D/g, '').replace(/^0+(?=\d)/, '')
    setExpensesInput(digitsOnly)
  }

  const handleNext = () => {
    if (step === 1 && monthlyIncome <= 0) {
      toast.error('Informe sua renda mensal aproximada para montarmos seu plano.')
      return
    }
    if (step === 2 && essentialExpenses < 0) {
      toast.error('Informe um valor válido para seus gastos essenciais.')
      return
    }
    if (step < 3) {
      setStep(step + 1)
    } else {
      finishDiagnostic()
    }
  }

  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1)
    } else {
      navigate('/inicio')
    }
  }

  const skipDiagnostic = async () => {
    navigate('/inicio')
  }

  const finishDiagnostic = async () => {
    if (!user) return
    setIsSubmitting(true)

    try {
      // 1. Salvar diagnóstico
      const { error: diagError } = await supabase.from('financial_diagnosis').upsert({
        user_id: user.id,
        feeling,
        monthly_income: monthlyIncome,
        essential_expenses: essentialExpenses,
        has_emergency_fund: hasEmergencyFund,
        main_goal: resolvedGoalName,
        spending_habit: spendingHabit,
      })

      if (diagError) console.error('Erro diagnóstico:', diagError)

      // 2. Atualizar perfil com diagnostic_done = true
      await supabase.from('profiles').update({
        diagnostic_done: true,
      }).eq('id', user.id)

      // 3. Gerar orçamento inicial automático
      const curMonth = new Date().toISOString().slice(0, 7) + '-01'
      const initBudget = generateInitialBudget(monthlyIncome, essentialExpenses)

      // Inserir orçamento total
      await supabase.from('budgets').upsert({
        user_id: user.id,
        month: curMonth,
        limit_amount: initBudget.totalBudget,
        category_id: null,
      }, { onConflict: 'user_id,month,category_id' })

      // Buscar categorias padrão para limites por categoria
      const { data: cats } = await supabase
        .from('categories')
        .select('id, slug')
        .is('user_id', null)

      if (cats && cats.length > 0) {
        for (const cat of cats) {
          const limit = (initBudget.categories as Record<string, number>)[cat.slug]
          if (limit) {
            await supabase.from('budgets').upsert({
              user_id: user.id,
              month: curMonth,
              limit_amount: limit,
              category_id: cat.id,
            }, { onConflict: 'user_id,month,category_id' })
          }
        }
      }

      // 4. Criar meta "Reserva de emergência" sem duplicar caso o usuário refaça o diagnóstico
      // A conta recém-criada sempre inicia com R$ 0,00 de saldo e R$ 0,00 de lançamentos
      const steps = getEmergencyFundSteps(essentialExpenses)
      const emergencyTarget = Math.max(400, steps.step1Week * 4)

      const { data: existingGoals } = await supabase
        .from('financial_goals')
        .select('id, name')
        .eq('user_id', user.id)

      const hasEmergencyGoal = existingGoals?.some(
        (g) => g.name.toLowerCase() === 'reserva de emergência'
      )

      if (!hasEmergencyGoal) {
        await supabase.from('financial_goals').insert({
          user_id: user.id,
          name: 'Reserva de emergência',
          category: 'emergency',
          target_amount: emergencyTarget,
          saved_amount: 0,
          deadline: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          icon: 'ShieldCheck',
        })
      }

      // Se o usuário escolheu outro objetivo principal além da Reserva de emergência, criar também a meta personalizada dele
      if (
        resolvedGoalName &&
        resolvedGoalName.toLowerCase() !== 'reserva de emergência' &&
        !existingGoals?.some((g) => g.name.toLowerCase() === resolvedGoalName.toLowerCase())
      ) {
        await supabase.from('financial_goals').insert({
          user_id: user.id,
          name: resolvedGoalName,
          category: 'personal',
          target_amount: Math.max(1000, Math.round(monthlyIncome * 0.8)),
          saved_amount: 0,
          deadline: new Date(Date.now() + 240 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          icon: 'Target',
        })
      }

      await refreshProfile()
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } })
      setShowSummaryModal(true)
    } catch (err) {
      console.error('Falha ao concluir diagnóstico:', err)
      toast.error('Não conseguimos salvar agora. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const evalResult = evaluateFinancialDiagnosis(monthlyIncome, essentialExpenses)
  const steps = getEmergencyFundSteps(essentialExpenses)

  const stepMeta = {
    1: {
      pose: 'idea' as const,
      badge: 'Passo 1 de 3 • Seu momento',
      tip: 'Me conta como você se sente hoje e quanto entra por mês.',
    },
    2: {
      pose: 'deposit' as const,
      badge: 'Passo 2 de 3 • Seus custos',
      tip: 'Agora vamos olhar para o que é essencial no seu mês.',
    },
    3: {
      pose: 'trophy' as const,
      badge: 'Passo 3 de 3 • Seus objetivos',
      tip: 'Quase lá! Escolha sua prioridade para montarmos seu plano.',
    },
  }[step as 1 | 2 | 3]

  const quickIncomeValues = [1500, 2500, 3500, 5000, 8000]
  const quickExpenseValues = [900, 1500, 2200, 3000, 4500]

  return (
    <AppShell
      variant="app"
      showNav={false}
      className="relative px-5 py-6 flex flex-col justify-between min-h-dvh select-none"
    >
      <BackgroundBlobs showSparkles={true} />

      <div className="relative z-10 flex flex-col">
        {/* Header do wizard */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handlePrev}
            className="w-10 h-10 rounded-full bg-white/90 hover:bg-white text-[#4A1778] shadow-xs flex items-center justify-center transition-all active:scale-95 border border-[#E9D5FF] cursor-pointer"
            aria-label="Voltar"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Barra de progresso em 3 segmentos */}
          <div className="flex items-center gap-2 bg-white/80 backdrop-blur-xs px-3.5 py-1.5 rounded-full border border-[#E9D5FF]/80 shadow-2xs">
            <div className="flex items-center gap-1.5">
              {[1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === step
                      ? 'w-7 bg-gradient-to-r from-[#8E32D8] to-[#6C22BD]'
                      : idx < step
                      ? 'w-3.5 bg-[#A855F7]'
                      : 'w-3.5 bg-[#E9D5FF]'
                  }`}
                />
              ))}
            </div>
            <span className="text-[11px] font-extrabold text-[#581C87] ml-1">
              {step} de 3
            </span>
          </div>

          <button
            onClick={skipDiagnostic}
            className="px-3 py-1.5 rounded-full text-xs font-extrabold text-[#6B21A8] hover:bg-white/70 transition-colors cursor-pointer"
          >
            Pular
          </button>
        </div>

        {/* Banner com Mascote e Título */}
        <div className="relative mb-5 rounded-[24px] bg-gradient-to-br from-[#7C2AE8] via-[#6D28D9] to-[#4C1D95] p-4 text-white shadow-[0_12px_28px_rgba(109,40,217,0.22)] overflow-hidden">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/15 text-[10px] font-extrabold tracking-wide uppercase mb-1.5">
                {stepMeta.badge}
              </span>
              <h1 className="text-[22px] font-extrabold leading-tight tracking-tight">
                Vamos conhecer você
              </h1>
              <p className="text-[12px] font-bold text-white/85 mt-1 leading-snug">
                {stepMeta.tip}
              </p>
            </div>
            <div className="w-18 h-18 shrink-0 -mr-1 drop-shadow-md">
              <Mascot pose={stepMeta.pose} className="w-full h-full object-contain" />
            </div>
          </div>
        </div>

        {/* PASSO 1 */}
        {step === 1 && (
          <div className="flex flex-col gap-5 animate-fadeIn">
            {/* Pergunta 1 */}
            <div>
              <label className="block text-[14px] font-extrabold text-[#33105D] mb-2.5">
                1. Como você se sente com suas finanças?
              </label>
              <div className="flex flex-col gap-2.5">
                {[
                  {
                    id: 'start_organizing',
                    label: 'Quero começar a me organizar',
                    sub: 'Dar o primeiro passo com clareza',
                    icon: Compass,
                    tint: 'bg-[#F3E8FF] text-[#7E22CE]',
                  },
                  {
                    id: 'partial_control',
                    label: 'Tenho controle parcial',
                    sub: 'Sei parte dos gastos, mas quero melhorar',
                    icon: SlidersHorizontal,
                    tint: 'bg-[#E0F2FE] text-[#0369A1]',
                  },
                  {
                    id: 'improve_planning',
                    label: 'Quero melhorar meu planejamento',
                    sub: 'Focar em metas e fazer o dinheiro render',
                    icon: TrendingUp,
                    tint: 'bg-[#DCFCE7] text-[#15803D]',
                  },
                  {
                    id: 'in_debt',
                    label: 'Estou com dívidas',
                    sub: 'Preciso reorganizar as contas sem aperto',
                    icon: AlertTriangle,
                    tint: 'bg-[#FEF3C7] text-[#B45309]',
                  },
                ].map((opt) => {
                  const Icon = opt.icon
                  const isSelected = feeling === opt.id
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setFeeling(opt.id as any)}
                      className={`flex items-center justify-between p-3.5 rounded-[20px] border-2 text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#8E32D8] bg-white shadow-[0_8px_20px_rgba(142,50,216,0.12)]'
                          : 'border-[#E9D5FF]/80 bg-white/90 hover:border-[#C084FC] hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${opt.tint}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <span className={`block text-[13.5px] font-extrabold leading-tight ${isSelected ? 'text-[#581C87]' : 'text-[#33105D]'}`}>
                            {opt.label}
                          </span>
                          <span className="block text-[11px] font-bold text-[#6B5A8E] mt-0.5">
                            {opt.sub}
                          </span>
                        </div>
                      </div>

                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                          isSelected
                            ? 'border-[#8E32D8] bg-[#8E32D8] text-white'
                            : 'border-[#D8B4FE] bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Pergunta 2: Renda Mensal Customizável */}
            <div className="bg-white rounded-[22px] p-4 border-2 border-[#E9D5FF]/90 shadow-[0_8px_20px_rgba(125,43,214,0.06)]">
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="diag-income-input" className="text-[14px] font-extrabold text-[#33105D]">
                  2. Qual sua renda mensal aproximada?
                </label>
                <span className="text-[11px] font-extrabold text-[#7E22CE] bg-[#F3E8FF] px-2.5 py-0.5 rounded-full">
                  Livre
                </span>
              </div>
              <p className="text-[11.5px] text-[#6B5A8E] font-bold mb-3">
                Líquida (o que cai na conta). Apague ou digite qualquer valor:
              </p>

              {/* Caixa de valor que permite apagar 100% */}
              <div className="relative flex items-center">
                <div className="absolute left-3.5 flex items-center gap-1.5 pointer-events-none">
                  <div className="w-8 h-8 rounded-xl bg-[#F3E8FF] text-[#7E22CE] flex items-center justify-center font-extrabold text-xs">
                    R$
                  </div>
                </div>
                <input
                  id="diag-income-input"
                  type="text"
                  inputMode="numeric"
                  value={incomeInput}
                  onChange={(e) => handleIncomeChange(e.target.value)}
                  placeholder="Digite sua renda (ex: 2500)"
                  className="w-full h-14 pl-14 pr-11 bg-[#FAF5FF] border-2 border-[#D8B4FE] rounded-2xl text-[#33105D] font-extrabold text-[18px] placeholder:text-[#6B5A8E]/45 placeholder:text-sm focus:outline-none focus:border-[#8E32D8] focus:bg-white transition-all"
                />
                {incomeInput.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIncomeInput('')}
                    className="absolute right-3.5 w-7 h-7 rounded-full bg-[#E9D5FF]/70 hover:bg-[#D8B4FE] text-[#581C87] flex items-center justify-center transition-colors cursor-pointer"
                    aria-label="Limpar renda"
                    title="Limpar valor"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Atalhos rápidos de renda */}
              <div className="mt-3">
                <span className="block text-[10.5px] font-extrabold text-[#6B5A8E] uppercase tracking-wider mb-1.5">
                  Toque para preencher rápido:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {quickIncomeValues.map((val) => {
                    const active = monthlyIncome === val && incomeInput !== ''
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setIncomeInput(String(val))}
                        className={`px-2.5 py-1.5 rounded-xl text-[11.5px] font-extrabold transition-all cursor-pointer ${
                          active
                            ? 'bg-[#8E32D8] text-white shadow-xs'
                            : 'bg-[#F3E8FF]/80 text-[#581C87] hover:bg-[#E9D5FF]'
                        }`}
                      >
                        R$ {val.toLocaleString('pt-BR')}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PASSO 2 */}
        {step === 2 && (
          <div className="flex flex-col gap-5 animate-fadeIn">
            {/* Pergunta 3: Gastos Essenciais Customizáveis */}
            <div className="bg-white rounded-[22px] p-4 border-2 border-[#E9D5FF]/90 shadow-[0_8px_20px_rgba(125,43,214,0.06)]">
              <label htmlFor="diag-expenses-input" className="block text-[14px] font-extrabold text-[#33105D] mb-1">
                3. Quanto custam seus gastos essenciais por mês?
              </label>
              <p className="text-[11.5px] text-[#6B5A8E] font-bold mb-3">
                Moradia, mercado, luz/água, transporte, saúde e família.
              </p>

              <div className="relative flex items-center">
                <div className="absolute left-3.5 flex items-center gap-1.5 pointer-events-none">
                  <div className="w-8 h-8 rounded-xl bg-[#F3E8FF] text-[#7E22CE] flex items-center justify-center font-extrabold text-xs">
                    R$
                  </div>
                </div>
                <input
                  id="diag-expenses-input"
                  type="text"
                  inputMode="numeric"
                  value={expensesInput}
                  onChange={(e) => handleExpensesChange(e.target.value)}
                  placeholder="Digite seus gastos (ex: 1800)"
                  className="w-full h-14 pl-14 pr-11 bg-[#FAF5FF] border-2 border-[#D8B4FE] rounded-2xl text-[#33105D] font-extrabold text-[18px] placeholder:text-[#6B5A8E]/45 placeholder:text-sm focus:outline-none focus:border-[#8E32D8] focus:bg-white transition-all"
                />
                {expensesInput.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setExpensesInput('')}
                    className="absolute right-3.5 w-7 h-7 rounded-full bg-[#E9D5FF]/70 hover:bg-[#D8B4FE] text-[#581C87] flex items-center justify-center transition-colors cursor-pointer"
                    aria-label="Limpar gastos"
                    title="Limpar valor"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Atalhos rápidos de gastos */}
              <div className="mt-3">
                <span className="block text-[10.5px] font-extrabold text-[#6B5A8E] uppercase tracking-wider mb-1.5">
                  Sugestões rápidas:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {quickExpenseValues.map((val) => {
                    const active = essentialExpenses === val && expensesInput !== ''
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setExpensesInput(String(val))}
                        className={`px-2.5 py-1.5 rounded-xl text-[11.5px] font-extrabold transition-all cursor-pointer ${
                          active
                            ? 'bg-[#8E32D8] text-white shadow-xs'
                            : 'bg-[#F3E8FF]/80 text-[#581C87] hover:bg-[#E9D5FF]'
                        }`}
                      >
                        R$ {val.toLocaleString('pt-BR')}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Termômetro dinâmico de proporção da renda */}
              {monthlyIncome > 0 && (
                <div className="mt-3.5 pt-3 border-t border-[#F3E8FF] flex items-center justify-between text-xs">
                  <span className="font-bold text-[#6B5A8E]">
                    Comprometimento da renda:
                  </span>
                  <span
                    className={`font-extrabold px-2.5 py-0.5 rounded-full ${
                      evalResult.ratioPct <= 60
                        ? 'bg-[#DCFCE7] text-[#15803D]'
                        : evalResult.ratioPct <= 85
                        ? 'bg-[#FEF3C7] text-[#B45309]'
                        : 'bg-[#FEE2E2] text-[#B91C1C]'
                    }`}
                  >
                    {evalResult.ratioPct}% da renda
                  </span>
                </div>
              )}
            </div>

            {/* Pergunta 4 */}
            <div>
              <label className="block text-[14px] font-extrabold text-[#33105D] mb-2.5">
                4. Você tem reserva financeira hoje?
              </label>
              <div className="flex flex-col gap-2.5">
                {[
                  {
                    id: 'no',
                    label: 'Não tenho reserva no momento',
                    sub: 'Vamos começar do zero passo a passo',
                    icon: Wallet,
                    tint: 'bg-[#FEE2E2] text-[#DC2626]',
                  },
                  {
                    id: 'small',
                    label: 'Sim, uma pequena reserva',
                    sub: 'Já guardei um pouco para imprevistos',
                    icon: PiggyBank,
                    tint: 'bg-[#F3E8FF] text-[#7E22CE]',
                  },
                  {
                    id: 'three_months_plus',
                    label: 'Sim, de 3 meses ou mais de gastos',
                    sub: 'Já tenho uma base de segurança sólida',
                    icon: ShieldCheck,
                    tint: 'bg-[#DCFCE7] text-[#15803D]',
                  },
                ].map((opt) => {
                  const Icon = opt.icon
                  const isSelected = hasEmergencyFund === opt.id
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setHasEmergencyFund(opt.id as any)}
                      className={`flex items-center justify-between p-3.5 rounded-[20px] border-2 text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#8E32D8] bg-white shadow-[0_8px_20px_rgba(142,50,216,0.12)]'
                          : 'border-[#E9D5FF]/80 bg-white/90 hover:border-[#C084FC] hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${opt.tint}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <span className={`block text-[13.5px] font-extrabold leading-tight ${isSelected ? 'text-[#581C87]' : 'text-[#33105D]'}`}>
                            {opt.label}
                          </span>
                          <span className="block text-[11px] font-bold text-[#6B5A8E] mt-0.5">
                            {opt.sub}
                          </span>
                        </div>
                      </div>

                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                          isSelected
                            ? 'border-[#8E32D8] bg-[#8E32D8] text-white'
                            : 'border-[#D8B4FE] bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* PASSO 3 */}
        {step === 3 && (
          <div className="flex flex-col gap-5 animate-fadeIn">
            {/* Pergunta 5 */}
            <div>
              <label className="block text-[14px] font-extrabold text-[#33105D] mb-2.5">
                5. Qual seu principal objetivo agora?
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { label: 'Reserva de emergência', icon: ShieldCheck, tint: 'bg-[#F3E8FF] text-[#7E22CE]' },
                  { label: 'Quitar dívida', icon: CreditCard, tint: 'bg-[#FEF3C7] text-[#B45309]' },
                  { label: 'Viagem dos sonhos', icon: Plane, tint: 'bg-[#E0F2FE] text-[#0369A1]' },
                  { label: 'Fazer um curso', icon: GraduationCap, tint: 'bg-[#DCFCE7] text-[#15803D]' },
                  { label: 'Notebook / compra', icon: Laptop, tint: 'bg-[#FCE7F3] text-[#BE185D]' },
                  { label: 'Outro objetivo', icon: Target, tint: 'bg-[#EDE9FE] text-[#6D28D9]' },
                ].map((goal) => {
                  const Icon = goal.icon
                  const isSelected = mainGoal === goal.label
                  return (
                    <button
                      key={goal.label}
                      type="button"
                      onClick={() => setMainGoal(goal.label)}
                      className={`p-3 rounded-[20px] border-2 flex flex-col items-start gap-2 text-left transition-all relative cursor-pointer ${
                        isSelected
                          ? 'border-[#8E32D8] bg-white shadow-[0_8px_18px_rgba(142,50,216,0.14)]'
                          : 'border-[#E9D5FF]/80 bg-white/90 hover:border-[#C084FC] hover:bg-white'
                      }`}
                    >
                      <div className="w-full flex items-center justify-between">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${goal.tint}`}>
                          <Icon className="w-4.5 h-4.5" />
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            isSelected
                              ? 'border-[#8E32D8] bg-[#8E32D8] text-white'
                              : 'border-[#D8B4FE] bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" strokeWidth={3} />}
                        </div>
                      </div>
                      <span className={`text-[12.5px] font-extrabold leading-tight ${isSelected ? 'text-[#581C87]' : 'text-[#33105D]'}`}>
                        {goal.label}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Campo extra caso escolha "Outro objetivo" */}
              {mainGoal === 'Outro objetivo' && (
                <div className="mt-2.5 animate-fadeIn">
                  <input
                    type="text"
                    value={customGoalName}
                    onChange={(e) => setCustomGoalName(e.target.value)}
                    placeholder="Qual é o seu objetivo? (ex: Casamento, Moto nova...)"
                    className="w-full h-12 px-4 bg-white border-2 border-[#8E32D8] rounded-2xl text-[#33105D] font-extrabold text-xs placeholder:text-[#6B5A8E]/50 focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Pergunta 6 */}
            <div>
              <label className="block text-[14px] font-extrabold text-[#33105D] mb-2.5">
                6. Como é seu hábito com dinheiro?
              </label>
              <div className="flex flex-col gap-2">
                {[
                  {
                    id: 'plans',
                    label: 'Planejo a maioria das minhas compras',
                    icon: ClipboardCheck,
                    tint: 'bg-[#DCFCE7] text-[#15803D]',
                  },
                  {
                    id: 'impulse_sometimes',
                    label: 'Compro por impulso às vezes',
                    icon: ShoppingBag,
                    tint: 'bg-[#F3E8FF] text-[#7E22CE]',
                  },
                  {
                    id: 'uses_credit_a_lot',
                    label: 'Uso muito o cartão no limite',
                    icon: CreditCard,
                    tint: 'bg-[#FEF3C7] text-[#B45309]',
                  },
                  {
                    id: 'no_tracking',
                    label: 'Não acompanho para onde o dinheiro vai',
                    icon: EyeOff,
                    tint: 'bg-[#FEE2E2] text-[#DC2626]',
                  },
                ].map((opt) => {
                  const Icon = opt.icon
                  const isSelected = spendingHabit === opt.id
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSpendingHabit(opt.id as any)}
                      className={`flex items-center justify-between p-3 rounded-[18px] border-2 text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#8E32D8] bg-white shadow-[0_6px_16px_rgba(142,50,216,0.12)]'
                          : 'border-[#E9D5FF]/80 bg-white/90 hover:border-[#C084FC]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${opt.tint}`}>
                          <Icon className="w-4.5 h-4.5" />
                        </div>
                        <span className={`text-[12.5px] font-extrabold ${isSelected ? 'text-[#581C87]' : 'text-[#33105D]'}`}>
                          {opt.label}
                        </span>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ml-2 ${
                          isSelected
                            ? 'border-[#8E32D8] bg-[#8E32D8] text-white'
                            : 'border-[#D8B4FE] bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" strokeWidth={3} />}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Botão de avançar/concluir */}
      <div className="relative z-10 pt-5 pb-2">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={handleNext}
          className="w-full h-14 rounded-full bg-gradient-to-r from-[#8E32D8] to-[#6C22BD] text-white font-extrabold text-[16px] shadow-[0_10px_24px_rgba(124,42,232,0.32)] hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer disabled:opacity-60"
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : step === 3 ? (
            'Concluir diagnóstico'
          ) : (
            'Continuar'
          )}
        </button>
      </div>

      {/* Modal / Tela de Resumo Inicial do Diagnóstico */}
      {showSummaryModal && (
        <div className="fixed inset-0 z-50 bg-[#230B42]/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-[28px] p-6 w-full max-w-sm shadow-2xl flex flex-col items-center text-center relative border-2 border-[#E9D5FF]">
            <div className="-mt-14 mb-2">
              <Mascot size="lg" pose="diploma" floating={true} />
            </div>

            <span className="px-3 py-1 rounded-full bg-[#F3E8FF] text-[#7E22CE] text-[11px] font-extrabold mb-1.5">
              Plano personalizado criado
            </span>
            <h2 className="text-[22px] font-extrabold text-[#33105D] font-sans mb-1">
              Diagnóstico pronto!
            </h2>
            <p className="text-xs font-bold text-[#6B5A8E] mb-4">
              Aqui está um raio-x acolhedor da sua realidade financeira.
            </p>

            {/* Cards de Métricas */}
            <div className="w-full bg-[#FAF5FF] rounded-2xl p-4 mb-4 text-left border border-[#E9D5FF] flex flex-col gap-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-[#6B5A8E]">Renda mensal declarada:</span>
                <span className="font-extrabold text-[#33105D]">{formatCurrency(monthlyIncome)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-[#6B5A8E]">Gastos essenciais ({evalResult.ratioPct}%):</span>
                <span className="font-extrabold text-[#DC2626]">{formatCurrency(essentialExpenses)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-[#6B5A8E]">Margem livre estimada:</span>
                <span className="font-extrabold text-[#16A34A]">
                  {formatCurrency(Math.max(0, monthlyIncome - essentialExpenses))}
                </span>
              </div>
              <div className="border-t border-[#E9D5FF] pt-2 flex justify-between items-center text-xs">
                <span className="font-bold text-[#6B5A8E]">Foco principal:</span>
                <span className="font-extrabold text-[#7E22CE]">{resolvedGoalName}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-[#6B5A8E]">1º degrau da reserva (1 sem):</span>
                <span className="font-extrabold text-[#7E22CE]">{formatCurrency(steps.step1Week)}</span>
              </div>
            </div>

            {/* Mensagem Acolhedora Sem Culpa */}
            <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-2xl p-3.5 mb-4 text-xs text-[#1E3A8A] font-bold text-left leading-relaxed">
              {evalResult.message}
            </div>

            {feeling === 'in_debt' && (
              <div className="bg-[#FEF3C7] border border-[#FDE68A] rounded-2xl p-3 mb-4 text-[11px] text-[#92400E] font-bold text-left leading-relaxed">
                Dica amiga: Para dívidas existentes, consulte gratuitamente o Registrato do Banco Central e os canais oficiais de renegociação do seu banco.
              </div>
            )}

            <button
              type="button"
              onClick={() => navigate('/inicio')}
              className="w-full h-13 rounded-full bg-gradient-to-r from-[#8E32D8] to-[#6C22BD] text-white font-extrabold text-[15px] shadow-[0_8px_20px_rgba(124,42,232,0.28)] hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer"
            >
              Ir para o meu painel
            </button>
          </div>
        </div>
      )}
    </AppShell>
  )
}
export default DiagnosticPage
