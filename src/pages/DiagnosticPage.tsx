import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { Mascot } from '../components/Mascot'
import { Button } from '../components/Button'
import { AppShell } from '../components/AppShell'
import { evaluateFinancialDiagnosis, generateInitialBudget, getEmergencyFundSteps } from '../lib/finance'
import { formatCurrency } from '../lib/format'
import { ArrowLeft, Sparkles, CheckCircle2, ShieldCheck, Heart } from 'lucide-react'
import { toast } from 'sonner'
import confetti from 'canvas-confetti'

export const DiagnosticPage: React.FC = () => {
  const navigate = useNavigate()
  const { user, refreshProfile } = useAuth()

  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSummaryModal, setShowSummaryModal] = useState(false)

  // Respostas do questionário
  const [feeling, setFeeling] = useState<'start_organizing' | 'partial_control' | 'improve_planning' | 'in_debt'>('start_organizing')
  const [monthlyIncome, setMonthlyIncome] = useState<number>(3000)
  const [essentialExpenses, setEssentialExpenses] = useState<number>(1800)
  const [hasEmergencyFund, setHasEmergencyFund] = useState<'no' | 'small' | 'three_months_plus'>('small')
  const [mainGoal, setMainGoal] = useState<string>('Reserva de emergência')
  const [spendingHabit, setSpendingHabit] = useState<'plans' | 'impulse_sometimes' | 'uses_credit_a_lot' | 'no_tracking'>('impulse_sometimes')

  const handleNext = () => {
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
        main_goal: mainGoal,
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

      // 4. Criar meta "Reserva de emergência" (primeiro passo de 1 semana)
      const steps = getEmergencyFundSteps(essentialExpenses)
      await supabase.from('financial_goals').insert({
        user_id: user.id,
        name: 'Reserva de emergência',
        category: 'emergency',
        target_amount: steps.step1Week * 4, // 1 mês completo como alvo da meta inicial
        saved_amount: 0,
        deadline: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        icon: 'ShieldCheck',
      })

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

  return (
    <AppShell showNav={false} className="px-6 py-6 justify-between bg-white relative">
      <div>
        {/* Header do wizard */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handlePrev}
            className="p-2 -ml-2 rounded-full hover:bg-lilac/10 text-deep transition-colors"
            aria-label="Voltar"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>

          {/* Contador 1 de 3 */}
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-lilac/25 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
            <span className="text-xs font-bold text-textSec">{step} de 3</span>
          </div>

          <button
            onClick={skipDiagnostic}
            className="text-xs font-bold text-textSec hover:text-primary transition-colors"
          >
            Pular
          </button>
        </div>

        {/* Título do cabeçalho */}
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-deep font-sans mb-1">
            Vamos conhecer você
          </h1>
          <p className="text-sm font-semibold text-textSec leading-relaxed">
            Responda no seu ritmo. Não existe resposta certa ou errada.
          </p>
        </div>

        {/* Passo 1 */}
        {step === 1 && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            <div>
              <label className="block text-sm font-extrabold text-deep mb-3">
                1. Como você se sente com suas finanças?
              </label>
              <div className="flex flex-col gap-2.5">
                {[
                  { id: 'start_organizing', label: 'Quero começar a me organizar' },
                  { id: 'partial_control', label: 'Tenho controle parcial' },
                  { id: 'improve_planning', label: 'Quero melhorar meu planejamento' },
                  { id: 'in_debt', label: 'Estou com dívidas' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setFeeling(opt.id as any)}
                    className={`flex items-center justify-between p-4 rounded-2xl border text-left text-sm font-bold transition-all ${
                      feeling === opt.id
                        ? 'border-primary bg-primary/5 text-primary shadow-xs'
                        : 'border-lilac/30 hover:border-lilac/60 text-deep bg-white'
                    }`}
                  >
                    <span>{opt.label}</span>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        feeling === opt.id
                          ? 'border-primary bg-primary'
                          : 'border-lilac/40'
                      }`}
                    >
                      {feeling === opt.id && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-extrabold text-deep mb-2">
                2. Qual sua renda mensal aproximada?
              </label>
              <p className="text-xs text-textSec font-semibold mb-3">
                Líquida (o que de fato cai na sua conta todo mês).
              </p>
              <div className="relative flex items-center">
                <span className="absolute left-4 font-extrabold text-primary">R$</span>
                <input
                  type="number"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(Math.max(0, Number(e.target.value)))}
                  className="w-full h-13 pl-12 pr-4 bg-bg border border-lilac/30 rounded-2xl text-deep font-extrabold text-base focus:outline-none focus:border-primary"
                  placeholder="3000"
                />
              </div>
            </div>
          </div>
        )}

        {/* Passo 2 */}
        {step === 2 && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            <div>
              <label className="block text-sm font-extrabold text-deep mb-2">
                3. Quanto custam seus gastos essenciais por mês?
              </label>
              <p className="text-xs text-textSec font-semibold mb-3">
                Moradia, mercado, luz/água, transporte, farmácia e filhos/família.
              </p>
              <div className="relative flex items-center">
                <span className="absolute left-4 font-extrabold text-primary">R$</span>
                <input
                  type="number"
                  value={essentialExpenses}
                  onChange={(e) => setEssentialExpenses(Math.max(0, Number(e.target.value)))}
                  className="w-full h-13 pl-12 pr-4 bg-bg border border-lilac/30 rounded-2xl text-deep font-extrabold text-base focus:outline-none focus:border-primary"
                  placeholder="1800"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-extrabold text-deep mb-3">
                4. Você tem reserva financeira hoje?
              </label>
              <div className="flex flex-col gap-2.5">
                {[
                  { id: 'no', label: 'Não tenho reserva no momento' },
                  { id: 'small', label: 'Sim, uma pequena reserva' },
                  { id: 'three_months_plus', label: 'Sim, de 3 meses ou mais de gastos' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setHasEmergencyFund(opt.id as any)}
                    className={`flex items-center justify-between p-4 rounded-2xl border text-left text-sm font-bold transition-all ${
                      hasEmergencyFund === opt.id
                        ? 'border-primary bg-primary/5 text-primary shadow-xs'
                        : 'border-lilac/30 hover:border-lilac/60 text-deep bg-white'
                    }`}
                  >
                    <span>{opt.label}</span>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        hasEmergencyFund === opt.id
                          ? 'border-primary bg-primary'
                          : 'border-lilac/40'
                      }`}
                    >
                      {hasEmergencyFund === opt.id && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Passo 3 */}
        {step === 3 && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            <div>
              <label className="block text-sm font-extrabold text-deep mb-3">
                5. Qual seu principal objetivo agora?
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  'Reserva de emergência',
                  'Quitar dívida',
                  'Viagem dos sonhos',
                  'Fazer um curso',
                  'Notebook / compra',
                  'Outro objetivo',
                ].map((goal) => (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => setMainGoal(goal)}
                    className={`p-3 rounded-2xl border text-center text-xs font-bold transition-all ${
                      mainGoal === goal
                        ? 'border-primary bg-primary/10 text-primary shadow-xs'
                        : 'border-lilac/30 text-deep bg-white hover:border-lilac/60'
                    }`}
                  >
                    {goal}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-extrabold text-deep mb-3">
                6. Como é seu hábito com dinheiro?
              </label>
              <div className="flex flex-col gap-2.5">
                {[
                  { id: 'plans', label: 'Planejo a maioria das minhas compras' },
                  { id: 'impulse_sometimes', label: 'Compro por impulso às vezes' },
                  { id: 'uses_credit_a_lot', label: 'Uso muito o cartão no limite' },
                  { id: 'no_tracking', label: 'Não acompanho para onde o dinheiro vai' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSpendingHabit(opt.id as any)}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border text-left text-xs font-bold transition-all ${
                      spendingHabit === opt.id
                        ? 'border-primary bg-primary/5 text-primary shadow-xs'
                        : 'border-lilac/30 text-deep bg-white'
                    }`}
                  >
                    <span>{opt.label}</span>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ml-2 ${
                        spendingHabit === opt.id
                          ? 'border-primary bg-primary'
                          : 'border-lilac/40'
                      }`}
                    >
                      {spendingHabit === opt.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Botão de avançar/concluir */}
      <div className="pt-6 pb-2">
        <Button
          size="lg"
          fullWidth
          loading={isSubmitting}
          onClick={handleNext}
        >
          {step === 3 ? 'Concluir diagnóstico' : 'Continuar'}
        </Button>
      </div>

      {/* Modal / Tela de Resumo Inicial do Diagnóstico */}
      {showSummaryModal && (
        <div className="fixed inset-0 z-50 bg-deep/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-[26px] p-6 w-full max-w-sm shadow-2xl flex flex-col items-center text-center relative border border-lilac/20">
            <div className="-mt-14 mb-2">
              <Mascot size="lg" pose="diploma" floating={true} />
            </div>

            <h2 className="text-xl font-extrabold text-deep font-sans mb-1">
              Diagnóstico pronto! 💜
            </h2>
            <p className="text-xs font-bold text-textSec mb-4">
              Aqui está um raio-x acolhedor da sua realidade.
            </p>

            {/* Cards de Métricas */}
            <div className="w-full bg-bg rounded-2xl p-4 mb-4 text-left border border-lilac/15 flex flex-col gap-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-textSec">Renda mensal declarada:</span>
                <span className="font-extrabold text-deep">{formatCurrency(monthlyIncome)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-textSec">Gastos essenciais ({evalResult.ratioPct}%):</span>
                <span className="font-extrabold text-danger">{formatCurrency(essentialExpenses)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-textSec">Sobra estimada para o mês:</span>
                <span className="font-extrabold text-success">
                  {formatCurrency(Math.max(0, monthlyIncome - essentialExpenses))}
                </span>
              </div>
              <div className="border-t border-lilac/15 pt-2 flex justify-between items-center text-xs">
                <span className="font-semibold text-textSec">Primeiro degrau sugerido (1 semana):</span>
                <span className="font-extrabold text-primary">{formatCurrency(steps.step1Week)}</span>
              </div>
            </div>

            {/* Mensagem Acolhedora Sem Culpa */}
            <div className="bg-baby/60 border border-blue-100 rounded-xl p-3 mb-5 text-xs text-deep font-semibold text-left">
              💬 {evalResult.message}
            </div>

            {feeling === 'in_debt' && (
              <div className="bg-gold/20 border border-gold/40 rounded-xl p-3 mb-5 text-[11px] text-deep font-bold text-left">
                ℹ️ Dica amiga: Para dívidas existentes, utilize canais oficiais e gratuitos como o Registrato do Banco Central e os feirões Limpa Nome da Serasa.
              </div>
            )}

            <Button
              size="lg"
              fullWidth
              onClick={() => navigate('/inicio')}
            >
              Ir para o meu painel
            </Button>
          </div>
        </div>
      )}
    </AppShell>
  )
}
