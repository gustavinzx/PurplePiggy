import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { AppShell } from '../components/AppShell'
import { Mascot } from '../components/Mascot'
import { Button } from '../components/Button'
import { LESSON_QUIZZES } from '../lib/quizData'
import {
  ArrowLeft,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Zap,
  HelpCircle,
  ThumbsUp,
} from 'lucide-react'
import { toast } from 'sonner'
import confetti from 'canvas-confetti'
import type { Database } from '../types/database.types'

type EducationalContent = Database['public']['Tables']['educational_contents']['Row']

export const LessonPage: React.FC = () => {
  const { trackSlug, lessonSlug } = useParams<{ trackSlug: string; lessonSlug: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [lesson, setLesson] = useState<EducationalContent | null>(null)
  const [allLessonsInTrack, setAllLessonsInTrack] = useState<EducationalContent[]>([])
  const [isCompleted, setIsCompleted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Duolingo Quiz State
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [isAnswerChecked, setIsAnswerChecked] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)

  useEffect(() => {
    if (user && lessonSlug) {
      loadLesson()
    }
  }, [user, lessonSlug])

  const loadLesson = async () => {
    if (!user) return
    setLoading(true)
    setSelectedOption(null)
    setIsAnswerChecked(false)
    setIsCorrect(false)

    try {
      // 1. Carregar lição atual
      const { data: currentLesson } = await supabase
        .from('educational_contents')
        .select('*')
        .eq('lesson_slug', lessonSlug!)
        .single()

      if (!currentLesson) {
        toast.error('Lição não encontrada.')
        navigate('/aprender')
        return
      }

      setLesson(currentLesson)

      // 2. Verificar se já concluiu
      const { data: progress } = await supabase
        .from('educational_progress')
        .select('id')
        .eq('user_id', user.id)
        .eq('content_id', currentLesson.id)
        .single()

      setIsCompleted(Boolean(progress))

      // 3. Carregar lições da mesma trilha
      const { data: trackLessons } = await supabase
        .from('educational_contents')
        .select('*')
        .eq('track_slug', currentLesson.track_slug)
        .order('lesson_order', { ascending: true })

      setAllLessonsInTrack(trackLessons || [])
    } finally {
      setLoading(false)
    }
  }

  const quiz = lessonSlug ? LESSON_QUIZZES[lessonSlug] : null

  const handleSelectOption = (idx: number) => {
    if (isAnswerChecked && isCorrect) return
    setSelectedOption(idx)
    setIsAnswerChecked(false)
  }

  const handleCheckAnswer = () => {
    if (selectedOption === null || !quiz) return
    const correct = selectedOption === quiz.correctIndex
    setIsAnswerChecked(true)
    setIsCorrect(correct)

    if (correct) {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } })
      toast.success('Mandou super bem! Resposta correta! 🎉 (+10 XP)')
    } else {
      toast.info('Quase lá! Veja a explicação e tente novamente com calma.')
    }
  }

  const handleCompleteLesson = async () => {
    if (!user || !lesson) return
    setSaving(true)

    try {
      const { error } = await supabase
        .from('educational_progress')
        .upsert(
          {
            user_id: user.id,
            content_id: lesson.id,
          },
          { onConflict: 'user_id,content_id' }
        )

      if (error) throw error

      setIsCompleted(true)
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } })
      toast.success('Parabéns! Lição concluída e XP acumulado! 🏆💜')

      // Atualizar streak local
      const today = new Date().toISOString().split('T')[0]
      const stored = localStorage.getItem('purplepiggy_streak')
      let streak = 1
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          if (parsed.lastDate !== today) {
            streak = (parsed.count || 0) + 1
          } else {
            streak = parsed.count || 1
          }
        } catch (_) {}
      }
      localStorage.setItem('purplepiggy_streak', JSON.stringify({ count: streak, lastDate: today }))
    } catch (err) {
      toast.error('Não conseguimos registrar seu progresso agora.')
    } finally {
      setSaving(false)
    }
  }

  const handleNextLesson = () => {
    if (!lesson) return
    const currentIndex = allLessonsInTrack.findIndex((l) => l.id === lesson.id)
    if (currentIndex >= 0 && currentIndex < allLessonsInTrack.length - 1) {
      const next = allLessonsInTrack[currentIndex + 1]
      navigate(`/aprender/${next.track_slug}/${next.lesson_slug}`)
    } else {
      toast.success('Você concluiu todas as lições desta trilha! Parabéns! 🏆')
      navigate('/aprender')
    }
  }

  if (loading || !lesson) {
    return (
      <AppShell showNav={false} className="px-5 py-6 justify-center items-center">
        <p className="text-sm font-bold text-deep animate-pulse">Carregando conhecimento...</p>
      </AppShell>
    )
  }

  const currentIndex = allLessonsInTrack.findIndex((l) => l.id === lesson.id)
  const hasNext = currentIndex >= 0 && currentIndex < allLessonsInTrack.length - 1

  return (
    <AppShell showNav={false} className="px-5 py-6 flex flex-col justify-between bg-white relative">
      <div>
        {/* Header com botão voltar */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate('/aprender')}
            className="p-2 -ml-2 rounded-full hover:bg-lilac/10 text-deep transition-colors"
            aria-label="Voltar para aprender"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>

          <span className="text-[11px] font-extrabold text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-wider">
            EDUCAÇÃO FINANCEIRA · {lesson.minutes} MIN
          </span>
        </div>

        {/* Título e Subtítulo (fiel ao layout oficial) */}
        <div className="mb-4">
          <h1 className="text-2xl font-extrabold text-deep font-sans leading-tight mb-1">
            {lesson.lesson_title}
          </h1>
          <p className="text-xs font-semibold text-textSec">
            {lesson.summary}
          </p>
        </div>

        {/* Ilustração da mascote com lâmpada compositada ao redor */}
        <div className="flex justify-center my-4">
          <Mascot size="lg" accessory="idea" />
        </div>

        {/* Card de Conteúdo Principal (Layout oficial) */}
        <div className="bg-bg rounded-[22px] p-5 border border-lilac/15 text-xs text-deep/90 font-medium leading-relaxed flex flex-col gap-3 mb-4">
          {lesson.body_md.split('\n\n').map((paragraph, idx) => (
            <p key={idx}>{paragraph}</p>
          ))}
        </div>

        {/* Exemplo Prático Numérico */}
        {lesson.example_md && (
          <div className="bg-baby/50 rounded-[20px] p-4 border border-blue-100 mb-4 text-xs">
            <span className="font-extrabold text-deep block mb-1">💡 Exemplo prático:</span>
            <p className="font-semibold text-deep/80 leading-relaxed">
              {lesson.example_md}
            </p>
          </div>
        )}

        {/* Dica da Mascote */}
        {lesson.tip && (
          <div className="bg-gold/20 rounded-[20px] p-4 border border-gold/40 mb-4 text-xs">
            <span className="font-extrabold text-deep block mb-1">✨ Dica amiga:</span>
            <p className="font-semibold text-deep/90 leading-relaxed">
              {lesson.tip}
            </p>
          </div>
        )}

        {/* ATIVIDADE ESTILO DUOLINGO: Desafio da Lição */}
        {quiz && (
          <div className="bg-white rounded-[22px] p-5 border-2 border-primary/25 shadow-card mb-4 animate-fadeIn">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-extrabold text-primary flex items-center gap-1.5 uppercase tracking-wide">
                <Zap className="w-4 h-4 text-gold fill-gold" />
                Desafio Duolingo · Teste rápido
              </span>
              <span className="text-[11px] font-bold text-textSec bg-bg px-2.5 py-0.5 rounded-full">
                +10 XP
              </span>
            </div>

            <h3 className="text-sm font-extrabold text-deep mb-3.5 leading-snug">
              {quiz.question}
            </h3>

            {/* Opções de Resposta Interativas */}
            <div className="flex flex-col gap-2.5 mb-3.5">
              {quiz.options.map((opt, idx) => {
                const isSelected = selectedOption === idx
                let btnStyle = 'border-lilac/30 bg-bg text-deep hover:border-primary/50'

                if (isAnswerChecked) {
                  if (idx === quiz.correctIndex) {
                    btnStyle = 'border-success bg-success/15 text-success font-extrabold'
                  } else if (isSelected) {
                    btnStyle = 'border-danger bg-danger/10 text-danger'
                  }
                } else if (isSelected) {
                  btnStyle = 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectOption(idx)}
                    className={`w-full text-left p-3.5 rounded-2xl border-2 text-xs font-semibold transition-all flex items-center justify-between ${btnStyle}`}
                  >
                    <span className="flex-1 pr-2">{opt}</span>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        isSelected ? 'border-primary bg-primary text-white' : 'border-lilac/40'
                      }`}
                    >
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Botão de checar ou Feedback */}
            {!isAnswerChecked ? (
              <Button
                size="md"
                fullWidth
                variant="primary"
                disabled={selectedOption === null}
                onClick={handleCheckAnswer}
              >
                Verificar resposta
              </Button>
            ) : (
              <div
                className={`p-3 rounded-xl text-xs font-semibold ${
                  isCorrect
                    ? 'bg-success/15 text-emerald-800 border border-success/30'
                    : 'bg-gold/25 text-amber-900 border border-gold/50'
                }`}
              >
                <div className="font-extrabold mb-1">
                  {isCorrect ? '🎉 Parabéns! Você acertou!' : '💡 Dica da PurplePiggy:'}
                </div>
                <p>{quiz.explanation}</p>
                {!isCorrect && (
                  <button
                    onClick={() => {
                      setIsAnswerChecked(false)
                      setSelectedOption(null)
                    }}
                    className="text-xs font-bold text-primary underline mt-2 block"
                  >
                    Tentar responder novamente
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Ações inferiores (Layout oficial) */}
      <div className="flex flex-col gap-3 pt-2 pb-4">
        <Button
          size="lg"
          fullWidth
          variant={isCompleted ? 'secondary' : 'primary'}
          loading={saving}
          onClick={handleCompleteLesson}
          icon={isCompleted ? <CheckCircle2 className="w-5 h-5" /> : undefined}
        >
          {isCompleted ? 'Lição concluída ✓' : 'Concluir lição ✓'}
        </Button>

        {hasNext ? (
          <Button
            size="lg"
            variant="outline"
            fullWidth
            onClick={handleNextLesson}
            icon={<ArrowRight className="w-5 h-5" />}
          >
            Próxima lição →
          </Button>
        ) : (
          <Button
            size="lg"
            variant="ghost"
            fullWidth
            onClick={() => navigate('/aprender')}
          >
            Voltar para as trilhas
          </Button>
        )}
      </div>
    </AppShell>
  )
}
