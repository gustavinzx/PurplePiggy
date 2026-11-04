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
} from '../features/learn/components'
import { useQuizEngine } from '../features/learn/engine'
import { learnService } from '../features/learn/services/learnService'
import { LearnQuestion } from '../features/learn/questions'
import { Mascot } from '../components/Mascot'
import confetti from 'canvas-confetti'
import { ChevronUp, ChevronDown, Check } from 'lucide-react'

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

  // Estados para tipologias interativas
  const [orderedItems, setOrderedItems] = useState<string[]>([])
  const [selectedLeftConcept, setSelectedLeftConcept] = useState<string | null>(null)
  const [matchedPairs, setMatchedPairs] = useState<Record<string, string>>({})
  const [shuffledRights, setShuffledRights] = useState<string[]>([])

  // Estados de Conclusão e Resumo do Nível (Prompt N11)
  const [isLevelFinished, setIsLevelFinished] = useState(false)
  const [completionResult, setCompletionResult] = useState<any>(null)
  const [isTrackCompleted, setIsTrackCompleted] = useState(false)

  // 1. Resolução da Trilha e Lição a partir dos parâmetros de rota
  useEffect(() => {
    async function resolveRoute() {
      setLoading(true)
      try {
        const targetTrack = slug || trackSlug || 'organizacao-financeira'
        let targetLesson = lessonSlug || ''

        // Se a rota for /aprender/trilha/:slug/nivel/:n
        if (!targetLesson && n) {
          const levelNum = parseInt(n, 10) || 1
          const { data: contents } = await supabase
            .from('educational_contents')
            .select('lesson_slug')
            .eq('track_slug', targetTrack)
            .order('lesson_order', { ascending: true })

          if (contents && contents[levelNum - 1]) {
            targetLesson = contents[levelNum - 1].lesson_slug
          } else if (contents && contents[0]) {
            targetLesson = contents[0].lesson_slug
          }
        }

        if (!targetLesson) {
          targetLesson = 'para-onde-vai-meu-dinheiro'
        }

        setResolvedTrackSlug(targetTrack)
        setResolvedLessonSlug(targetLesson)

        // Buscar questões reais vinculadas a esta lição
        const loadedQuestions = learnService.getQuestionsForLesson(targetLesson)
        setQuestions(loadedQuestions)
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
    initialHearts: 3,
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

  // TELA DE CONCLUSÃO DO NÍVEL
  if (isLevelFinished) {
    const isPerfect = state?.mistakesCount === 0
    return (
      <div className="min-h-screen bg-[#FAF5FF] flex flex-col justify-between max-w-md mx-auto p-6 animate-fadeIn">
        <div className="pt-8 text-center space-y-4">
          <div className="w-28 h-28 mx-auto drop-shadow-lg">
            <Mascot
              pose={isTrackCompleted ? 'diploma' : isPerfect ? 'trophy' : 'medal'}
              className="w-full h-full object-contain"
              priority
            />
          </div>

          <div>
            <span className="text-xs font-black uppercase tracking-wider text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
              {isTrackCompleted ? 'TRILHA FINALIZADA' : 'NÍVEL CONCLUÍDO'}
            </span>
            <h1 className="font-nunito font-black text-2xl sm:text-3xl text-[#3B0764] mt-2">
              {isTrackCompleted
                ? 'Trilha concluída! Parabéns!'
                : isPerfect
                ? 'Incrível! Tudo de primeira!'
                : 'Muito bem! Você completou!'}
            </h1>
            <p className="font-nunito font-semibold text-sm text-gray-600 mt-1">
              {isTrackCompleted
                ? 'Você dominou todos os conceitos desta unidade.'
                : 'Pequenos passos constantes constroem sua tranquilidade financeira.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3">
            <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-sm flex flex-col items-center text-center">
              <img src="/assets/icons/icon-xp.png" alt="XP" className="w-8 h-8 object-contain mb-1" />
              <span className="font-nunito font-black text-lg text-[#7D2BD6]">
                +{completionResult?.xp_earned || 20} XP
              </span>
              <span className="font-nunito font-bold text-xs text-gray-500">Experiência</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-sm flex flex-col items-center text-center">
              <img src="/assets/coins/coin-1.png" alt="Moedas" className="w-8 h-8 object-contain mb-1" />
              <span className="font-nunito font-black text-lg text-[#B45309]">
                +{completionResult?.coins_earned || 10} Moedas
              </span>
              <span className="font-nunito font-bold text-xs text-gray-500">Piggy Moedas</span>
            </div>
          </div>
        </div>

        <div className="pb-4">
          <ChunkyButton
            variant="success"
            size="lg"
            className="w-full text-base font-black tracking-wide"
            onClick={() => navigate(`/aprender/trilha/${resolvedTrackSlug}`)}
          >
            CONTINUAR PARA O MAPA
          </ChunkyButton>
        </div>
      </div>
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
            Não desanime! Errar faz parte do aprendizado. Respire fundo e tente novamente quando quiser.
          </p>
        </div>
        <div className="pb-4">
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
            {/* Balão com Mascote Idea */}
            <div className="flex items-start gap-3 bg-white p-4 rounded-3xl border border-purple-100 shadow-sm animate-fadeIn">
              <div className="w-14 h-14 shrink-0 drop-shadow">
                <Mascot pose="idea" className="w-full h-full object-contain" priority />
              </div>
              <div className="flex-1 pt-1">
                <h2 className="font-nunito font-extrabold text-base sm:text-lg text-[#3B0764] leading-snug">
                  {currentQ.prompt}
                </h2>
                {currentQ.contextText && (
                  <p className="font-nunito text-xs text-gray-500 mt-1 leading-relaxed">
                    {currentQ.contextText}
                  </p>
                )}
              </div>
            </div>

            {/* TIPOLOGIA 1 & 2: multiple_choice e scenario_choice */}
            {(currentQ.typology === 'multiple_choice' || currentQ.typology === 'scenario_choice') && (
              <div className="space-y-3 pt-1">
                {'options' in currentQ &&
                  (currentQ as any).options.map((optionText: string, idx: number) => {
                    let cardState: 'idle' | 'selected' | 'correct' | 'incorrect' = 'idle'
                    const isSelected = currentAnswer === idx

                    if (isValidated) {
                      if (idx === (currentQ as any).correctIndex) {
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

            {/* TIPOLOGIA 3: order_priorities (Ordenação com setas táteis) */}
            {currentQ.typology === 'order_priorities' && (
              <div className="space-y-2.5 pt-1">
                {orderedItems.map((itemText: string, idx: number) => (
                  <div
                    key={itemText}
                    className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 border-b-4 transition-all select-none ${
                      isValidated
                        ? status === 'correct'
                          ? 'bg-[#DCFCE7] border-[#2FBF71] border-b-[#1E824C] text-[#15803D]'
                          : 'bg-[#FCE7F3] border-[#E5487A] border-b-[#BE185D] text-[#BE185D]'
                        : 'bg-white border-[#E8DEFB] border-b-[#D8C2FF] text-[#432171]'
                    }`}
                  >
                    <span className="w-7 h-7 rounded-full bg-purple-100 text-[#7D2BD6] font-nunito font-black text-xs flex items-center justify-center shrink-0">
                      {idx + 1}º
                    </span>
                    <span className="flex-1 font-nunito font-bold text-xs sm:text-sm leading-snug">
                      {itemText}
                    </span>
                    {!isValidated && (
                      <div className="flex flex-col gap-1 shrink-0">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveOrderItem(idx, -1)}
                          className="w-7 h-7 rounded-lg bg-purple-50 hover:bg-purple-100 disabled:opacity-20 flex items-center justify-center text-purple-700 active:scale-90 transition-all border border-purple-200"
                          aria-label="Mover para cima"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === orderedItems.length - 1}
                          onClick={() => handleMoveOrderItem(idx, 1)}
                          className="w-7 h-7 rounded-lg bg-purple-50 hover:bg-purple-100 disabled:opacity-20 flex items-center justify-center text-purple-700 active:scale-90 transition-all border border-purple-200"
                          aria-label="Mover para baixo"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* TIPOLOGIA 4: fill_in_the_blank (Completar a frase) */}
            {currentQ.typology === 'fill_in_the_blank' && (
              <div className="space-y-4 pt-1">
                {/* Frase com lacuna destacada */}
                <div className="bg-white p-4 rounded-2xl border-2 border-[#E8DEFB] border-b-4 border-b-[#D8C2FF] text-center font-nunito font-bold text-sm sm:text-base text-[#3B0764] leading-relaxed">
                  {((currentQ as any).sentence || '').split('___').map((part: string, i: number, arr: any[]) => (
                    <React.Fragment key={i}>
                      {part}
                      {i < arr.length - 1 && (
                        <span
                          className={`inline-block px-3 py-0.5 mx-1 font-nunito font-black rounded-xl border-b-2 transition-all ${
                            currentAnswer
                              ? 'bg-[#F6EEFF] text-[#7D2BD6] border-[#7D2BD6]'
                              : 'bg-purple-100 text-purple-400 border-purple-300'
                          }`}
                        >
                          {currentAnswer ? String(currentAnswer) : '______'}
                        </span>
                      )}
                    </React.Fragment>
                  ))}
                </div>

                {/* Opções de palavras */}
                <div className="grid grid-cols-2 gap-2.5">
                  {((currentQ as any).options || []).map((opt: string) => {
                    const isSelected = currentAnswer === opt
                    return (
                      <button
                        key={opt}
                        type="button"
                        disabled={isValidated}
                        onClick={() => selectAnswer(opt)}
                        className={`p-3 rounded-2xl border-2 border-b-4 font-nunito font-extrabold text-xs sm:text-sm transition-all text-center ${
                          isSelected
                            ? 'bg-[#F6EEFF] border-[#7D2BD6] border-b-[#5B21B6] text-[#7D2BD6]'
                            : 'bg-white border-[#E8DEFB] border-b-[#D8C2FF] text-[#432171] active:translate-y-[2px]'
                        }`}
                      >
                        {opt}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* TIPOLOGIA 5: concept_matching (Conectar pares) */}
            {currentQ.typology === 'concept_matching' && (
              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {/* Coluna da esquerda (Conceitos) */}
                  <div className="flex flex-col gap-2">
                    <span className="font-nunito font-bold text-[10px] text-gray-500 uppercase px-1">Conceito</span>
                    {((currentQ as any).pairs || []).map((pair: any) => {
                      const isMatched = Boolean(matchedPairs[pair.left])
                      const isSelected = selectedLeftConcept === pair.left
                      return (
                        <button
                          key={pair.left}
                          type="button"
                          disabled={isValidated || isMatched}
                          onClick={() => handleSelectLeft(pair.left)}
                          className={`p-2.5 rounded-xl border-2 border-b-3 font-nunito font-bold text-xs text-left transition-all flex items-center justify-between ${
                            isMatched
                              ? 'bg-[#DCFCE7] border-[#2FBF71] text-[#15803D]'
                              : isSelected
                              ? 'bg-[#F6EEFF] border-[#7D2BD6] text-[#7D2BD6]'
                              : 'bg-white border-[#E8DEFB] text-[#432171] active:scale-95'
                          }`}
                        >
                          <span className="truncate">{pair.left}</span>
                          {isMatched && <Check className="w-3.5 h-3.5 text-green-600 shrink-0" />}
                        </button>
                      )
                    })}
                  </div>

                  {/* Coluna da direita (Definições) */}
                  <div className="flex flex-col gap-2">
                    <span className="font-nunito font-bold text-[10px] text-gray-500 uppercase px-1">Exemplo</span>
                    {shuffledRights.map((rightText: string) => {
                      const matchedLeft = Object.keys(matchedPairs).find((k) => matchedPairs[k] === rightText)
                      const isMatched = Boolean(matchedLeft)
                      return (
                        <button
                          key={rightText}
                          type="button"
                          disabled={isValidated || isMatched || !selectedLeftConcept}
                          onClick={() => handleSelectRight(rightText)}
                          className={`p-2.5 rounded-xl border-2 border-b-3 font-nunito font-bold text-xs text-left transition-all flex items-center justify-between ${
                            isMatched
                              ? 'bg-[#DCFCE7] border-[#2FBF71] text-[#15803D]'
                              : selectedLeftConcept
                              ? 'bg-purple-50 border-purple-300 text-purple-900 active:scale-95 cursor-pointer'
                              : 'bg-white border-[#E8DEFB] text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          <span className="line-clamp-2">{rightText}</span>
                          {isMatched && <Check className="w-3.5 h-3.5 text-green-600 shrink-0" />}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
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
