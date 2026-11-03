import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { AppShell } from '../components/AppShell'
import { Mascot } from '../components/Mascot'
import { Button } from '../components/Button'
import { DAILY_CHALLENGES } from '../lib/quizData'
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight,
  GraduationCap,
  Flame,
  Zap,
  X,
  Award,
  HelpCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import confetti from 'canvas-confetti'
import type { Database } from '../types/database.types'

type EducationalContent = Database['public']['Tables']['educational_contents']['Row']

interface TrackGroup {
  track_slug: string
  track_title: string
  track_description: string
  track_order: number
  lessons: EducationalContent[]
  completedCount: number
  progressPct: number
  completedIds: Set<string>
}

export const LearnPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [tracks, setTracks] = useState<TrackGroup[]>([])
  const [loading, setLoading] = useState(true)

  // Ofensiva Piggy & Desafio do Dia
  const [streakDays, setStreakDays] = useState(1)
  const [isDailyChallengeOpen, setIsDailyChallengeOpen] = useState(false)
  const [dailyCompleted, setDailyCompleted] = useState(false)
  const [selectedDailyOption, setSelectedDailyOption] = useState<number | null>(null)
  const [dailyChecked, setDailyChecked] = useState(false)
  const [dailyCorrect, setDailyCorrect] = useState(false)

  // Desafio do dia baseado no dia da semana
  const dayIndex = new Date().getDay() % DAILY_CHALLENGES.length
  const todayChallenge = DAILY_CHALLENGES[dayIndex]

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    const stored = localStorage.getItem('purplepiggy_streak')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setStreakDays(parsed.count || 1)
        if (parsed.lastDate === today) {
          setDailyCompleted(true)
        }
      } catch (_) {}
    }
  }, [])

  useEffect(() => {
    if (user) {
      loadEducationalData()
    }
  }, [user])

  const loadEducationalData = async () => {
    if (!user) return
    setLoading(true)
    try {
      // 1. Todas as lições ordenadas por trilha e ordem da lição
      const { data: contents } = await supabase
        .from('educational_contents')
        .select('*')
        .order('track_order', { ascending: true })
        .order('lesson_order', { ascending: true })

      // 2. Progresso do usuário autenticado no Supabase
      const { data: progress } = await supabase
        .from('educational_progress')
        .select('content_id')
        .eq('user_id', user.id)

      const userCompletedIds = new Set(progress?.map((p) => p.content_id) || [])

      // Agrupar por trilha
      const trackMap: Record<string, TrackGroup> = {}

      contents?.forEach((lesson) => {
        if (!trackMap[lesson.track_slug]) {
          trackMap[lesson.track_slug] = {
            track_slug: lesson.track_slug,
            track_title: lesson.track_title,
            track_description: lesson.track_description,
            track_order: lesson.track_order,
            lessons: [],
            completedCount: 0,
            progressPct: 0,
            completedIds: userCompletedIds,
          }
        }
        trackMap[lesson.track_slug].lessons.push(lesson)
        if (userCompletedIds.has(lesson.id)) {
          trackMap[lesson.track_slug].completedCount++
        }
      })

      const list = Object.values(trackMap).map((t) => ({
        ...t,
        progressPct:
          t.lessons.length > 0 ? Math.round((t.completedCount / t.lessons.length) * 100) : 0,
      }))

      list.sort((a, b) => a.track_order - b.track_order)
      setTracks(list)
    } finally {
      setLoading(false)
    }
  }

  // Navegar estritamente para a primeira lição NÃO concluída da trilha
  const openTrack = (track: TrackGroup) => {
    // Procura a primeira lição cujo ID não está nas concluídas
    const nextIncompleteLesson = track.lessons.find((l) => !track.completedIds.has(l.id))
    // Se todas estiverem concluídas, abre a primeira para revisar
    const targetLesson = nextIncompleteLesson || track.lessons[0]

    if (targetLesson) {
      navigate(`/aprender/${track.track_slug}/${targetLesson.lesson_slug}`)
    }
  }

  const handleCheckDaily = () => {
    if (selectedDailyOption === null) return
    const correct = selectedDailyOption === todayChallenge.correctIndex
    setDailyChecked(true)
    setDailyCorrect(correct)

    if (correct) {
      confetti({
        particleCount: 35,
        spread: 50,
        origin: { y: 0.65 },
        colors: ['#B037F8', '#FF79A8', '#FEDA70'],
      })
      const today = new Date().toISOString().split('T')[0]
      const newStreak = streakDays + (dailyCompleted ? 0 : 1)
      setStreakDays(newStreak)
      setDailyCompleted(true)
      localStorage.setItem('purplepiggy_streak', JSON.stringify({ count: newStreak, lastDate: today }))
      toast.success('Desafio do dia concluído! 🔥 Ofensiva mantida com sucesso!')
    }
  }

  return (
    <AppShell showNav={true} className="px-5 py-6 flex flex-col gap-4">
      {/* Header com mascote de capelo (Fiel ao layout oficial) */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-deep font-sans mb-1">
            Aprenda no seu ritmo
          </h1>
          <p className="text-xs font-semibold text-textSec">
            Conhecimento financeiro para a vida real.
          </p>
        </div>
        <div className="shrink-0 -mr-1">
          <Mascot size="sm" pose="graduate" />
        </div>
      </div>

      {/* Banner da Ofensiva Piggy e Desafio do Dia */}
      <div className="bg-gradient-to-r from-primary/10 via-lilac/15 to-gold/20 border border-primary/20 rounded-2xl p-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white shadow-xs flex items-center justify-center text-amber-500">
            <Flame className="w-6 h-6 fill-amber-500 text-amber-500 animate-bounce" />
          </div>
          <div>
            <div className="text-xs font-extrabold text-deep flex items-center gap-1.5">
              <span>{streakDays} {streakDays === 1 ? 'dia' : 'dias'} de Ofensiva Piggy</span>
            </div>
            <div className="text-[11px] font-semibold text-textSec">
              {dailyCompleted ? 'Desafio de hoje concluído ✓' : 'Desafio Piggy do dia disponível'}
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsDailyChallengeOpen(true)}
          className={`text-xs font-extrabold px-3 py-1.5 rounded-full shadow-xs transition-all ${
            dailyCompleted
              ? 'bg-success/20 text-emerald-800'
              : 'bg-primary text-white hover:brightness-105 active:scale-95'
          }`}
        >
          {dailyCompleted ? 'Revisar' : 'Fazer desafio'}
        </button>
      </div>

      {/* Lista de Trilhas do Layout Oficial */}
      <div className="flex flex-col gap-4">
        {tracks.map((track, idx) => {
          const trackNumber = String(idx + 1).padStart(2, '0')
          const isStarted = track.progressPct > 0
          const isFinished = track.progressPct === 100

          return (
            <div
              key={track.track_slug}
              className="bg-white rounded-[22px] p-5 border border-lilac/15 shadow-card flex flex-col gap-3"
            >
              <div>
                <span className="text-[10px] font-extrabold text-primary tracking-wider uppercase">
                  TRILHA {trackNumber}
                </span>
                <h2 className="text-base font-extrabold text-deep font-sans leading-tight mt-0.5">
                  {track.track_title}
                </h2>
                <p className="text-xs font-semibold text-textSec mt-1">
                  {track.track_description}
                </p>
              </div>

              {/* Barra de progresso se iniciada */}
              {isStarted && (
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-bg rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-lilac rounded-full transition-all duration-700"
                      style={{ width: `${track.progressPct}%` }}
                    />
                  </div>
                  <span className="text-xs font-extrabold text-primary">
                    {track.progressPct}%
                  </span>
                </div>
              )}

              {/* Botão de Ação */}
              <div className="pt-1">
                <Button
                  size="md"
                  fullWidth
                  variant={isStarted ? 'primary' : 'outline'}
                  onClick={() => openTrack(track)}
                >
                  {isFinished
                    ? 'Revisar trilha'
                    : isStarted
                    ? 'Continuar trilha'
                    : 'Começar a aprender'}
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal Interativo: Desafio Piggy do Dia */}
      {isDailyChallengeOpen && (
        <div className="fixed inset-0 z-50 bg-deep/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-white rounded-[26px] p-6 w-full max-w-sm shadow-2xl flex flex-col relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-lilac/15 mb-3">
              <div className="flex items-center gap-2 text-primary font-extrabold text-sm">
                <Zap className="w-4 h-4 text-gold fill-gold" />
                <span>Desafio Piggy do Dia</span>
              </div>
              <button
                onClick={() => setIsDailyChallengeOpen(false)}
                className="p-1 rounded-full text-textSec hover:text-deep"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-[11px] font-bold text-textSec uppercase tracking-wider mb-1">
              {todayChallenge.day}
            </div>

            <h3 className="text-sm font-extrabold text-deep mb-4 leading-snug">
              {todayChallenge.question}
            </h3>

            <div className="flex flex-col gap-2.5 mb-4">
              {todayChallenge.options.map((opt, idx) => {
                const isSelected = selectedDailyOption === idx
                let btnStyle = 'border-lilac/30 bg-bg text-deep hover:border-primary/50'

                if (dailyChecked) {
                  if (idx === todayChallenge.correctIndex) {
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
                    onClick={() => {
                      if (!dailyChecked || !dailyCorrect) {
                        setSelectedDailyOption(idx)
                        setDailyChecked(false)
                      }
                    }}
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

            {!dailyChecked ? (
              <Button
                size="md"
                fullWidth
                disabled={selectedDailyOption === null}
                onClick={handleCheckDaily}
              >
                Confirmar resposta
              </Button>
            ) : (
              <div
                className={`p-3.5 rounded-2xl text-xs font-semibold flex flex-col gap-2.5 items-center text-center ${
                  dailyCorrect
                    ? 'bg-success/15 text-emerald-900 border border-success/30'
                    : 'bg-gold/25 text-amber-950 border border-gold/50'
                }`}
              >
                <Mascot size="md" pose={dailyCorrect ? 'medal' : 'retry'} floating={true} />
                <div className="font-extrabold flex items-center justify-center gap-1.5">
                  {dailyCorrect ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-success" />
                      <span>Parabéns! Ofensiva mantida com sucesso!</span>
                    </>
                  ) : (
                    <>
                      <HelpCircle className="w-4 h-4 text-amber-600" />
                      <span>Dica da PurplePiggy:</span>
                    </>
                  )}
                </div>
                <p className="leading-relaxed text-deep/80">{todayChallenge.explanation}</p>
                <Button
                  size="sm"
                  fullWidth
                  variant={dailyCorrect ? 'primary' : 'outline'}
                  onClick={() => setIsDailyChallengeOpen(false)}
                >
                  Continuar
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </AppShell>
  )
}
