import React from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { Mascot } from '../components/Mascot'
import { Logo } from '../components/Logo'
import { Button } from '../components/Button'

export const SplashPage: React.FC = () => {
  const navigate = useNavigate()

  return (
    <AppShell
      showNav={false}
      variant="splash"
      className="items-center justify-between px-6 pt-12 pb-16 overflow-hidden select-none"
    >
      {/* Conteúdo central: Mascote grande com moeda no topo + Wordmark + Slogan */}
      <div className="flex-1 flex flex-col items-center justify-center text-center z-10 w-full max-w-xs animate-splash-entrance pt-4 mx-auto">
        {/* Mascote oficial: Cabeça com moeda no topo (flutuação sutil de ±6px) */}
        <div className="relative mb-5">
          <Mascot size="hero" pose="head" float priority />
        </div>

        {/* Wordmark oficial PurplePiggy */}
        <div className="mb-2">
          <Logo variant="stacked" showIcon={false} size="lg" />
        </div>

        {/* Slogan oficial do layout */}
        <p className="text-[15px] font-semibold text-textSec tracking-wide">
          Seu dinheiro, seu ritmo.
        </p>
      </div>

      {/* Ações inferiores: Botão primário 'Começar' e link de texto 'Entrar' */}
      <div className="w-full max-w-xs flex flex-col items-center gap-2.5 z-10 pb-2 animate-splash-entrance [animation-delay:150ms] mx-auto">
        <Button
          variant="primary"
          size="md"
          fullWidth
          onClick={() => navigate('/boas-vindas')}
        >
          Começar
        </Button>

        <Button
          variant="link"
          size="md"
          className="text-primary hover:text-primary-dark font-bold text-sm tracking-wide"
          onClick={() => navigate('/entrar')}
        >
          Entrar
        </Button>
      </div>
    </AppShell>
  )
}

export default SplashPage
