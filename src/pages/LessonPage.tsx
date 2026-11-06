// src/pages/LessonPage.tsx
// Experiência Gamificada de Lição Interativa com Suporte a Todas as 5 Tipologias
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import {
  QuizTopBar,
  OptionCard,
  FeedbackPanel,
  ChunkyButton,
  CelebrationScreen,
} from '../features/learn/components'
import { OrderPrioritiesView } from '../features/learn/components/questions/OrderPrioritiesView'
import { ConceptMatchingView } from '../features/learn/components/questions/ConceptMatchingView'
import { FillInTheBlankView } from '../features/learn/components/questions/FillInTheBlankView'
import { ScenarioChoiceView } from '../features/learn/components/questions/ScenarioChoiceView'
import { useQuizEngine } from '../features/learn/engine'
import { learnService } from '../features/learn/services/learnService'
import { LearnQuestion } from '../features/learn/questions'
import { Mascot } from '../components/Mascot'
import confetti from 'canvas-confetti'
import { toast } from 'sonner'

const OPTION_LETTERS = ['A', 'B', 'C', 'D']

export const LessonPage: React.FC = () => {
  const { slug, n, trackSlug, lessonSlug } = useParams<{
    slug?: string
    n?: string
    trackSlug?: string
    lessonSlug?: string
  }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [resolvedLessonSlug, setResolvedLessonSlug] = useState<string>('')
  const [resolvedTrackSlug, setResolvedTrackSlug] = useState<string>('')
  const [questions, setQuestions] = useState<LearnQuestion[]>([])
  const [showExitDialog, setShowExitDialog] = useState(false)
  const [initialHearts, setInitialHearts] = useState<number>(3)

  // Estados para tipologias interativas
  const [orderedItems, setOrderedItems] = useState<string[]>([])
  const [selectedLeftConcept, setSelectedLeftConcept] = useState<string | null>(null)
  const [matchedPairs, setMatchedPairs] = useState<Record<string, string>>({})
  const [shuffledRights, setShuffledRights] = useState<string[]>([])

  // Estados de Conclusão e Resumo do Nível (Prompt N11)
  const [isLevelFinished, setIsLevelFinished] = useState(false)
  const [completionResult, setCompletionResult] = useState<any>(null)
  const [isTrackCompleted, setIsTrackCompleted] = useState(false)
  const [resolvedLessonTitle, setResolvedLessonTitle] = useState<string>('')
  const [resolvedTrackTitle, setResolvedTrackTitle] = useState<string>('')
  const [nextLessonId, setNextLessonId] = useState<string>('')

  // 1. Resolução da Trilha e Lição a partir dos parâmetros de rota
  useEffect(() => {
    async function resolveRoute() {
      setLoading(true)
      try {
        const targetTrack = slug || trackSlug || 'organizacao-financeira'
        let targetLesson = lessonSlug || ''

        const { data: contents } = await supabase
          .from('educational_contents')
          .select('id, lesson_slug, lesson_title, track_title, lesson_order')
          .eq('track_slug', targetTrack)
          .order('lesson_order', { ascending: true })

        let foundIdx = -1
        if (targetLesson && contents) {
          foundIdx = contents.findIndex((c) => c.lesson_slug === targetLesson)
        } else if (n && contents) {
          const levelNum = parseInt(n, 10) || 1
          foundIdx = levelNum - 1
        }

        if (contents && contents.length > 0) {
          const activeItem = contents[foundIdx >= 0 ? foundIdx : 0]
          targetLesson = activeItem.lesson_slug
          setResolvedLessonTitle(activeItem.lesson_title)
          setResolvedTrackTitle(activeItem.track_title)

          const nextItem = contents[(foundIdx >= 0 ? foundIdx : 0) + 1]
          if (nextItem) {
            setNextLessonId(nextItem.id)
          }
        }

        if (!targetLesson) {
          targetLesson = 'para-onde-vai-meu-dinheiro'
          setResolvedLessonTitle('Para onde vai meu dinheiro?')
        }

        setResolvedTrackSlug(targetTrack)
        setResolvedLessonSlug(targetLesson)

        // Carrega as questões para a lição e as estatísticas de vida
        const loadedQuestions = learnService.getQuestionsForLesson(targetLesson)
        setQuestions(loadedQuestions)

        const userStats = await learnService.getStats()
        if (userStats && typeof userStats.hearts === 'number') {
          setInitialHearts(Math.max(1, userStats.hearts))
        }
      } catch (err) {
        console.error('Erro ao resolver parâmetros da lição:', err)
      } finally {
        setLoading(false)
      }
    }

    resolveRoute()
  }, [slug, n, trackSlug, lessonSlug])

  // 2. Conectar com o Motor de Quiz Central
  const {
    state,
    currentQuestion,
    totalQuestions,
    currentIndex,
    status,
    currentAnswer,
    validation,
    hearts,
    progressPercent,
    canVerify,
    selectAnswer,
    verifyAnswer,
    nextQuestion,
  } = useQuizEngine({
    questions,
    lessonSlug: resolvedLessonSlug,
    initialHearts,
    autoSubmitOnCompletion: false,
  })

  // 3. Inicializar dados quando a questão mudar de acordo com a tipologia
  useEffect(() => {
    if (!currentQuestion) return

    if (currentQuestion.typology === 'order_priorities') {
      const q = currentQuestion as any
      const items = [...(q.items || [])]
      // Se já estiver na ordem exata da resposta, inverte os dois primeiros para o usuário interagir
      if (
        q.correctOrder &&
        items.length === q.correctOrder.length &&
        items.every((it: string, idx: number) => it === q.correctOrder[idx]) &&
        items.length > 1
      ) {
        const tmp = items[0]
        items[0] = items[1]
        items[1] = tmp
      }
      setOrderedItems(items)
      selectAnswer(items)
    } else if (currentQuestion.typology === 'concept_matching') {
      const q = currentQuestion as any
      setSelectedLeftConcept(null)
      setMatchedPairs({})
      // Embaralha as definições da direita
      const rights = (q.pairs || []).map((p: any) => p.right).sort(() => Math.random() - 0.5)
      setShuffledRights(rights)
    } else {
      setOrderedItems([])
      setSelectedLeftConcept(null)
      setMatchedPairs({})
      setShuffledRights([])
    }
  }, [currentQuestion?.id])

  // Tratar reordenação de itens (order_priorities)
  const handleMoveOrderItem = (index: number, direction: -1 | 1) => {
    if (status !== 'answering') return
    const list = [...orderedItems]
    const target = index + direction
    if (target < 0 || target >= list.length) return
    const tmp = list[index]
    list[index] = list[target]
    list[target] = tmp
    setOrderedItems(list)
    selectAnswer(list)
  }

  // Tratar conexão de conceitos (concept_matching)
  const handleSelectLeft = (leftText: string) => {
    if (status !== 'answering') return
    setSelectedLeftConcept(leftText)
  }

  const handleSelectRight = (rightText: string) => {
    if (status !== 'answering' || !selectedLeftConcept) return
    const updated = { ...matchedPairs, [selectedLeftConcept]: rightText }
    setMatchedPairs(updated)
    setSelectedLeftConcept(null)

    const q = currentQuestion as any
    if (q.pairs && Object.keys(updated).length === q.pairs.length) {
      selectAnswer(updated)
    }
  }

  // Efeito ao atingir o estado 'completed'
  useEffect(() => {
    if (status === 'completed' && !isLevelFinished) {
      handleCompleteLesson()
    }
  }, [status])

  const handleCompleteLesson = async () => {
    try {
      if (resolvedLessonSlug) {
        const res = await learnService.completeLesson(resolvedLessonSlug)
        setCompletionResult(res)

        if (user) {
          const { data: trackLessons } = await supabase
            .from('educational_contents')
            .select('id')
            .eq('track_slug', resolvedTrackSlug)

          const { data: userProgress } = await supabase
            .from('educational_progress')
            .select('content_id')
            .eq('user_id', user.id)

          const completedSet = new Set(userProgress?.map((p) => p.content_id) || [])
          const allDone = Boolean(
            trackLessons &&
              trackLessons.length > 0 &&
              trackLessons.every((l) => completedSet.has(l.id))
          )
          setIsTrackCompleted(allDone)
        }
      }

      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.5 },
        colors: ['#7D2BD6', '#F5B83D', '#2FBF71'],
      })

      setIsLevelFinished(true)
    } catch (err) {
      console.error('Erro ao concluir lição:', err)
      setIsLevelFinished(true)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF5FF] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 drop-shadow animate-bounce">
          <Mascot pose="loading" className="w-full h-full object-contain" priority />
        </div>
        <p className="font-nunito font-bold text-sm text-purple-900 mt-4">
          Preparando sua lição...
        </p>
      </div>
    )
  }

  // TELA DE PARABÉNS V2 (design/v2/06-parabens.png)
  if (isLevelFinished) {
    const totalQ = questions.length || state.questions.length || 3
    const firstTry = Math.max(0, totalQ - state.mistakesCount)
    const accuracy = totalQ > 0 ? firstTry / totalQ : 1
    // Estrelas acesas conforme precisão: 3 estrelas se >= 90%, 2 estrelas se >= 60%, 1 estrela caso contrário
    const calculatedStars = accuracy >= 0.9 ? 3 : accuracy >= 0.6 ? 2 : 1
    const finalStars = completionResult?.stars || calculatedStars

    return (
      <CelebrationScreen
        levelTitle={resolvedLessonTitle || 'Primeiros passos'}
        trackTitle={resolvedTrackTitle}
        stars={finalStars}
        xpEarned={completionResult?.xp_earned || 20}
        firstTryCount={firstTry}
        totalQuestions={totalQ}
        isTrackCompleted={isTrackCompleted}
        isFirstLevelOfDay={Boolean(completionResult?.newly_completed)}
        streakCount={completionResult?.current_streak || 1}
        onContinueToMap={() => {
          navigate(`/aprender/trilha/${resolvedTrackSlug}`, {
            state: { unlockedLevelId: nextLessonId },
          })
        }}
      />
    )
  }

  // TELA DE GAME OVER
  if (status === 'game_over') {
    return (
      <div className="min-h-screen bg-[#FAF5FF] flex flex-col justify-between max-w-md mx-auto p-6 animate-fadeIn">
        <div className="pt-16 text-center space-y-4">
          <div className="w-24 h-24 mx-auto drop-shadow">
            <Mascot pose="retry" className="w-full h-full object-contain" priority />
          </div>
          <h1 className="font-nunito font-black text-2xl text-[#3B0764]">
            Suas vidas acabaram por hoje!
          </h1>
          <p className="font-nunito text-sm text-gray-600 max-w-xs mx-auto">
            Não desanime! Errar faz parte do aprendizado. Você pode recarregar suas vidas com Moedas Piggy ou tentar novamente quando descansar.
          </p>
        </div>
        <div className="pb-4 space-y-3">
          <ChunkyButton
            variant="secondary"
            size="lg"
            className="w-full"
            onClick={async () => {
              const res = await learnService.rechargeHearts()
              if (res.success) {
                toast.success('Vidas recarregadas com sucesso! ❤️')
                window.location.reload()
              } else {
                toast.error(res.message || 'Moedas insuficientes para recarregar!')
              }
            }}
          >
            RECARREGAR VIDAS (+3)
          </ChunkyButton>
          <ChunkyButton
            variant="primary"
            size="lg"
            className="w-full"
            onClick={() => navigate(`/aprender/trilha/${resolvedTrackSlug}`)}
          >
            VOLTAR AO MAPA
          </ChunkyButton>
        </div>
      </div>
    )
  }

  const currentQ = currentQuestion
  const isAnswering = status === 'answering'
  const isValidated = status === 'correct' || status === 'incorrect'

  return (
    <div className="min-h-screen bg-[#FAF5FF] flex flex-col justify-between max-w-md mx-auto pb-6 relative">
      {/* Top Bar da Lição */}
      <div className="p-4">
        <QuizTopBar
          progress={progressPercent}
          hearts={hearts}
          onClose={() => setShowExitDialog(true)}
        />
      </div>

      {/* Área Central: Enunciado e Pergunta com Mascote Idea */}
      <main className="flex-1 px-5 py-2 flex flex-col justify-center space-y-4">
        {currentQ && (
          <>
            {/* Balão de Fala Comic com Mascote Expressivo */}
            <div className="flex items-end gap-3 animate-fadeIn">
              <div className="w-16 h-16 shrink-0 -mb-1 drop-shadow-md transition-transform duration-300">
                <Mascot
                  pose={
                    status === 'correct'
                      ? 'trophy'
                      : status === 'incorrect'
                      ? 'retry'
                      : 'idea'
                  }
                  className="w-full h-full object-contain"
                  priority
                />
              </div>
              <div className="relative flex-1 bg-white p-4.5 rounded-3xl border-2 border-purple-200/90 shadow-sm">
                {/* Triângulo do balão apontando para o mascote */}
                <div className="absolute -left-2.5 bottom-4 w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-r-[10px] border-r-purple-200/90" />
                <div className="absolute -left-2 bottom-4 w-0 h-0 border-t-[7px] border-t-transparent border-b-[7px] border-b-transparent border-r-[9px] border-r-white" />

                <h2 className="font-nunito font-extrabold text-base sm:text-lg text-[#33105D] leading-snug">
                  {currentQ.prompt}
                </h2>
                {currentQ.contextText && (
                  <p className="font-nunito font-semibold text-xs text-[#7D6A9C] mt-1.5 leading-relaxed bg-[#FAF6FF] p-2.5 rounded-xl border border-purple-100">
                    {currentQ.contextText}
                  </p>
                )}
              </div>
            </div>

            {/* Renderização dinâmica por Tipologia de Questão */}
            <div className="space-y-3 pt-2">
              {currentQ.typology === 'multiple_choice' && (
                <div className="space-y-3">
                  {currentQ.options.map((optionText: string, idx: number) => {
                    let cardState: 'idle' | 'selected' | 'correct' | 'incorrect' = 'idle'
                    const isSelected = currentAnswer === idx

                    if (isValidated) {
                      if (idx === currentQ.correctIndex) {
                        cardState = 'correct'
                      } else if (isSelected) {
                        cardState = 'incorrect'
                      }
                    } else if (isSelected) {
                      cardState = 'selected'
                    }

                    return (
                      <OptionCard
                        key={idx}
                        label={OPTION_LETTERS[idx] || String(idx + 1)}
                        text={optionText}
                        state={cardState}
                        disabled={isValidated}
                        onClick={() => isAnswering && selectAnswer(idx)}
                      />
                    )
                  })}
                </div>
              )}

              {currentQ.typology === 'scenario_choice' && (
                <ScenarioChoiceView
                  question={currentQ}
                  currentAnswer={typeof currentAnswer === 'number' ? currentAnswer : null}
                  disabled={!isAnswering}
                  isValidated={isValidated}
                  onSelect={(idx) => isAnswering && selectAnswer(idx)}
                />
              )}

              {currentQ.typology === 'order_priorities' && (
                <OrderPrioritiesView
                  key={currentQ.id}
                  question={currentQ}
                  disabled={!isAnswering}
                  isValidated={isValidated}
                  isCorrect={status === 'correct'}
                  onAnswerChange={(orderedItems) => isAnswering && selectAnswer(orderedItems)}
                />
              )}

              {currentQ.typology === 'concept_matching' && (
                <ConceptMatchingView
                  key={currentQ.id}
                  question={currentQ}
                  disabled={!isAnswering}
                  isValidated={isValidated}
                  isCorrect={status === 'correct'}
                  onAnswerChange={(matches) => isAnswering && selectAnswer(matches)}
                />
              )}

              {currentQ.typology === 'fill_in_the_blank' && (
                <FillInTheBlankView
                  key={currentQ.id}
                  question={currentQ}
                  disabled={!isAnswering}
                  isValidated={isValidated}
                  isCorrect={status === 'correct'}
                  onAnswerChange={(word) => isAnswering && selectAnswer(word)}
                />
              )}
            </div>
          </>
        )}
      </main>

      {/* Rodapé: Botão "VERIFICAR" */}
      <footer className="px-5 pt-3">
        {isAnswering && (
          <ChunkyButton
            variant={canVerify ? 'primary' : 'neutral'}
            size="lg"
            className="w-full"
            disabled={!canVerify}
            onClick={() => verifyAnswer()}
          >
            VERIFICAR
          </ChunkyButton>
        )}
      </footer>

      {/* Painel de Feedback inferior quando validado */}
      {isValidated && (
        <FeedbackPanel
          status={status === 'correct' ? 'correct' : 'incorrect'}
          title={validation?.feedbackTitle}
          explanation={validation?.explanation}
          tip={currentQ?.tip}
          onAction={() => nextQuestion()}
        />
      )}

      {/* Diálogo de Saída da Lição */}
      {showExitDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-xs w-full shadow-2xl text-center space-y-4">
            <h3 className="font-nunito font-black text-xl text-[#3B0764]">
              Sair da lição?
            </h3>
            <p className="font-nunito text-xs text-gray-600 leading-relaxed">
              Se você sair agora, seu progresso desta tentativa não será salvo. Deseja realmente sair?
            </p>
            <div className="space-y-2 pt-2">
              <ChunkyButton
                variant="primary"
                size="md"
                className="w-full"
                onClick={() => setShowExitDialog(false)}
              >
                CONTINUAR APRENDENDO
              </ChunkyButton>
              <button
                type="button"
                onClick={() => navigate(`/aprender/trilha/${resolvedTrackSlug}`)}
                className="w-full py-2 font-nunito font-bold text-xs text-red-500 hover:text-red-700 transition-colors"
              >
                Sair mesmo assim
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
export default LessonPage
