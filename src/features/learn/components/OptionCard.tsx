// src/features/learn/components/OptionCard.tsx
// Card de Opção Interativo com badge indicador e feedback tátil (tokens de design/tokens.md Seção 7)

import React from 'react'
import { Check, X } from 'lucide-react'

export type OptionCardState = 'idle' | 'selected' | 'correct' | 'incorrect'

export interface OptionCardProps {
  label?: string
  text: string
  selected?: boolean
  state?: OptionCardState
  disabled?: boolean
  onClick?: () => void
  className?: string
}

const STATE_CONTAINER_STYLES: Record<OptionCardState, string> = {
  idle: 'bg-white border-[#E5DBF5] border-b-[5px] border-b-[#D4C3EE] text-[#33105D] hover:bg-[#FAF6FF] active:border-b-[2px] active:translate-y-[3px]',
  selected:
    'bg-[#F6EEFF] border-[#7D2BD6] border-b-[5px] border-b-[#5B21B6] text-[#33105D] shadow-md ring-2 ring-[#7D2BD6]/25 active:border-b-[2px] active:translate-y-[3px]',
  correct:
    'bg-[#DCFCE7] border-[#22C55E] border-b-[5px] border-b-[#16A34A] text-[#15803D] cursor-default shadow-xs',
  incorrect:
    'bg-[#FEE2E2] border-[#EF4444] border-b-[5px] border-b-[#DC2626] text-[#991B1B] cursor-default shadow-xs animate-shake',
}

const STATE_BADGE_STYLES: Record<OptionCardState, string> = {
  idle: 'bg-[#F3E8FF] text-[#7D2BD6] border border-[#E0D0F5]',
  selected: 'bg-gradient-to-r from-[#7D2BD6] to-[#9333EA] text-white border border-[#7D2BD6] shadow-xs scale-105',
  correct: 'bg-[#22C55E] text-white border border-[#16A34A]',
  incorrect: 'bg-[#EF4444] text-white border border-[#DC2626]',
}

export const OptionCard: React.FC<OptionCardProps> = ({
  label,
  text,
  selected = false,
  state: explicitState,
  disabled = false,
  onClick,
  className = '',
}) => {
  // Se explicitState não for passado, deriva de selected
  const currentState: OptionCardState = explicitState ?? (selected ? 'selected' : 'idle')
  const containerStyle = STATE_CONTAINER_STYLES[currentState]
  const badgeStyle = STATE_BADGE_STYLES[currentState]

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      aria-pressed={currentState === 'selected'}
      onClick={() => {
        if (!disabled && onClick) onClick()
      }}
      onKeyDown={(e) => {
        if (!disabled && onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onClick()
        }
      }}
      className={`relative flex items-center gap-3.5 p-4 rounded-2xl border-2 font-bold select-none transition-all duration-75 outline-none focus-visible:ring-2 focus-visible:ring-[#7D2BD6] ${containerStyle} ${
        disabled && currentState === 'idle' ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
      } ${className}`}
    >
      {label ? (
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center font-extrabold text-xs transition-colors duration-150 ${badgeStyle}`}
        >
          {currentState === 'correct' ? (
            <Check className="w-4 h-4 stroke-[3]" />
          ) : currentState === 'incorrect' ? (
            <X className="w-4 h-4 stroke-[3]" />
          ) : (
            label
          )}
        </div>
      ) : null}
      <span className="flex-1 text-sm sm:text-base leading-snug">{text}</span>
    </div>
  )
}
