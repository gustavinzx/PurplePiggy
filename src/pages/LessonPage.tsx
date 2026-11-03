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
  Award,
  BookOpen,
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
  const [trackLessons, setTrackLessons] = useState<EducationalContent[]>([])
  const [allTracks, setAllTracks] = useState<{ track_slug: string; track_order: number; track_title: string }[]>([])
  const [isCompleted, setIsCompleted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Desafio Piggy State
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [isAnswerChecked, setIsAnswerChecked] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [hasFiredConfetti, setHasFiredConfetti] = useState(false)

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
    setHasFiredConfetti(false)

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

      // 2. Verificar se a usuária já concluiu esta lição no Supabase
      const { data: progress } = await supabase
        .from('educational_progress')
        .select('id')
        .eq('user_id', user.id)
        .eq('content_id', currentLesson.id)
        .maybeSingle()

      const alreadyDone = Boolean(progress)
      setIsCompleted(alreadyDone)

      // Se já estava concluída, marca o quiz como acertado
      if (alreadyDone) {
        setIsAnswerChecked(true)
        setIsCorrect(true)
        const q = LESSON_QUIZZES[lessonSlug!]
        if (q) setSelectedOption(q.correctIndex)
      }

      // 3. Carregar TODAS as lições da mesma trilha (ordenadas por lesson_order)
      const { data: sameTrackLessons } = await supabase
        .from('educational_contents')
        .select('*')
        .eq('track_slug', currentLesson.track_slug)
        .order('lesson_order', { ascending: true })

      setTrackLessons(sameTrackLessons || [])

      // 4. Carregar lista de trilhas para permitir transição entre trilhas
      const { data: allContents } = await supabase
        .from('educational_contents')
        .select('track_slug, track_order, track_title')
        .order('track_order', { ascending: true })

      if (allContents) {
        const uniqueTracks: Record<string, { track_slug: string; track_order: number; track_title: string }> = {}
        allContents.forEach((c) => {
          if (!uniqueTracks[c.track_slug]) {
            uniqueTracks[c.track_slug] = {
              track_slug: c.track_slug,
              track_order: c.track_order,
              track_title: c.track_title,
            }
          }
        })
        setAllTracks(Object.values(uniqueTracks).sort((a, b) => a.track_order - b.track_order))
      }
    } finally {
      setLoading(false)
    }
  }

  const quiz = lessonSlug ? LESSON_QUIZZES[lessonSlug] : null

  const handleSelectOption = (idx: number) => {
    if (isCompleted) return
    setSelectedOption(idx)
    setIsAnswerChecked(false)
  }

  // Verifica a resposta e grava o progresso se acertou
  const handleCheckAnswer = async () => {
    if (selectedOption === null || !quiz || !user || !lesson) return

    const correct = selectedOption === quiz.correctIndex
    setIsAnswerChecked(true)
    setIsCorrect(correct)

    if (correct) {
      if (!hasFiredConfetti && !isCompleted) {
        setHasFiredConfetti(true)
        confetti({
          particleCount: 35,
          spread: 45,
          origin: { y: 0.65 },
          colors: ['#B037F8', '#FF79A8', '#FEDA70'],
        })
      }

      // Salvar progresso no Supabase
      setSaving(true)
      try {
        await supabase
          .from('educational_progress')
          .upsert(
            {
              user_id: user.id,
              content_id: lesson.id,
            },
            { onConflict: 'user_id,content_id' }
          )

        setIsCompleted(true)

        // Atualizar streak diário e PiggyXP
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
        toast.success('Resposta certa! Lição concluída e +10 PiggyXP! 💜')
      } catch (err) {
        console.error('Erro ao salvar progresso:', err)
      } finally {
        setSaving(false)
      }
    } else {
      toast.info('Quase lá! Veja a explicação e tente novamente com calma.')
    }
  }

  // Navegação estrita e coerente para a próxima lição dentro da trilha
  const currentIndex = trackLessons.findIndex((l) => l.id === lesson?.id)
  const nextLessonInSameTrack =
    currentIndex >= 0 && currentIndex < trackLessons.length - 1
      ? trackLessons[currentIndex + 1]
      : null

  // Encontrar a próxima trilha caso esta seja a última lição da trilha atual
  const currentTrackOrder = lesson?.track_order ?? 1
  const nextTrack = allTracks.find((t) => t.track_order === currentTrackOrder + 1)

  const handleNextStep = async () => {
    if (nextLessonInSameTrack) {
      // Avança para a próxima lição DA MESMA TRILHA
      navigate(`/aprender/${lesson!.track_slug}/${nextLessonInSameTrack.lesson_slug}`)
    } else if (nextTrack) {
      // Busca a primeira lição da próxima trilha
      const { data: firstLessonOfNextTrack } = await supabase
        .from('educational_contents')
        .select('lesson_slug')
        .eq('track_slug', nextTrack.track_slug)
        .order('lesson_order', { ascending: true })
        .limit(1)
        .single()

      if (firstLessonOfNextTrack) {
        toast.success(`Trilha concluída! Iniciando: ${nextTrack.track_title} 🎓`)
        navigate(`/aprender/${nextTrack.track_slug}/${firstLessonOfNextTrack.lesson_slug}`)
      } else {
        navigate('/aprender')
      }
    } else {
      toast.success('Você concluiu todas as trilhas disponíveis do PurplePiggy! Parabéns! 🏆')
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

  return (
    <AppShell showNav={false} className="px-5 py-6 flex flex-col justify-between bg-white relative">
      <div>
        {/* Header com botão voltar e badge da trilha (Fiel ao Layout) */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => navigate('/aprender')}
            className="p-2 -ml-2 rounded-full hover:bg-lilac/10 text-deep transition-colors"
            aria-label="Voltar para aprender"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold text-textSec bg-bg px-2.5 py-1 rounded-full uppercase tracking-wider">
              {lesson.track_title} · {currentIndex + 1}/{trackLessons.length}
            </span>
            <span className="text-[10px] font-extrabold text-primary bg-primary/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
              {lesson.minutes} MIN
            </span>
          </div>
        </div>

        {/* Título e Subtítulo (Fiel ao Layout Oficial) */}
        <div className="mb-4">
          <h1 className="text-2xl font-extrabold text-deep font-sans leading-tight mb-1">
            {lesson.lesson_title}
          </h1>
          <p className="text-xs font-semibold text-textSec leading-relaxed">
            {lesson.summary}
          </p>
        </div>

        {/* Mascote Oficial com a lâmpada amarela de ideias */}
        <div className="flex justify-center my-3">
          <Mascot size="lg" pose="idea" floating={true} />
        </div>

        {/* Card de Conteúdo Principal (Layout do App) */}
        <div className="bg-bg rounded-[22px] p-5 border border-lilac/15 text-xs text-deep/90 font-medium leading-relaxed flex flex-col gap-3 mb-4 shadow-xs">
          {lesson.body_md.split('\n\n').map((paragraph, idx) => (
            <p key={idx}>{paragraph}</p>
          ))}
        </div>

        {/* Exemplo Prático */}
        {lesson.example_md && (
          <div className="bg-baby/50 rounded-[20px] p-4 border border-blue-100 mb-4 text-xs shadow-xs">
            <span className="font-extrabold text-deep block mb-1">💡 Exemplo prático:</span>
            <p className="font-semibold text-deep/80 leading-relaxed">
              {lesson.example_md}
            </p>
          </div>
        )}

        {/* Dica Amiga da Mascote */}
        {lesson.tip && (
          <div className="bg-gold/20 rounded-[20px] p-4 border border-gold/40 mb-5 text-xs shadow-xs">
            <span className="font-extrabold text-deep block mb-1">✨ Dica amiga:</span>
            <p className="font-semibold text-deep/90 leading-relaxed">
              {lesson.tip}
            </p>
          </div>
        )}

        {/* SEÇÃO INTERATIVA: Desafio Piggy (Completamente gamificado e sem bugs) */}
        {quiz && (
          <div className="bg-white rounded-[22px] p-5 border-2 border-primary/20 shadow-card mb-5 animate-fadeIn">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-extrabold text-primary flex items-center gap-1.5 uppercase tracking-wide">
                <Zap className="w-4 h-4 text-gold fill-gold" />
                Desafio Piggy · Teste rápido
              </span>
              <span className="text-[11px] font-bold text-deep/70 bg-bg px-2.5 py-0.5 rounded-full border border-lilac/15">
                +10 PiggyXP
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
                    btnStyle = 'border-success bg-success/15 text-emerald-800 font-extrabold'
                  } else if (isSelected) {
                    btnStyle = 'border-danger/60 bg-danger/10 text-danger'
                  }
                } else if (isSelected) {
                  btnStyle = 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectOption(idx)}
                    className={`w-full text-left p-3.5 rounded-2xl border-2 text-xs font-semibold transition-all flex items-center justify-between active:scale-[0.99] ${btnStyle}`}
                  >
                    <span className="flex-1 pr-2 leading-relaxed">{opt}</span>
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

            {/* Ações e Feedback da Resposta */}
            {!isAnswerChecked ? (
              <Button
                size="md"
                fullWidth
                disabled={selectedOption === null}
                onClick={handleCheckAnswer}
                loading={saving}
              >
                Confirmar resposta
              </Button>
            ) : (
              <div
                className={`p-4 rounded-2xl text-xs font-semibold flex flex-col gap-2.5 items-center text-center ${
                  isCorrect
                    ? 'bg-success/15 text-emerald-900 border border-success/30'
                    : 'bg-gold/25 text-amber-950 border border-gold/50'
                }`}
              >
                <Mascot size="md" pose={isCorrect ? 'diploma' : 'retry'} floating={true} />
                <div className="font-extrabold flex items-center justify-center gap-1.5">
                  {isCorrect ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-success" />
                      <span>Parabéns! Você dominou o conceito!</span>
                    </>
                  ) : (
                    <>
                      <HelpCircle className="w-4 h-4 text-amber-600" />
                      <span>Dica da PurplePiggy:</span>
                    </>
                  )}
                </div>
                <p className="leading-relaxed text-deep/80">{quiz.explanation}</p>
                {!isCorrect && (
                  <button
                    onClick={() => {
                      setIsAnswerChecked(false)
                      setSelectedOption(null)
                    }}
                    className="text-xs font-bold text-primary underline mt-1 self-start"
                  >
                    Tentar responder novamente
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Ações Inferiores (Fiel ao Layout Oficial) */}
      <div className="flex flex-col gap-2.5 pt-2 pb-4">
        {/* Botão de Concluir ou Avançar */}
        {isCompleted ? (
          <Button
            size="lg"
            fullWidth
            onClick={handleNextStep}
            icon={<ArrowRight className="w-5 h-5" />}
          >
            {nextLessonInSameTrack
              ? 'Próxima lição da trilha →'
              : nextTrack
              ? `Concluir trilha e ir para ${nextTrack.track_title} →`
              : 'Concluir trilha 🏆'}
          </Button>
        ) : (
          <Button
            size="lg"
            fullWidth
            loading={saving}
            disabled={!isCorrect}
            onClick={handleCheckAnswer}
            icon={<CheckCircle2 className="w-5 h-5" />}
          >
            {isCorrect ? 'Concluir lição ✓' : 'Acerte o desafio para concluir'}
          </Button>
        )}

        {/* Botão de Navegação secundária */}
        <Button
          size="md"
          variant="outline"
          fullWidth
          onClick={() => navigate('/aprender')}
        >
          Voltar para as trilhas
        </Button>
      </div>
    </AppShell>
  )
}
