// src/features/learn/components/SectionBanner.tsx
// Header/Banner Compacto da Trilha Atual (84-90px)
import React from 'react'
import { ChevronDown, BookOpen } from 'lucide-react'

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
      className={`w-full bg-gradient-to-r from-[#7D2BD6] via-[#8E2DE2] to-[#A855F7] rounded-2xl p-3 text-white shadow-md shadow-purple-600/15 relative overflow-hidden flex flex-col justify-between h-[86px] select-none ${className}`}
    >
      <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-lg pointer-events-none" />

      {/* Linha 1: "TRILHA 01 ⌄" + Botão Guia */}
      <div className="flex items-center justify-between relative z-10">
        <button
          type="button"
          onClick={onOpenTrackSelector}
          className="flex items-center gap-1.5 focus:outline-none group"
        >
          <span className="text-[11px] font-black uppercase tracking-wider text-purple-200">
            TRILHA {orderFormatted}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-purple-200 group-hover:translate-y-0.5 transition-transform" />
        </button>

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
      </div>

      {/* Linha 2: Título da Trilha em 1 linha */}
      <h1 className="font-nunito font-extrabold text-base text-white truncate relative z-10 -mt-1">
        {trackTitle}
      </h1>

      {/* Linha 3: Barra e percentual na mesma linha */}
      <div className="flex items-center gap-2 relative z-10">
        <div className="flex-1 bg-black/20 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-[#2FBF71] h-full rounded-full transition-all duration-500 shadow-sm"
            style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
          />
        </div>
        <span className="font-nunito font-black text-[11px] text-purple-100 shrink-0 leading-none">
          {progressPct}%
        </span>
      </div>
    </div>
  )
}
