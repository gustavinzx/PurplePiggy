// src/pages/GuidePage.tsx
// Leitura de Guia do Nível ou Guia de Estudo (Prompt N11B e N12)
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { GuideReader, GuideContent } from '../features/learn/components'
import { Mascot } from '../components/Mascot'
import { toast } from 'sonner'

export const GuidePage: React.FC = () => {
  const { slug, n } = useParams<{ slug?: string; n?: string }>()
  const navigate = useNavigate()
  const [guide, setGuide] = useState<GuideContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [lessonSlug, setLessonSlug] = useState<string>('')

  useEffect(() => {
    async function loadGuide() {
      setLoading(true)
      try {
        const targetTrack = slug || 'organizacao-financeira'
        let content: any = null

        if (n) {
          const levelNum = parseInt(n, 10) || 1
          const { data } = await supabase
            .from('educational_contents')
            .select('*')
            .eq('track_slug', targetTrack)
            .order('lesson_order', { ascending: true })

          if (data && data[levelNum - 1]) {
            content = data[levelNum - 1]
          } else if (data && data[0]) {
            content = data[0]
          }
        } else {
          // Busca por slug direto
          const { data } = await supabase
            .from('educational_contents')
            .select('*')
            .or(`lesson_slug.eq.${slug},track_slug.eq.${slug}`)
            .limit(1)
            .maybeSingle()

          content = data
        }

        if (content) {
          setLessonSlug(content.lesson_slug)
          setGuide({
            title: content.lesson_title,
            subtitle: content.summary,
            trackTitle: content.track_title,
            readingTimeMinutes: content.minutes || 5,
            explanation: content.body_md,
            example: content.example_md,
            tip: content.tip,
          })
        } else {
          // Conteúdo educativo padrão de fallback
          setGuide({
            title: 'Para onde vai meu dinheiro?',
            subtitle: 'O primeiro passo para a liberdade financeira é observar seus gastos sem culpa.',
            trackTitle: 'Organização Financeira',
            readingTimeMinutes: 5,
            explanation:
              'Organizar o dinheiro não é sobre cortar tudo o que traz alegria, mas sobre entender a rota que suas escolhas fazem no dia a dia. Quando você anota o que gasta, ganha clareza e poder de decisão.\n\nNesta etapa, dividimos seus gastos em três grandes grupos: essenciais (o que mantém a vida funcionando), prioridades/metas (seu futuro e tranquilidade) e estilo de vida.',
            example:
              'Se você recebe R$ 2.500 por mês e gasta R$ 1.500 com contas essenciais, você tem R$ 1.000 para equilibrar entre pequenos confortos e construir sua reserva aos poucos.',
            tip: 'Anote os gastos na hora em que eles acontecem no PurplePiggy. Em poucos segundos o hábito se consolida!',
          })
        }
      } catch (err) {
        console.error('Erro ao carregar guia:', err)
      } finally {
        setLoading(false)
      }
    }

    loadGuide()
  }, [slug, n])

  const handleBack = () => {
    navigate(-1)
  }

  const handleComplete = () => {
    toast.success('Leitura concluída com sucesso!')
    if (slug && n) {
      navigate(`/aprender/trilha/${slug}/nivel/${n}`)
    } else {
      navigate('/aprender')
    }
  }

  const handleStartChallenge = () => {
    if (slug && n) {
      navigate(`/aprender/trilha/${slug}/nivel/${n}`)
    } else {
      navigate('/aprender')
    }
  }

  if (loading || !guide) {
    return (
      <div className="min-h-screen bg-[#FAF5FF] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 drop-shadow animate-bounce">
          <Mascot pose="loading" className="w-full h-full object-contain" priority />
        </div>
        <p className="font-nunito font-bold text-sm text-purple-900 mt-4">
          Carregando guia...
        </p>
      </div>
    )
  }

  return (
    <GuideReader
      guide={guide}
      onBack={handleBack}
      onComplete={handleComplete}
      onNextLesson={handleStartChallenge}
      completedButtonText="Concluir lição"
      nextButtonText="Iniciar Desafio do Nível →"
    />
  )
}
export default GuidePage
