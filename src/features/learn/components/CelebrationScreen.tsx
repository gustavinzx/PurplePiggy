// src/features/learn/components/CelebrationScreen.tsx
// Tela de Parabéns V2 canônica (design/v2/06-parabens.png)
import React, { useEffect, useState } from 'react'
import { Mascot } from '../../../components/Mascot'
import confetti from 'canvas-confetti'

interface CelebrationScreenProps {
  levelTitle: string
  trackTitle?: string
  stars: number // 1 a 3 estrelas calculadas pela precisão
  xpEarned: number
  firstTryCount: number
  totalQuestions: number
  isTrackCompleted?: boolean
  isFirstLevelOfDay?: boolean
  streakCount?: number
  onContinueToMap: () => void
}

export const CelebrationScreen: React.FC<CelebrationScreenProps> = ({
  levelTitle,
  stars,
  xpEarned,
  firstTryCount,
  totalQuestions,
  isTrackCompleted = false,
  isFirstLevelOfDay = false,
  streakCount = 1,
  onContinueToMap,
}) => {
  const [step, setStep] = useState<'parabens' | 'streak'>('parabens')

  // Disparo único de canvas-confetti ao carregar a tela
  useEffect(() => {
    confetti({
      particleCount: 60,
      spread: 75,
      origin: { y: 0.4 },
      colors: ['#F5B83D', '#7D2BD6', '#2FBF71', '#C084FC', '#FFFFFF'],
    })
  }, [])

  // Determina pose oficial do mascote:
  // <Mascot pose="trophy"> com 3 estrelas e <Mascot pose="medal"> com 1 ou 2.
  // Ao concluir a trilha inteira, <Mascot pose="diploma"> (único lugar permitido).
  const getMascotPose = (): 'trophy' | 'medal' | 'diploma' => {
    if (isTrackCompleted) return 'diploma'
    if (stars >= 3) return 'trophy'
    return 'medal'
  }

  const handleContinue = () => {
    if (step === 'parabens' && isFirstLevelOfDay) {
      setStep('streak')
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.5 },
        colors: ['#F5B83D', '#F97316'],
      })
    } else {
      onContinueToMap()
    }
  }

  return (
    <div
      data-testid="parabens-screen"
      className="fixed inset-0 z-50 flex flex-col justify-between items-center overflow-hidden select-none bg-gradient-to-b from-[#8B26D2] via-[#9F4BE9] via-70% to-[#EBD5FF] text-white"
    >
      {/* 1. Raios de luz rotativos ao fundo (estilo sunburst como em 06-parabens.png) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center -top-24" aria-hidden="true">
        <svg
          className="w-[750px] h-[750px] opacity-35 animate-ray-rotate shrink-0"
          viewBox="0 0 600 600"
        >
          <g transform="translate(300, 300)">
            {Array.from({ length: 16 }).map((_, i) => {
              const angle1 = (i * 22.5 - 5.5) * (Math.PI / 180)
              const angle2 = (i * 22.5 + 5.5) * (Math.PI / 180)
              const x1 = Math.cos(angle1) * 350
              const y1 = Math.sin(angle1) * 350
              const x2 = Math.cos(angle2) * 350
              const y2 = Math.sin(angle2) * 350
              return (
                <path
                  key={i}
                  d={`M 0 0 L ${x1} ${y1} A 350 350 0 0 1 ${x2} ${y2} Z`}
                  fill="url(#sunburst-grad)"
                />
              )
            })}
          </g>
          <defs>
            <radialGradient id="sunburst-grad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>

        {/* Confetes decorativos fixos nas laterais */}
        <img
          src="/assets/icons/confetti.png"
          alt=""
          className="absolute top-10 left-4 w-12 h-12 object-contain opacity-70 pointer-events-none"
        />
        <img
          src="/assets/icons/confetti.png"
          alt=""
          className="absolute top-14 right-5 w-11 h-11 object-contain opacity-65 pointer-events-none -scale-x-100"
        />
      </div>

      {/* 2. Moedas douradas flutuantes posicionadas conforme o mockup */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {/* Moeda superior esquerda */}
        <img
          src="/assets/coins/coin-1.png"
          alt=""
          className="absolute top-36 left-2 sm:left-4 w-10 h-10 object-contain drop-shadow-md animate-island-0 pointer-events-none"
        />
        {/* Moeda superior direita */}
        <img
          src="/assets/coins/coin-1.png"
          alt=""
          className="absolute top-20 right-4 sm:right-6 w-11 h-11 object-contain drop-shadow-md animate-island-1 pointer-events-none"
        />
        {/* Moeda média direita */}
        <img
          src="/assets/coins/coin-1.png"
          alt=""
          className="absolute top-52 right-3 w-8 h-8 object-contain drop-shadow-md animate-island-2 pointer-events-none"
        />
      </div>

      {/* 3. Mascote Grande no Topo (ocupa cerca de 260px a 280px, exatamente como no layout) */}
      <div className="relative z-10 w-full flex flex-col items-center pt-2 sm:pt-4">
        <div className="relative flex items-center justify-center">
          <Mascot
            pose={step === 'streak' ? 'trophy' : getMascotPose()}
            size="hero"
            className="filter drop-shadow-xl select-none scale-110"
            priority
            alt="Mascote comemorando"
          />

          {/* Sparkle brilhando próximo ao troféu/cabeça */}
          <img
            src="/assets/icons/sparkle.png"
            alt=""
            className="absolute top-2 right-2 w-7 h-7 object-contain drop-shadow animate-sparkle-blink pointer-events-none"
          />
        </div>
      </div>

      {/* 4. Card Central Branco (com moeda dourada sobreposta no canto direito) */}
      <div className="relative z-20 w-full max-w-[344px] px-4 -mt-10">
        {/* Moeda dourada sobreposta no canto superior/médio direito do card */}
        <img
          src="/assets/coins/coin-1.png"
          alt=""
          className="absolute -top-3 -right-0 w-11 h-11 object-contain drop-shadow-lg z-30 animate-island-1 pointer-events-none"
        />

        {step === 'parabens' ? (
          <div className="bg-white rounded-[32px] p-6 shadow-2xl text-center border border-white/90 animate-fadeIn relative">
            {/* Título Principal */}
            <h1 className="font-nunito font-black text-2xl sm:text-[26px] text-[#3B0764] leading-tight">
              {isTrackCompleted ? 'Trilha concluída!' : 'Parabéns!'}
            </h1>

            {/* Subtítulo com etapa */}
            <p className="font-nunito font-bold text-sm text-[#5B21B6] mt-1.5 leading-snug">
              Você concluiu a etapa <br />
              <span className="font-extrabold text-[#7D2BD6]">{levelTitle}!</span>
            </p>

            {/* 3 Estrelas de Maestria (grandes, douradas e brilhantes) */}
            <div className="flex items-center justify-center gap-3 my-4">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="w-11 h-11 flex items-center justify-center">
                  <img
                    src="/assets/icons/icon-goal-star.webp"
                    alt=""
                    className={`w-11 h-11 object-contain transition-all duration-300 ${
                      idx < stars
                        ? 'opacity-100 scale-105 drop-shadow-md'
                        : 'opacity-25 grayscale scale-90'
                    }`}
                  />
                </div>
              ))}
            </div>

            {/* Linha discreta: +XP e X de Y de primeira */}
            <div className="flex items-center justify-center gap-3 pt-2 border-t border-purple-50 text-[11.5px] font-nunito font-extrabold text-[#7D6A9C]">
              <span className="text-[#7D2BD6]">+{xpEarned} XP</span>
              <span className="text-gray-300">·</span>
              <span>
                {firstTryCount} de {totalQuestions} de primeira
              </span>
            </div>
          </div>
        ) : (
          /* Card da Ofensiva Piggy */
          <div className="bg-white rounded-[32px] p-6 shadow-2xl text-center border border-white/90 animate-fadeIn relative">
            <span className="text-[10.5px] font-black uppercase tracking-wider text-amber-700 bg-amber-100 px-3 py-1 rounded-full inline-block mb-2">
              Ofensiva Piggy
            </span>

            <h1 className="font-nunito font-black text-2xl text-[#3B0764] leading-tight">
              {streakCount} {streakCount === 1 ? 'dia de foco!' : 'dias seguidos!'}
            </h1>

            <p className="font-nunito font-semibold text-xs text-[#7D6A9C] mt-2 leading-relaxed">
              Você completou sua meta diária de aprendizado financeiro. Pequenos passos constantes
              transformam seu futuro!
            </p>

            <div className="mt-4 p-3 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 flex items-center justify-center gap-2">
              <img
                src="/assets/icons/icon-chama.png"
                alt=""
                className="w-5 h-5 object-contain"
              />
              <span className="font-nunito font-black text-sm text-amber-900">
                Ofensiva mantida com sucesso
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 5. Rodapé com Botão "Continuar ✨" e Nuvens Suaves na Base */}
      <div className="relative z-20 w-full max-w-[344px] px-4 flex flex-col items-center pb-8 pt-4">
        {/* Botão de Ação Primário com Sparkle */}
        <button
          type="button"
          onClick={handleContinue}
          className="w-full h-14 rounded-full font-nunito font-black text-base text-white bg-gradient-to-r from-[#7D2BD6] to-[#8E2DE2] shadow-xl shadow-purple-950/25 hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-2 border border-purple-300/40 cursor-pointer"
        >
          <span>{step === 'parabens' ? 'Continuar' : 'Voltar ao mapa'}</span>
          <img
            src="/assets/icons/sparkle.png"
            alt=""
            className="w-4 h-4 object-contain shrink-0"
          />
        </button>

        {/* Nuvens brancas suaves repousadas na base */}
        <div className="absolute -bottom-12 left-0 right-0 h-28 pointer-events-none overflow-hidden flex items-end justify-center opacity-95 -z-10">
          <img
            src="/assets/learn/cloud-a.webp"
            alt=""
            className="w-52 h-24 object-contain -mr-12 opacity-85"
          />
          <img
            src="/assets/learn/cloud-b.webp"
            alt=""
            className="w-60 h-28 object-contain opacity-100"
          />
          <img
            src="/assets/learn/cloud-c.webp"
            alt=""
            className="w-52 h-24 object-contain -ml-12 opacity-85"
          />
        </div>
      </div>
    </div>
  )
}
export default CelebrationScreen
