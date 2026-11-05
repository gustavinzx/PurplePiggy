// src/features/learn/components/SectionBanner.tsx
// Header/Banner do Aprender V2 com Mascote pig-wink, Sparkle Asset e Barra Dourada
import React from 'react'
import { ChevronDown } from 'lucide-react'
import { Mascot } from '../../../components/Mascot'

interface SectionBannerProps {
  trackOrder: number
  trackTitle: string
  trackDescription?: string
  progressPct: number
  onOpenTrackSelector: () => void
  onOpenGuide?: () => void
  className?: string
}

export const SectionBanner: React.FC<SectionBannerProps> = ({
  trackTitle,
  progressPct,
  onOpenTrackSelector,
  className = '',
}) => {
  return (
    <div
      onClick={onOpenTrackSelector}
      className={`w-full bg-gradient-to-r from-[#7D2BD6] via-[#8E2DE2] to-[#B037F8] rounded-[24px] p-4 text-white shadow-md shadow-purple-600/20 relative overflow-hidden flex items-center justify-between h-[120px] select-none cursor-pointer transition-all active:scale-[0.99] ${className}`}
    >
      <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />

      {/* Conteúdo textual reservando espaço para o mascote à direita */}
      <div className="flex flex-col justify-center h-full flex-1 pr-28 relative z-10 min-w-0">
        {/* Linha 1: "SUA JORNADA" em caixa alta pequena */}
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-200/90 leading-none">
          Sua jornada
        </span>

        {/* Linha 2: Título da trilha + sparkle (asset) + chevron pequeno */}
        <div className="flex items-center gap-1.5 my-1.5 min-w-0">
          <h1 className="font-nunito font-extrabold text-[16px] text-white truncate leading-tight">
            {trackTitle}
          </h1>
          <img
            src="/assets/icons/sparkle.png"
            alt=""
            className="w-4 h-4 object-contain shrink-0"
            width={16}
            height={16}
          />
          <ChevronDown className="w-3.5 h-3.5 text-white/80 shrink-0" />
        </div>

        {/* Linha 3: Barra com preenchimento dourado */}
        <div className="w-full bg-black/25 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-[#FEDA70] to-[#F5B83D] h-full rounded-full transition-all duration-500 shadow-xs"
            style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
          />
        </div>

        {/* Linha 4: "{n}% concluído · Continue sua aventura!" */}
        <span className="font-nunito font-bold text-[11px] text-white/90 leading-tight mt-1.5 truncate">
          {progressPct}% concluído · Continue sua aventura!
        </span>
      </div>

      {/* Mascote pig-wink (~112px) ancorado no canto superior direito sem cobrir o texto */}
      <div className="w-[112px] h-[112px] shrink-0 absolute right-1 -top-1 drop-shadow-md pointer-events-none select-none z-10 flex items-center justify-center">
        <Mascot
          pose="wink"
          size="lg"
          className="w-[112px] h-[112px] object-contain"
          priority
          alt="Mascote PurplePiggy dando piscadinha no topo do Aprender"
        />
      </div>
    </div>
  )
}
export default SectionBanner
