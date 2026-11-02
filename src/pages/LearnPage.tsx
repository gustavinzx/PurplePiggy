import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { AppShell } from '../components/AppShell'
import { Mascot } from '../components/Mascot'
import { Button } from '../components/Button'
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight,
  GraduationCap,
} from 'lucide-react'
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
}

export const LearnPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [tracks, setTracks] = useState<TrackGroup[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadEducationalData()
    }
  }, [user])

  const loadEducationalData = async () => {
    if (!user) return
    setLoading(true)
    try {
      // 1. Todas as lições
      const { data: contents } = await supabase
        .from('educational_contents')
        .select('*')
        .order('track_order', { ascending: true })
        .order('lesson_order', { ascending: true })

      // 2. Progresso do usuário
      const { data: progress } = await supabase
        .from('educational_progress')
        .select('content_id')
        .eq('user_id', user.id)

      const completedIds = new Set(progress?.map((p) => p.content_id) || [])

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
          }
        }
        trackMap[lesson.track_slug].lessons.push(lesson)
        if (completedIds.has(lesson.id)) {
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

  const openFirstIncompleteLesson = (track: TrackGroup) => {
    const firstIncomplete = track.lessons.find((l) => track.progressPct < 100) || track.lessons[0]
    if (firstIncomplete) {
      navigate(`/aprender/${track.track_slug}/${firstIncomplete.lesson_slug}`)
    }
  }

  return (
    <AppShell showNav={true} className="px-5 py-6 flex flex-col gap-4">
      {/* Header com mascote de capelo */}
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
          <Mascot size="sm" accessory="graduate" />
        </div>
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
                  onClick={() => openFirstIncompleteLesson(track)}
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
    </AppShell>
  )
}
