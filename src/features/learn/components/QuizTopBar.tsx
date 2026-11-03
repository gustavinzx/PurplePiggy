// src/features/learn/components/QuizTopBar.tsx
// Barra de Topo da Lição com fechamento, progresso elástico e corações (tokens de design/tokens.md Seção 7)

import React from 'react'
import { X, Heart } from 'lucide-react'

export interface QuizTopBarProps {
  progress: number // 0 a 100
  hearts?: number
  maxHearts?: number
  onClose?: () => void
  className?: string
}

export const QuizTopBar: React.FC<QuizTopBarProps> = ({
  progress,
  hearts = 3,
  maxHearts = 3,
  onClose,
  className = '',
}) => {
  const safeProgress = Math.max(0, Math.min(100, progress))

  return (
    <header
      className={`w-full max-w-md mx-auto flex items-center justify-between gap-3 px-4 py-3 select-none ${className}`}
    >
      {/* Botão Fechar */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Sair da lição"
        className="w-9 h-9 rounded-full flex items-center justify-center text-[#7D6A9C] hover:bg-[#F0E7FA] hover:text-[#432171] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#7D2BD6]"
      >
        <X className="w-5 h-5 stroke-[2.5]" />
      </button>

      {/* Barra de Progresso Elástica Pílula */}
      <div className="flex-1 h-3.5 bg-[#F0E7FA] rounded-full p-[2px] shadow-inner relative overflow-hidden">
        <div
          role="progressbar"
          aria-valuenow={safeProgress}
          aria-valuemin={0}
          aria-valuemax={100}
          style={{ width: `${safeProgress}%` }}
          className="h-full rounded-full bg-gradient-to-r from-[#7D2BD6] to-[#B037F8] transition-all duration-300 ease-out relative"
        >
          {/* Brilho especular sutil no topo do degradê */}
          <div className="absolute inset-x-0 top-0 h-[1.5px] bg-white/40 rounded-full" />
        </div>
      </div>

      {/* Indicador de Corações */}
      <div className="flex items-center gap-1 pl-1">
        {Array.from({ length: maxHearts }).map((_, idx) => {
          const isAlive = idx < hearts
          return (
            <Heart
              key={idx}
              className={`w-5 h-5 transition-transform duration-200 ${
                isAlive
                  ? 'fill-[#E5487A] text-[#E5487A] scale-100 animate-pulseGlow'
                  : 'fill-transparent text-[#D8C2FF] scale-90'
              }`}
            />
          )
        })}
      </div>
    </header>
  )
}
