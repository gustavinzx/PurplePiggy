// src/features/learn/components/SectionBanner.tsx
// Header/Banner Compacto da Trilha Atual (Fiel à Imagem 3 do Design)
import React from 'react'
import { ChevronDown, BookOpen } from 'lucide-react'
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
  trackOrder,
  trackTitle,
  progressPct,
  onOpenTrackSelector,
  onOpenGuide,
  className = '',
}) => {
  const orderFormatted = String(trackOrder).padStart(2, '0')

  return (
    <div
      className={`w-full bg-gradient-to-r from-[#7D2BD6] via-[#8E2DE2] to-[#B037F8] rounded-[22px] p-3.5 text-white shadow-md shadow-purple-600/20 relative overflow-hidden flex items-center justify-between min-h-[86px] select-none ${className}`}
    >
      <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />

      {/* Conteúdo à esquerda */}
      <div className="flex flex-col justify-between h-full flex-1 pr-3 relative z-10 min-w-0">
        {/* Linha 1: "Sua jornada · Trilha 0X ⌄" */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenTrackSelector}
            className="flex items-center gap-1.5 focus:outline-none group text-left"
          >
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-200">
              Sua jornada · Trilha {orderFormatted}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-purple-200 group-hover:translate-y-0.5 transition-transform" />
          </button>
        </div>

        {/* Linha 2: Título com brilho */}
        <h1 className="font-nunito font-extrabold text-[15px] text-white truncate leading-tight my-1">
          {trackTitle} ✨
        </h1>

        {/* Linha 3: Barra e percentual descritivo */}
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-black/25 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#FEDA70] to-[#2FBF71] h-full rounded-full transition-all duration-500 shadow-xs"
              style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
            />
          </div>
          <span className="font-nunito font-bold text-[10px] text-purple-100 shrink-0 leading-none">
            {progressPct}% concluído
          </span>
        </div>
      </div>

      {/* Mascote no canto direito (Fiel à Imagem 3 Screen 4) */}
      <div className="relative shrink-0 flex items-center gap-2 z-10">
        {onOpenGuide && (
          <button
            type="button"
            onClick={onOpenGuide}
            aria-label="Abrir guia da unidade"
            className="w-7 h-7 rounded-xl bg-white/20 hover:bg-white/30 active:scale-95 transition-all flex items-center justify-center border border-white/25 drop-shadow-sm"
          >
            <BookOpen className="w-3.5 h-3.5 text-white" />
          </button>
        )}
        <div className="w-12 h-12 shrink-0 drop-shadow-sm">
          <Mascot pose="head" size="xs" priority alt="Mascote da Trilha" />
        </div>
      </div>
    </div>
  )
}
