// src/pages/LearnPage.tsx
// Tela Aprender (Desafio Piggy - Cabeçalho Fixo e Trilha sem Scroll Necessário)
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { AppShell } from '../components/AppShell'
import { BackgroundBlobs } from '../components/BackgroundBlobs'
import {
  StatChip,
  SectionBanner,
  LearnMap,
  TrackSelectorSheet,
  TrackSummary,
  LevelItem,
} from '../features/learn/components'
import { learnService, LearnStats } from '../features/learn/services/learnService'
import { toast } from 'sonner'

export const LearnPage: React.FC = () => {
  const { slug } = useParams<{ slug?: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [stats, setStats] = useState<LearnStats | null>(null)
  const [tracks, setTracks] = useState<TrackSummary[]>([])
  const [activeTrack, setActiveTrack] = useState<TrackSummary | null>(null)
  const [levels, setLevels] = useState<LevelItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isTrackSheetOpen, setIsTrackSheetOpen] = useState(false)

  // 1. Carregar estatísticas do usuário e trilhas reais
  useEffect(() => {
    let isMounted = true

    async function loadData() {
      setLoading(true)
      try {
        const userStats = await learnService.getStats()
        if (isMounted) setStats(userStats)

        const { data: contents } = await supabase
          .from('educational_contents')
          .select('*')
          .order('track_order', { ascending: true })
          .order('lesson_order', { ascending: true })

        const { data: progress } = user
          ? await supabase
              .from('educational_progress')
              .select('content_id')
              .eq('user_id', user.id)
          : { data: [] }

        const userCompletedIds = new Set(progress?.map((p) => p.content_id) || [])

        const trackMap: Record<string, TrackSummary & { lessons: any[] }> = {}
        contents?.forEach((lesson) => {
          if (!trackMap[lesson.track_slug]) {
            trackMap[lesson.track_slug] = {
              trackSlug: lesson.track_slug,
              trackTitle: lesson.track_title,
              trackDescription: lesson.track_description,
              trackOrder: lesson.track_order,
              progressPct: 0,
              lessons: [],
            }
          }
          trackMap[lesson.track_slug].lessons.push({
            ...lesson,
            isCompleted: userCompletedIds.has(lesson.id),
          })
        })

        const trackList = Object.values(trackMap).map((t) => {
          const completedCount = t.lessons.filter((l) => l.isCompleted).length
          const total = t.lessons.length
          const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0
          return {
            trackSlug: t.trackSlug,
            trackTitle: t.trackTitle,
            trackDescription: t.trackDescription,
            trackOrder: t.trackOrder,
            progressPct: pct,
            isCompleted: pct === 100,
            lessons: t.lessons,
          }
        })

        trackList.sort((a, b) => a.trackOrder - b.trackOrder)
        if (isMounted) setTracks(trackList)

        let current = slug ? trackList.find((t) => t.trackSlug === slug) : null
        if (!current) {
          current = trackList.find((t) => t.progressPct < 100) || trackList[0]
        }

        if (isMounted && current) {
          setActiveTrack(current)
          buildLevelNodes(current)
        }
      } catch (err) {
        console.error('Erro ao carregar dados do Aprender:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadData()
    return () => {
      isMounted = false
    }
  }, [slug, user])

  const buildLevelNodes = (track: any) => {
    const rawLessons = track.lessons || []
    const mapped: LevelItem[] = []

    let foundFirstIncomplete = false

    rawLessons.forEach((lesson: any, idx: number) => {
      const isCompleted = lesson.isCompleted
      const isCurrent = !isCompleted && !foundFirstIncomplete
      if (isCurrent) foundFirstIncomplete = true

      mapped.push({
        id: lesson.id,
        levelNumber: idx + 1,
        title: lesson.lesson_title,
        description: lesson.summary,
        lessonSlug: lesson.lesson_slug,
        isCompleted,
        isCurrent,
        isLocked: !isCompleted && !isCurrent,
      })

      if (idx === 1) {
        mapped.push({
          id: `chest-${track.trackSlug}`,
          levelNumber: idx + 1,
          title: 'Baú de Moedas',
          description: '+50 moedas para seu saldo!',
          lessonSlug: '',
          isChest: true,
          isCompleted: false,
          isCurrent: false,
          isLocked: !isCompleted,
        })
      }
    })

    const allCompleted = rawLessons.every((l: any) => l.isCompleted)
    mapped.push({
      id: `trophy-${track.trackSlug}`,
      levelNumber: rawLessons.length + 1,
      title: 'Troféu da Trilha',
      description: 'Conclua todos os níveis desta trilha.',
      lessonSlug: '',
      isTrophy: true,
      isCompleted: allCompleted,
      isCurrent: false,
      isLocked: !allCompleted,
    })

    setLevels(mapped)
  }

  const handleSelectTrack = (trackSlug: string) => {
    navigate(`/aprender/trilha/${trackSlug}`)
  }

  const handleSelectLevel = (level: LevelItem) => {
    if (!activeTrack) return
    navigate(`/aprender/trilha/${activeTrack.trackSlug}/nivel/${level.levelNumber}`)
  }

  const handleReadGuide = (level: LevelItem) => {
    if (!activeTrack) return
    navigate(`/aprender/trilha/${activeTrack.trackSlug}/nivel/${level.levelNumber}/guia`)
  }

  const handleClaimChest = async (level: LevelItem) => {
    if (!activeTrack) return
    try {
      const res = await learnService.claimChest(activeTrack.trackSlug, 1)
      toast.success('+50 Moedas Piggy resgatadas!', {
        description: `Saldo atual: ${res.total_coins} moedas.`,
      })
      const newStats = await learnService.getStats()
      setStats(newStats)
      setLevels((prev) =>
        prev.map((l) => (l.id === level.id ? { ...l, isChestClaimed: true } : l))
      )
    } catch {
      toast.error('Não foi possível resgatar o baú no momento.')
    }
  }

  const handleOpenStudyGuides = () => {
    setIsTrackSheetOpen(false)
    navigate('/aprender/guias')
  }

  // Cabeçalho fixo no topo com Chips + Banner compacto de 86px
  const fixedHeader = (
    <div className="w-full bg-bg/95 backdrop-blur-md px-4 pt-1.5 pb-2 border-b border-purple-100/40 flex flex-col gap-2 shrink-0">
      <div className="flex items-center justify-between gap-1.5">
        <StatChip
          variant="streak"
          value={stats?.streak_count || 1}
          onClick={() =>
            toast('Ofensiva Piggy', {
              description: `${stats?.streak_count || 1} dias seguidos aprendendo! Continue firme.`,
            })
          }
        />
        <StatChip
          variant="xp"
          value={stats?.xp_points || 0}
          onClick={() =>
            toast('Pontos de Experiência (XP)', {
              description: `${stats?.xp_points || 0} XP acumulados com suas lições.`,
            })
          }
        />
        <StatChip
          variant="coins"
          value={stats?.piggy_coins || 0}
          onClick={() =>
            toast('Moedas Piggy', {
              description: `${stats?.piggy_coins || 0} moedas para desbloquear cosméticos e escudos.`,
            })
          }
        />
        <StatChip
          variant="hearts"
          value={stats?.hearts ?? 3}
          onClick={() =>
            toast('Vidas', {
              description: 'Corações são renovados a cada dia de aprendizado.',
            })
          }
        />
      </div>

      {activeTrack && (
        <SectionBanner
          trackOrder={activeTrack.trackOrder}
          trackTitle={activeTrack.trackTitle}
          progressPct={activeTrack.progressPct}
          onOpenTrackSelector={() => setIsTrackSheetOpen(true)}
          onOpenGuide={() => {
            const firstLesson = levels[0]
            if (firstLesson) handleReadGuide(firstLesson)
          }}
        />
      )}
    </div>
  )

  return (
    <AppShell
      variant="app"
      header={fixedHeader}
      className="relative select-none flex flex-col justify-between overflow-x-hidden"
    >
      <BackgroundBlobs showSparkles={true} />

      {loading || !activeTrack ? (
        <div className="w-full py-8 space-y-6 animate-pulse min-w-0">
          <div className="flex flex-col items-center space-y-10 pt-6">
            <div className="w-16 h-16 rounded-full bg-purple-200/60" />
            <div className="w-16 h-16 rounded-full bg-purple-200/60 translate-x-10" />
            <div className="w-16 h-16 rounded-full bg-purple-200/60 -translate-x-10" />
          </div>
        </div>
      ) : (
        <div className="w-full min-w-0 flex-1 flex flex-col justify-center">
          <LearnMap
            trackSlug={activeTrack.trackSlug}
            levels={levels}
            onSelectLevel={handleSelectLevel}
            onReadGuide={handleReadGuide}
            onClaimChest={handleClaimChest}
          />
        </div>
      )}

      {/* Drawer de Troca de Trilhas (Mockup 10b) */}
      <TrackSelectorSheet
        isOpen={isTrackSheetOpen}
        onClose={() => setIsTrackSheetOpen(false)}
        tracks={tracks}
        activeTrackSlug={activeTrack?.trackSlug || ''}
        onSelectTrack={handleSelectTrack}
        onOpenStudyGuides={handleOpenStudyGuides}
      />
    </AppShell>
  )
}
export default LearnPage
