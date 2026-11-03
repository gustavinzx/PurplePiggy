// src/pages/LearnPage.tsx
// Tela Aprender (Desafio Piggy - Prompt N9B com Linha 2)
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { AppShell } from '../components/AppShell'
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
        // Obter estatísticas gamificadas reais
        const userStats = await learnService.getStats()
        if (isMounted) setStats(userStats)

        // Obter todas as lições cadastradas agrupadas por trilha
        const { data: contents } = await supabase
          .from('educational_contents')
          .select('*')
          .order('track_order', { ascending: true })
          .order('lesson_order', { ascending: true })

        // Obter progresso do usuário no Supabase
        const { data: progress } = user
          ? await supabase
              .from('educational_progress')
              .select('content_id')
              .eq('user_id', user.id)
          : { data: [] }

        const userCompletedIds = new Set(progress?.map((p) => p.content_id) || [])

        // Agrupar trilhas
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

        // Resolver qual trilha exibir:
        // 1. slug da URL se fornecido (/aprender/trilha/:slug)
        // 2. primeira trilha com nível não concluído
        // 3. fallback para trilha 1
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

  // Monta a estrutura dos nós de nível para o mapa em zigue-zague
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

      // Inserir nó de Baú de Moedas após o nível 2
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

    // Troféu final no topo da trilha
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

  // Ação ao selecionar uma trilha no Drawer
  const handleSelectTrack = (trackSlug: string) => {
    navigate(`/aprender/trilha/${trackSlug}`)
  }

  // Ação ao selecionar um nível (iniciar lição)
  const handleSelectLevel = (level: LevelItem) => {
    if (!activeTrack) return
    navigate(`/aprender/trilha/${activeTrack.trackSlug}/nivel/${level.levelNumber}`)
  }

  // Ação ao clicar em "Ler Guia do Nível"
  const handleReadGuide = (level: LevelItem) => {
    if (!activeTrack) return
    navigate(`/aprender/trilha/${activeTrack.trackSlug}/nivel/${level.levelNumber}/guia`)
  }

  // Ação ao clicar em abrir baú de moedas
  const handleClaimChest = async (level: LevelItem) => {
    if (!activeTrack) return
    try {
      const res = await learnService.claimChest(activeTrack.trackSlug, 1)
      toast.success('+50 Moedas Piggy resgatadas!', {
        description: `Saldo atual: ${res.total_coins} moedas.`,
      })
      // Atualiza stats e mapa
      const newStats = await learnService.getStats()
      setStats(newStats)
      setLevels((prev) =>
        prev.map((l) => (l.id === level.id ? { ...l, isChestClaimed: true } : l))
      )
    } catch {
      toast.error('Não foi possível resgatar o baú no momento.')
    }
  }

  // Ação ao clicar em "Guias de estudo"
  const handleOpenStudyGuides = () => {
    setIsTrackSheetOpen(false)
    navigate('/aprender/guias')
  }

  return (
    <AppShell
      className="bg-gradient-to-b from-[#FBF8FF] via-[#F6EEFF] to-[#EDE4F8] min-h-screen pb-24"
    >
      <div className="max-w-md mx-auto px-4 pt-3">
        {/* Top Bar Fixa de Status com Chips */}
        <header className="sticky top-0 z-30 pt-2 pb-3 backdrop-blur-md bg-white/75 -mx-4 px-4 border-b border-purple-100/50 flex items-center justify-between gap-1.5 shadow-sm">
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
        </header>

        {/* Skeleton de carregamento */}
        {loading || !activeTrack ? (
          <div className="py-8 space-y-6 animate-pulse">
            <div className="h-28 bg-purple-200/50 rounded-3xl w-full" />
            <div className="flex flex-col items-center space-y-10 pt-6">
              <div className="w-18 h-18 rounded-full bg-purple-200/60" />
              <div className="w-18 h-18 rounded-full bg-purple-200/60 translate-x-12" />
              <div className="w-18 h-18 rounded-full bg-purple-200/60 -translate-x-12" />
            </div>
          </div>
        ) : (
          <main className="pt-4">
            {/* Banner da Trilha Atual */}
            <SectionBanner
              trackOrder={activeTrack.trackOrder}
              trackTitle={activeTrack.trackTitle}
              trackDescription={activeTrack.trackDescription}
              progressPct={activeTrack.progressPct}
              onOpenTrackSelector={() => setIsTrackSheetOpen(true)}
              onOpenGuide={() => {
                const firstLesson = levels[0]
                if (firstLesson) handleReadGuide(firstLesson)
              }}
            />

            {/* Mapa Sinuoso com os Nós em Zigue-zague */}
            <LearnMap
              trackSlug={activeTrack.trackSlug}
              levels={levels}
              onSelectLevel={handleSelectLevel}
              onReadGuide={handleReadGuide}
              onClaimChest={handleClaimChest}
            />

            {/* Drawer de Troca de Trilhas (Mockup 10b) */}
            <TrackSelectorSheet
              isOpen={isTrackSheetOpen}
              onClose={() => setIsTrackSheetOpen(false)}
              tracks={tracks}
              activeTrackSlug={activeTrack.trackSlug}
              onSelectTrack={handleSelectTrack}
              onOpenStudyGuides={handleOpenStudyGuides}
            />
          </main>
        )}
      </div>
    </AppShell>
  )
}
export default LearnPage
