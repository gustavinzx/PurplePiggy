import React, { useState } from 'react'
import { Atmosphere, AtmosphereVariant } from '../components/Atmosphere'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Link } from 'react-router-dom'
import { ArrowLeft, Sparkles, Shield, Layout } from 'lucide-react'

export const DesignSystemAtmospherePage: React.FC = () => {
  const [activeVariant, setActiveVariant] = useState<AtmosphereVariant>('splash')

  const variants: { id: AtmosphereVariant; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      id: 'splash',
      label: 'Splash & Boas-Vindas',
      icon: <Sparkles className="w-4 h-4" />,
      desc: 'Mais lúdica: degradê lilás, manchas orgânicas, moedas cortadas na borda, corações e estrelas de 4 pontas (telas 01 e 02).',
    },
    {
      id: 'auth',
      label: 'Cadastro & Login',
      icon: <Shield className="w-4 h-4" />,
      desc: 'Acolhedora: degradê suave, manchas nos cantos, moeda sutil no topo e sparkles equilibrados para foco nos inputs (telas 03, 04 e 05).',
    },
    {
      id: 'app',
      label: 'Interna do App',
      icon: <Layout className="w-4 h-4" />,
      desc: 'Mais calma: manchas orgânicas e degradê suave com brilhos discretos, sem moedas cortadas, garantindo legibilidade total dos dados financeiros (telas 06 a 15).',
    },
  ]

  return (
    <div className="relative min-h-screen bg-bg selection:bg-lilac selection:text-white pb-20">
      {/* Camada ativa da atmosfera selecionada */}
      <Atmosphere variant={activeVariant} />

      <div className="max-w-xl mx-auto px-4 py-8">
        {/* Topo de navegação */}
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/design-system"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-deep hover:text-primary transition-colors bg-white/70 backdrop-blur px-3 py-1.5 rounded-full border border-lilac/20 shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Design System</span>
          </Link>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-full">
            Prompt 09: Atmosfera
          </span>
        </div>

        {/* Título Principal */}
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-deep font-sans leading-tight">
            Atmosfera de Fundo
          </h1>
          <p className="text-xs font-semibold text-textSec mt-1">
            Degradê lilás, manchas orgânicas (blobs) nos cantos, estrelas de 4 pontas, corações e moedas cortadas na borda.
          </p>
        </div>

        {/* Seletor de Variantes */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {variants.map((v) => {
            const isSelected = activeVariant === v.id
            return (
              <button
                key={v.id}
                onClick={() => setActiveVariant(v.id)}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl text-center border transition-all ${
                  isSelected
                    ? 'bg-white border-primary text-primary shadow-card ring-2 ring-primary/20'
                    : 'bg-white/60 border-lilac/20 text-deep hover:bg-white/90'
                }`}
              >
                <div
                  className={`p-2 rounded-xl mb-1.5 ${
                    isSelected ? 'bg-primary/10 text-primary' : 'bg-bg text-textSec'
                  }`}
                >
                  {v.icon}
                </div>
                <span className="text-xs font-extrabold leading-tight">{v.label}</span>
                <span className="text-[10px] font-bold text-textSec/80 mt-0.5">variant="{v.id}"</span>
              </button>
            )
          })}
        </div>

        {/* Card Informativo da Variante Selecionada */}
        <div className="bg-white/85 backdrop-blur-md rounded-[22px] p-5 border border-lilac/20 shadow-card mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
            <h2 className="text-sm font-extrabold text-deep">
              Variante Ativa: <code className="text-primary font-sans font-bold text-xs">variant="{activeVariant}"</code>
            </h2>
          </div>
          <p className="text-xs font-semibold text-textSec leading-relaxed">
            {variants.find((v) => v.id === activeVariant)?.desc}
          </p>

          <div className="mt-4 pt-3 border-t border-lilac/10 flex flex-wrap gap-2 text-[11px] font-bold">
            <span className="px-2.5 py-1 rounded-full bg-lilac/15 text-deep">
              Degradê: #F6EEFF → #E9D8FF
            </span>
            <span className="px-2.5 py-1 rounded-full bg-[#EEDEFB] text-[#521D83]">
              Blob Lilás: #EEDEFB
            </span>
            <span className="px-2.5 py-1 rounded-full bg-[#DEEEFC] text-[#1E3A8A]">
              Blob Azul-Bebê: #DEEEFC
            </span>
            {activeVariant !== 'app' && (
              <>
                <span className="px-2.5 py-1 rounded-full bg-[#FEDA70]/30 text-amber-900">
                  Moeda: coin-1.png (cortada)
                </span>
                <span className="px-2.5 py-1 rounded-full bg-[#FCE7F3] text-[#BE185D]">
                  Coração: heart-filled.png
                </span>
              </>
            )}
            <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary">
              Estrelas: sparkle.png
            </span>
          </div>
        </div>

        {/* Comparativo Lado a Lado com o Fundo das Telas 01, 02, 03 e 06 */}
        <div className="space-y-6">
          <h2 className="text-base font-extrabold text-deep">
            Comparação com as Telas de Referência
          </h2>

          {/* Grid comparativo */}
          <div className="grid grid-cols-2 gap-4">
            {/* Tela 01 - Splash */}
            <div className="bg-white/80 backdrop-blur rounded-2xl p-3 border border-lilac/20 shadow-xs flex flex-col items-center">
              <span className="text-xs font-extrabold text-deep mb-2">Tela 01 — Splash</span>
              <div className="w-full aspect-[9/14] rounded-xl overflow-hidden border border-lilac/20 bg-bg relative">
                <img
                  src="/design/telas/01-splash.png"
                  alt="Tela 01 Splash Referência"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-[10px] font-bold text-textSec mt-2">Referência Oficial</span>
            </div>

            {/* Tela 02 - Boas-Vindas */}
            <div className="bg-white/80 backdrop-blur rounded-2xl p-3 border border-lilac/20 shadow-xs flex flex-col items-center">
              <span className="text-xs font-extrabold text-deep mb-2">Tela 02 — Boas-Vindas</span>
              <div className="w-full aspect-[9/14] rounded-xl overflow-hidden border border-lilac/20 bg-bg relative">
                <img
                  src="/design/telas/02-boas-vindas.png"
                  alt="Tela 02 Boas-Vindas Referência"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-[10px] font-bold text-textSec mt-2">Referência Oficial</span>
            </div>

            {/* Tela 03 - Cadastro */}
            <div className="bg-white/80 backdrop-blur rounded-2xl p-3 border border-lilac/20 shadow-xs flex flex-col items-center">
              <span className="text-xs font-extrabold text-deep mb-2">Tela 03 — Cadastro</span>
              <div className="w-full aspect-[9/14] rounded-xl overflow-hidden border border-lilac/20 bg-bg relative">
                <img
                  src="/design/telas/03-cadastro.png"
                  alt="Tela 03 Cadastro Referência"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-[10px] font-bold text-textSec mt-2">Referência Oficial</span>
            </div>

            {/* Tela 06 - Home */}
            <div className="bg-white/80 backdrop-blur rounded-2xl p-3 border border-lilac/20 shadow-xs flex flex-col items-center">
              <span className="text-xs font-extrabold text-deep mb-2">Tela 06 — Início (Home)</span>
              <div className="w-full aspect-[9/14] rounded-xl overflow-hidden border border-lilac/20 bg-bg relative">
                <img
                  src="/design/telas/06-home.png"
                  alt="Tela 06 Home Referência"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-[10px] font-bold text-textSec mt-2">Referência Oficial</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DesignSystemAtmospherePage
