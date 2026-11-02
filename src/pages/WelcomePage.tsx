import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mascot } from '../components/Mascot'
import { Button } from '../components/Button'
import { AppShell } from '../components/AppShell'
import { useAuth } from '../context/AuthContext'
import { Heart, Sparkles, TrendingUp, Target, BookOpen } from 'lucide-react'
import { toast } from 'sonner'

export const WelcomePage: React.FC = () => {
  const navigate = useNavigate()
  const { signInDemo } = useAuth()
  const [slide, setSlide] = useState(0)
  const [isDemoLoading, setIsDemoLoading] = useState(false)

  const slides = [
    {
      title: 'Bem-vinda!',
      subtitle: 'Aqui você aprende, organiza e conquista seus objetivos financeiros com leveza.',
      icon: <Heart className="w-5 h-5 text-primary inline ml-1 fill-primary/20" />,
      highlight: 'organizar gastos sem culpa e com clareza.',
    },
    {
      title: 'Metas no seu ritmo',
      subtitle: 'Construa sua reserva de emergência e realize sonhos passo a passo.',
      icon: <Target className="w-5 h-5 text-primary inline ml-1" />,
      highlight: 'primeiros passos gentis a partir de R$ 20.',
    },
    {
      title: 'Educação para a vida real',
      subtitle: 'Entenda juros, cartão e planejamento financeiro em lições rápidas de 5 minutos.',
      icon: <BookOpen className="w-5 h-5 text-primary inline ml-1" />,
      highlight: 'conhecimento prático para mais autonomia.',
    },
  ]

  const current = slides[slide]

  React.useEffect(() => {
    const timer = setInterval(() => {
      setSlide((prev) => (prev + 1) % slides.length)
    }, 4500)
    return () => clearInterval(timer)
  }, [slides.length])

  const handleDemoLogin = async () => {
    setIsDemoLoading(true)
    const { error } = await signInDemo()
    setIsDemoLoading(false)
    if (error) {
      toast.error('Não foi possível iniciar o modo demonstração. Tente novamente.')
    } else {
      toast.success('Bem-vinda ao modo demonstração de Ana Oliveira! 🎉')
      navigate('/inicio')
    }
  }

  return (
    <AppShell showNav={false} className="justify-between px-6 py-10 relative overflow-hidden bg-white">
      {/* Decorações */}
      <div className="absolute top-10 right-8 text-gold text-lg">✦</div>
      <div className="absolute top-20 left-6 text-lilac/50 text-sm">★</div>
      <div className="absolute bottom-40 right-10 text-gold/80 text-sm">●</div>

      {/* Título e Subtítulo */}
      <div className="text-center pt-4 z-10">
        <h1 className="text-3xl font-extrabold text-deep font-sans flex items-center justify-center gap-1.5 mb-2">
          {current.title} {current.icon}
        </h1>
        <p className="text-sm font-semibold text-textSec leading-relaxed max-w-xs mx-auto">
          {current.subtitle}
        </p>
      </div>

      {/* Mascote central com saco de moedas/adereço */}
      <div className="flex flex-col items-center justify-center my-auto py-6 z-10">
        <div className="relative">
          <Mascot size="hero" accessory="floating" />
          <div className="absolute -bottom-2 -right-2 bg-gold/90 text-deep p-2 rounded-full shadow-md border-2 border-white">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        {/* Indicador de 3 pontos do carrossel */}
        <div className="flex items-center gap-2 mt-8">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setSlide(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                slide === idx ? 'w-6 bg-primary' : 'w-2 bg-lilac/30'
              }`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Ações inferiores */}
      <div className="flex flex-col gap-3 w-full z-10">
        <Button
          size="lg"
          fullWidth
          onClick={() => navigate('/cadastrar')}
        >
          Começar agora
        </Button>

        <button
          onClick={() => navigate('/entrar')}
          className="text-sm font-bold text-deep/75 hover:text-primary transition-colors py-2 text-center"
        >
          Já tenho uma conta · <span className="text-primary font-extrabold">Entrar</span>
        </button>

        {/* Botão extra discreto de demonstração */}
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
