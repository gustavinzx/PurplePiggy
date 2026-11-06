// src/features/learn/components/DailyQuestsSheet.tsx
// Sistema de Tarefas Diárias estilo Duolingo (Ofensiva, Meta de XP e Desafio Rápido Diário)
import React, { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { X, CheckCircle2, Play, Sparkles, ArrowRight } from 'lucide-react'
import { Mascot } from '../../../components/Mascot'
import { learnService, LearnStats } from '../services/learnService'
import { MultipleChoiceQuestion, ScenarioChoiceQuestion, FillInTheBlankQuestion } from '../questions/types'
import { toast } from 'sonner'

interface DailyQuestsSheetProps {
  isOpen: boolean
  onClose: () => void
  stats: LearnStats | null
  dailyChallengeDone: boolean
  studiedToday: boolean
  onCompleteDailyChallenge: () => Promise<void>
  onStartCurrentLesson: () => void
  onShieldPurchased?: (newStats: LearnStats) => void
}

export const DailyQuestsSheet: React.FC<DailyQuestsSheetProps> = ({
  isOpen,
  onClose,
  stats,
  dailyChallengeDone,
  studiedToday,
  onCompleteDailyChallenge,
  onStartCurrentLesson,
  onShieldPurchased,
}) => {
  const [quizActive, setQuizActive] = useState(false)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; explanation: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [isBuyingShield, setIsBuyingShield] = useState(false)

  const handleBuyStreakFreeze = async () => {
    setIsBuyingShield(true)
    try {
      const res = await learnService.buyShield()
      if (res.success) {
        toast.success('Escudo de Ofensiva ativado com sucesso! 🛡️')
        const updated = await learnService.getStats()
        if (onShieldPurchased) onShieldPurchased(updated)
      } else {
        toast.error(res.message || 'Moedas insuficientes para comprar o escudo.')
      }
    } catch {
      toast.error('Erro ao adquirir escudo.')
    } finally {
      setIsBuyingShield(false)
    }
  }

  // Seleciona uma questão de múltipla escolha/cenário do dia com alternativas variadas
  const dailyQuestion = useMemo(() => {
    const raw = learnService.getDailyChallenge()
    if (raw.typology === 'multiple_choice' || raw.typology === 'scenario_choice') {
      return raw as MultipleChoiceQuestion | ScenarioChoiceQuestion
    }
    if (raw.typology === 'fill_in_the_blank') {
      const fb = raw as FillInTheBlankQuestion
      const correctIdx = fb.options.indexOf(fb.correctAnswer)
      return {
        ...fb,
        typology: 'multiple_choice' as const,
        prompt: `${fb.prompt} "${fb.sentence}"`,
        options: fb.options,
        correctIndex: correctIdx >= 0 ? correctIdx : 1,
      }
    }
    // Fallback para questão de múltipla escolha do dia
    const all = learnService.getQuestionsForLesson('para-onde-vai-meu-dinheiro')
    const mc = all.find((q) => q.typology === 'multiple_choice' || q.typology === 'scenario_choice')
    return mc as MultipleChoiceQuestion | ScenarioChoiceQuestion
  }, [])

  if (!isOpen) return null

  const streakCount = stats?.streak_count ?? 0
  const xpPoints = stats?.xp_points ?? 0

  // Cálculo das 3 Tarefas Diárias (estilo Duolingo)
  const quest1Done = studiedToday || dailyChallengeDone || streakCount > 0
  const quest2Progress = Math.min(20, (studiedToday ? 20 : 0) + (dailyChallengeDone ? 20 : xpPoints >= 20 ? 20 : 0))
  const quest2Done = quest2Progress >= 20
  const quest3Done = dailyChallengeDone

  const completedCount = [quest1Done, quest2Done, quest3Done].filter(Boolean).length

  const handleCheckDailyAnswer = async () => {
    if (selectedOption === null || !dailyQuestion) return
    const isCorrect = selectedOption === dailyQuestion.correctIndex
    setFeedback({
      isCorrect,
      explanation: dailyQuestion.explanation,
    })

    if (isCorrect && !dailyChallengeDone) {
      setSubmitting(true)
      try {
        await onCompleteDailyChallenge()
        toast.success('Tarefa diária concluída! +25 XP e +15 moedas')
      } finally {
        setSubmitting(false)
      }
    }
  }

  const sheetContent = (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-[#1F0F38]/60 backdrop-blur-xs animate-fadeIn p-0 sm:p-4">
      <div
        className="w-full max-w-[430px] max-h-[88dvh] bg-white rounded-t-[28px] sm:rounded-[28px] px-5 pt-4 flex flex-col shadow-2xl border-t border-purple-100 relative animate-slideUp overflow-y-auto"
        style={{
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)',
        }}
      >
        {/* Pílula superior */}
        <div className="w-11 h-1.5 bg-purple-200/70 rounded-full mx-auto mb-3 shrink-0" />

        {/* Botão Fechar */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar tarefas diárias"
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#F5EEFF] flex items-center justify-center text-[#6E568A] hover:text-[#432171] active:scale-95 transition-transform"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Cabeçalho com Mascote e Resumo de Ofensiva/XP */}
        <div className="w-full bg-gradient-to-r from-[#7D2BD6] via-[#8E2DE2] to-[#A635F0] rounded-[22px] p-4 text-white flex items-center justify-between gap-3 shadow-md mb-4 shrink-0">
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-200">
              Missões do Dia · {completedCount}/3 concluídas
            </span>
            <h3 className="font-nunito font-black text-[18px] leading-tight mt-0.5">
              Tarefas Diárias Piggy
            </h3>
            <div className="flex items-center gap-3 mt-2">
              <div className="inline-flex items-center gap-1 bg-white/15 px-2.5 py-1 rounded-full text-xs font-extrabold">
                <img src="/assets/icons/icon-chama.png" alt="" className="w-4 h-4 object-contain" />
                <span>{streakCount} {streakCount === 1 ? 'dia' : 'dias'}</span>
              </div>
              <div className="inline-flex items-center gap-1 bg-white/15 px-2.5 py-1 rounded-full text-xs font-extrabold">
                <img src="/assets/icons/icon-xp.png" alt="" className="w-4 h-4 object-contain" />
                <span>{xpPoints} XP</span>
              </div>
            </div>
          </div>
          <div className="w-16 h-16 shrink-0 flex items-center justify-center">
            <Mascot pose="trophy" size="sm" className="w-16 h-16 object-contain" />
          </div>
        </div>

        {/* Card de Proteção de Ofensiva (Streak Freeze) */}
        <div className="w-full rounded-[20px] border-2 border-indigo-100 bg-[#F4F7FF] p-3.5 flex flex-col gap-2.5 mb-3 shadow-xs shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-indigo-100/90 border border-indigo-200 flex items-center justify-center shrink-0">
                <img src="/assets/icons/icon-chama.png" alt="" className="w-5 h-5 object-contain" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-nunito font-black text-[14px] text-[#1E1B4B] leading-tight">
                    Streak Freeze
                  </p>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-200/60 text-[#312E81]">
                    {stats?.streak_shields ?? 0}/2 ativos
                  </span>
                </div>
                <p className="font-nunito font-semibold text-[11px] text-[#475569] leading-tight mt-0.5">
                  Protege sua ofensiva se você esquecer de estudar por 1 dia.
                </p>
              </div>
            </div>

            {(stats?.streak_shields ?? 0) < 2 ? (
              <button
                type="button"
                onClick={handleBuyStreakFreeze}
                disabled={isBuyingShield || (stats?.piggy_coins ?? 0) < 50}
                className="inline-flex items-center gap-1 text-[11px] font-black text-white bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] px-3 py-1.5 rounded-full shadow-xs active:scale-95 disabled:opacity-50 shrink-0 cursor-pointer"
              >
                <img src="/assets/coins/coin-1.png" alt="" className="w-3.5 h-3.5 object-contain" />
                <span>50</span>
              </button>
            ) : (
              <span className="text-[11px] font-black text-[#15803D] bg-emerald-100 px-2.5 py-1 rounded-full shrink-0">
                Protegida
              </span>
            )}
          </div>
          {stats?.freeze_used_today && (
            <div className="text-[11px] font-bold text-[#1E3A8A] bg-blue-100/80 px-2.5 py-1 rounded-xl">
              Seu escudo protegeu sua ofensiva hoje! Complete uma atividade para mantê-la.
            </div>
          )}
        </div>

        {/* Lista de 3 Tarefas Diárias estilo Duolingo */}
        <div className="w-full space-y-3">
          {/* Tarefa 1: Manter a Ofensiva */}
          <div className="w-full rounded-[20px] border-2 border-purple-100 bg-[#FAF6FF] p-3.5 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-amber-100/80 border border-amber-200 flex items-center justify-center shrink-0">
                  <img src="/assets/icons/icon-chama.png" alt="" className="w-6 h-6 object-contain" />
                </div>
                <div className="min-w-0">
                  <p className="font-nunito font-black text-[14px] text-[#351B5A] leading-tight">
                    Manter a Ofensiva Ativa
                  </p>
                  <p className="font-nunito font-semibold text-[11px] text-[#6E568A]">
                    Complete 1 lição ou desafio hoje
                  </p>
                </div>
              </div>
              {quest1Done ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-black text-[#15803D] bg-emerald-100 px-2.5 py-1 rounded-full shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Concluída
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onClose()
                    onStartCurrentLesson()
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-black text-white bg-[#7D2BD6] px-3 py-1.5 rounded-full shadow-xs active:scale-95 shrink-0"
                >
                  Praticar <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
            {/* Barra de progresso */}
            <div className="w-full bg-purple-200/50 h-2.5 rounded-full overflow-hidden flex items-center">
              <div
                className="h-full bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] rounded-full transition-all duration-500"
                style={{ width: quest1Done ? '100%' : '0%' }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-extrabold text-[#6E568A]">
              <span>Progresso: {quest1Done ? '1 / 1' : '0 / 1'}</span>
              <span className="text-[#7D2BD6]">+15 XP</span>
            </div>
          </div>

          {/* Tarefa 2: Meta de XP do Dia */}
          <div className="w-full rounded-[20px] border-2 border-purple-100 bg-[#FAF6FF] p-3.5 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 border border-purple-200 flex items-center justify-center shrink-0">
                  <img src="/assets/icons/icon-xp.png" alt="" className="w-6 h-6 object-contain" />
                </div>
                <div className="min-w-0">
                  <p className="font-nunito font-black text-[14px] text-[#351B5A] leading-tight">
                    Meta Diária de XP
                  </p>
                  <p className="font-nunito font-semibold text-[11px] text-[#6E568A]">
                    Conquiste 20 XP estudando na trilha
                  </p>
                </div>
              </div>
              {quest2Done && (
                <span className="inline-flex items-center gap-1 text-[11px] font-black text-[#15803D] bg-emerald-100 px-2.5 py-1 rounded-full shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 20/20 XP
                </span>
              )}
            </div>
            <div className="w-full bg-purple-200/50 h-2.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#7D2BD6] to-[#B037F8] rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (quest2Progress / 20) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-extrabold text-[#6E568A]">
              <span>Progresso: {quest2Progress} / 20 XP</span>
              <span className="text-[#7D2BD6]">+20 XP</span>
            </div>
          </div>

          {/* Tarefa 3: Desafio Rápido Diário (Interativo dentro do modal!) */}
          <div className="w-full rounded-[20px] border-2 border-purple-200 bg-white p-3.5 flex flex-col gap-2.5 shadow-xs">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                  <img src="/assets/icons/icon-bau.png" alt="" className="w-6 h-6 object-contain" />
                </div>
                <div className="min-w-0">
                  <p className="font-nunito font-black text-[14px] text-[#351B5A] leading-tight">
                    Desafio Rápido do Dia
                  </p>
                  <p className="font-nunito font-semibold text-[11px] text-[#6E568A]">
                    Responda a pergunta relâmpago de hoje
                  </p>
                </div>
              </div>
              {quest3Done ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-black text-[#15803D] bg-emerald-100 px-2.5 py-1 rounded-full shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" /> +25 XP
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setQuizActive((prev) => !prev)}
                  className="inline-flex items-center gap-1 text-[11px] font-black text-white bg-gradient-to-r from-[#7D2BD6] to-[#9B34EF] px-3 py-1.5 rounded-full shadow-xs active:scale-95 shrink-0"
                >
                  <Play className="w-3 h-3 fill-white" />
                  {quizActive ? 'Ocultar' : 'Responder'}
                </button>
              )}
            </div>

            {/* Pergunta Relâmpago Interativa */}
            {(quizActive || quest3Done) && dailyQuestion && (
              <div className="mt-1 pt-2.5 border-t border-purple-100 space-y-2.5">
                {dailyQuestion.typology === 'scenario_choice' && (
                  <div className="p-2.5 rounded-xl bg-purple-50/80 border border-purple-100 text-[11.5px] font-semibold text-[#432171] leading-snug">
                    {dailyQuestion.scenarioText}
                  </div>
                )}
                <p className="font-nunito font-extrabold text-[13px] text-[#351B5A] leading-snug">
                  {dailyQuestion.prompt}
                </p>

                <div className="space-y-1.5">
                  {dailyQuestion.options.map((opt, idx) => {
                    const isSelected = selectedOption === idx
                    const isRight = feedback && idx === dailyQuestion.correctIndex
                    const isWrongSelected = feedback && isSelected && !feedback.isCorrect

                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={quest3Done || Boolean(feedback?.isCorrect)}
                        onClick={() => {
                          setSelectedOption(idx)
                          setFeedback(null)
                        }}
                        className={`w-full text-left p-2.5 rounded-xl border-2 text-[12px] font-bold transition-all flex items-center justify-between gap-2 ${
                          isRight
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
                            : isWrongSelected
                            ? 'bg-rose-50 border-rose-400 text-rose-900'
                            : isSelected
                            ? 'bg-purple-100/90 border-[#7D2BD6] text-[#351B5A]'
                            : 'bg-[#FAF6FF] border-purple-100 text-[#432171] hover:border-purple-300'
                        }`}
                      >
                        <span className="leading-snug">{opt}</span>
                      </button>
                    )
                  })}
                </div>

                {feedback && (
                  <div
                    className={`p-2.5 rounded-xl text-[11.5px] font-bold leading-snug ${
                      feedback.isCorrect
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-50 text-amber-900 border border-amber-200'
                    }`}
                  >
                    <span className="font-black block mb-0.5">
                      {feedback.isCorrect ? 'Mandou muito bem! +25 XP' : 'Quase lá! Tente outra opção:'}
                    </span>
                    {feedback.explanation}
                  </div>
                )}

                {!quest3Done && !feedback?.isCorrect && (
                  <button
                    type="button"
                    disabled={selectedOption === null || submitting}
                    onClick={handleCheckDailyAnswer}
                    className="w-full py-2.5 rounded-full bg-gradient-to-r from-[#7D2BD6] to-[#9B34EF] text-white font-nunito font-black text-[13px] shadow-sm disabled:opacity-50 active:scale-[0.99] transition-all flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4" />
                    {submitting ? 'Confirmando...' : 'Verificar resposta'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  return typeof document !== 'undefined' ? createPortal(sheetContent, document.body) : sheetContent
}

export default DailyQuestsSheet
