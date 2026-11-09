import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mascot } from '../components/Mascot'
import { Button } from '../components/Button'
import { AppShell } from '../components/AppShell'
import { useAuth } from '../context/AuthContext'
import { Heart, Sparkles, Target, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'

export const WelcomePage: React.FC = () => {
  const navigate = useNavigate()
  const { signInDemo } = useAuth()
  const [slide, setSlide] = useState(0)
  const [isDemoLoading, setIsDemoLoading] = useState(false)

  // Touch swipe handling
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)

  const slides = [
    {
      title: 'Bem-vinda!',
      subtitle: 'Aqui você aprende, organiza e conquista seus objetivos financeiros com leveza.',
      icon: <Heart className="w-5 h-5 text-primary inline ml-1 fill-primary/20" />,
      quote: '“Oie! Sou a Piggy e vou te guiar rumo à tranquilidade financeira sem complicação!”',
      highlight: 'organizar gastos sem culpa e com clareza.',
      pose: 'welcome' as const,
    },
    {
      title: 'Metas no seu ritmo',
      subtitle: 'Construa sua reserva de emergência e realize sonhos passo a passo.',
      icon: <Target className="w-5 h-5 text-primary inline ml-1" />,
      quote: '“Cada real guardado hoje é um sonho mais perto de acontecer!”',
      highlight: 'primeiros passos gentis a partir de R$ 20.',
      pose: 'deposit' as const,
    },
    {
      title: 'Educação para a vida real',
      subtitle: 'Entenda juros, cartão e planejamento financeiro em lições rápidas de 5 minutos.',
      icon: <BookOpen className="w-5 h-5 text-primary inline ml-1" />,
      quote: '“Aprender a cuidar do seu dinheiro é o seu maior superpoder!”',
      highlight: 'conhecimento prático para mais autonomia.',
      pose: 'graduate' as const,
    },
  ]

  const current = slides[slide]

  const goToNext = () => {
    setSlide((prev) => (prev + 1) % slides.length)
  }

  const goToPrev = () => {
    setSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }

  // Auto-advance slides every 6 seconds, pauses if user swipes
  useEffect(() => {
    const timer = setInterval(() => {
      goToNext()
    }, 6000)
    return () => clearInterval(timer)
  }, [slide])

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return

    const touchEndX = e.changedTouches[0].clientX
    const touchEndY = e.changedTouches[0].clientY

    const deltaX = touchEndX - touchStartX.current
    const deltaY = touchEndY - touchStartY.current

    // Only trigger horizontal swipe if deltaX is sufficiently larger than deltaY
    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0) {
        // Swiped left -> next
        goToNext()
      } else {
        // Swiped right -> prev
        goToPrev()
      }
    }

    touchStartX.current = null
    touchStartY.current = null
  }

  const handleDemoLogin = async () => {
    setIsDemoLoading(true)
    const { error } = await signInDemo()
    setIsDemoLoading(false)
    if (error) {
      toast.error(error.message || 'Modo demonstração indisponível no momento')
    } else {
      toast.success('Bem-vinda ao modo demonstração!')
      navigate('/inicio')
    }
  }

  return (
    <AppShell showNav={false} className="justify-between px-6 py-8 relative overflow-hidden bg-white select-none">
      {/* Decorações de fundo */}
      <div className="absolute top-10 right-8 text-gold/40 select-none pointer-events-none">
        <Sparkles className="w-5 h-5 text-gold/30" />
      </div>
      <div className="absolute bottom-40 right-10 text-primary/10 text-sm select-none pointer-events-none">●</div>
      <div className="absolute top-24 left-6 text-primary/10 text-xl select-none pointer-events-none">●</div>

      {/* Título e Subtítulo */}
      <div className="text-center pt-2 z-10">
        <h1 className="text-2xl sm:text-3xl font-black text-deep font-sans flex items-center justify-center gap-1.5 mb-2 transition-all duration-300">
          {current.title} {current.icon}
        </h1>
        <p className="text-xs sm:text-sm font-semibold text-textSec leading-relaxed max-w-xs mx-auto min-h-[40px] transition-all duration-300">
          {current.subtitle}
        </p>
      </div>

      {/* Área central com touch / swipe para navegar pelos porquinhos */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="flex flex-col items-center justify-center my-auto py-2 z-10 cursor-grab active:cursor-grabbing w-full touch-pan-y"
      >
        <div className="relative flex items-center justify-center w-full max-w-[320px]">
          {/* Botão de navegação anterior sutil */}
          <button
            onClick={goToPrev}
            aria-label="Porquinho anterior"
            className="absolute left-0 p-2 text-deep/30 hover:text-primary transition-colors z-20 rounded-full hover:bg-lilac/10"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Mascote central */}
          <div className="relative mx-auto transition-transform duration-300 transform">
            <Mascot size="hero" pose={current.pose} floating={true} />
            <div className="absolute -bottom-1 -right-1 bg-gold/90 text-deep p-2 rounded-full shadow-md border-2 border-white">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>

          {/* Botão de navegação próximo sutil */}
          <button
            onClick={goToNext}
            aria-label="Próximo porquinho"
            className="absolute right-0 p-2 text-deep/30 hover:text-primary transition-colors z-20 rounded-full hover:bg-lilac/10"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Balão de fala da Piggy com a frase de sabedoria */}
        <div className="relative mt-4 max-w-[290px] mx-auto px-4 py-3 rounded-2xl bg-[#FAF5FF] border border-[#E9D5FF] shadow-[0_4px_16px_rgba(125,43,214,0.06)] text-center transition-all duration-300 animate-fadeIn">
          {/* Triângulo ponta do balão apontando para o mascote */}
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#FAF5FF] border-t border-l border-[#E9D5FF] rotate-45" />
          <p className="text-[12px] font-black text-[#5B21B6] leading-snug tracking-tight">
            {current.quote}
          </p>
        </div>

        {/* Indicador de 3 pontos do carrossel */}
        <div className="flex items-center gap-2 mt-5">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setSlide(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                slide === idx ? 'w-6 bg-primary' : 'w-2 bg-lilac/30 hover:bg-lilac/60'
              }`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
        <p className="text-[11px] font-bold text-textSec/60 mt-1.5">
          Deslize para o lado para ver mais
        </p>
      </div>

      {/* Ações inferiores */}
      <div className="flex flex-col gap-2.5 w-full z-10 pt-2">
        <Button
          size="lg"
          fullWidth
          onClick={() => navigate('/cadastrar')}
        >
          Começar agora
        </Button>

        <button
          onClick={() => navigate('/entrar')}
          className="text-sm font-bold text-deep/75 hover:text-primary transition-colors py-1.5 text-center"
        >
          Já tenho uma conta · <span className="text-primary font-extrabold">Entrar</span>
        </button>

        {/* Botão de demonstração */}
        <div className="pt-2 border-t border-lilac/10 text-center">
          <button
            onClick={handleDemoLogin}
            disabled={isDemoLoading}
            className="text-xs font-bold text-textSec hover:text-primary transition-colors inline-flex items-center gap-1.5 py-1 px-3 rounded-full hover:bg-lilac/10"
          >
            <Sparkles className="w-3.5 h-3.5 text-gold" />
            {isDemoLoading ? 'Preparando demonstração...' : 'Ver modo demonstração (apresentação acadêmica)'}
          </button>
        </div>
      </div>
    </AppShell>
  )
}
