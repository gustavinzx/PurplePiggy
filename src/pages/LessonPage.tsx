import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { AppShell } from '../components/AppShell'
import { Mascot } from '../components/Mascot'
import { Button } from '../components/Button'
import { ArrowLeft, CheckCircle2, ArrowRight, Lightbulb, Sparkles, BookOpen } from 'lucide-react'
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

  useEffect(() => {
    if (user && lessonSlug) {
      loadLesson()
    }
  }, [user, lessonSlug])

  const loadLesson = async () => {
    if (!user) return
    setLoading(true)

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

      // 3. Carregar todas as lições da mesma trilha para navegação de próxima
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
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } })
      toast.success('Parabéns! Lição concluída com sucesso! 💜')
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
          <div className="bg-gold/20 rounded-[20px] p-4 border border-gold/40 mb-6 text-xs">
            <span className="font-extrabold text-deep block mb-1">✨ Dica amiga:</span>
            <p className="font-semibold text-deep/90 leading-relaxed">
              {lesson.tip}
            </p>
          </div>
        )}
      </div>

      {/* Ações inferiores */}
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
