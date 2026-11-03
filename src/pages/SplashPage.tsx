import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Mascot } from '../components/Mascot'
import { Button } from '../components/Button'
import { AppShell } from '../components/AppShell'

export const SplashPage: React.FC = () => {
  const navigate = useNavigate()

  return (
    <AppShell showNav={false} className="justify-between px-6 py-12 relative overflow-hidden bg-gradient-to-b from-white via-bg to-white">
      {/* Elementos decorativos de fundo */}
      <div className="absolute top-8 left-6 w-3 h-3 text-gold animate-pulse">✦</div>
      <div className="absolute top-24 right-8 w-4 h-4 text-lilac/40">★</div>
      <div className="absolute bottom-32 left-10 w-4 h-4 text-gold/80">✦</div>
      <div className="absolute top-1/3 -right-10 w-40 h-40 bg-baby/50 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute top-1/4 -left-10 w-40 h-40 bg-lilac/20 rounded-full blur-2xl pointer-events-none" />

      {/* Top spacing */}
      <div className="pt-8" />

      {/* Centro: Mascote oficial com coin + Tipografia de Marca */}
      <div className="flex flex-col items-center text-center z-10">
        <div className="relative mb-6">
          <Mascot size="hero" pose="head" floating={true} priority />
        </div>

        <h1 className="text-4xl font-extrabold font-sans tracking-tight leading-none mb-3">
          <span className="text-deep">Purple</span>
          <span className="text-primary">Piggy</span>
        </h1>

        <p className="text-base text-deep/70 font-semibold tracking-wide">
          Seu dinheiro, seu ritmo.
        </p>
      </div>

      {/* Ações inferiores */}
      <div className="flex flex-col gap-3 w-full z-10 pb-4">
        <Button
          size="lg"
          fullWidth
          onClick={() => navigate('/boas-vindas')}
        >
          Começar
        </Button>
        <Button
          variant="ghost"
          size="md"
          fullWidth
          className="text-primary font-bold hover:bg-primary/5"
          onClick={() => navigate('/entrar')}
        >
          Entrar
        </Button>
      </div>
    </AppShell>
  )
}
