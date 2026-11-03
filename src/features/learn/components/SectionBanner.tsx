// src/features/learn/components/SectionBanner.tsx
// Header/Banner da Trilha Atual no topo do Mapa Sinuoso
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
  trackDescription,
  progressPct,
  onOpenTrackSelector,
  onOpenGuide,
  className = '',
}) => {
  const orderFormatted = String(trackOrder).padStart(2, '0')

  return (
    <div
      className={`w-full bg-gradient-to-r from-[#7D2BD6] via-[#8E2DE2] to-[#A855F7] rounded-3xl p-4 text-white shadow-lg shadow-purple-600/20 relative overflow-hidden ${className}`}
    >
      {/* Detalhe translúcido de fundo */}
      <div className="absolute -right-8 -bottom-8 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />

      <div className="flex items-center justify-between gap-3 relative z-10">
        {/* Seletor de Trilha (clicável para abrir a sheet) */}
        <button
          type="button"
          onClick={onOpenTrackSelector}
          className="flex-1 text-left group flex items-start gap-2.5 focus:outline-none"
        >
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-black uppercase tracking-wider text-purple-200">
                TRILHA {orderFormatted}
              </span>
              <ChevronDown className="w-4 h-4 text-purple-200 group-hover:translate-y-0.5 transition-transform" />
            </div>
            <h1 className="font-nunito font-extrabold text-lg sm:text-xl text-white leading-tight mt-0.5">
              {trackTitle}
            </h1>
            {trackDescription && (
              <p className="font-nunito text-xs text-purple-100/90 line-clamp-1 mt-0.5">
                {trackDescription}
              </p>
            )}
          </div>
        </button>

        {/* Botão para abrir o Guia da Unidade */}
        {onOpenGuide && (
          <button
            type="button"
            onClick={onOpenGuide}
            aria-label="Abrir guia da unidade"
            className="w-10 h-10 rounded-2xl bg-white/20 hover:bg-white/30 active:scale-95 transition-all flex items-center justify-center border border-white/25 flex-shrink-0 drop-shadow-sm"
          >
            <BookOpen className="w-5 h-5 text-white" />
          </button>
        )}
      </div>

      {/* Mini barra de progresso da trilha */}
      <div className="mt-3 pt-2.5 border-t border-white/15 flex items-center gap-3 relative z-10">
        <div className="flex-1 bg-black/20 h-2 rounded-full overflow-hidden p-0.5">
          <div
            className="bg-[#2FBF71] h-full rounded-full transition-all duration-500 shadow-sm"
            style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
          />
        </div>
        <span className="font-nunito font-extrabold text-xs text-purple-100 flex-shrink-0">
          {progressPct}%
        </span>
      </div>
    </div>
  )
}
