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
  idle: 'bg-white border-[#E8DEFB] border-b-[4px] border-b-[#D8C2FF] text-[#432171] hover:bg-[#FBF8FE] active:border-b-[2px] active:translate-y-[2px]',
  selected:
    'bg-[#F6EEFF] border-[#7D2BD6] border-b-[4px] border-b-[#5B21B6] text-[#432171] shadow-sm active:border-b-[2px] active:translate-y-[2px]',
  correct:
    'bg-[#DCFCE7] border-[#2FBF71] border-b-[4px] border-b-[#1E824C] text-[#15803D] cursor-default',
  incorrect:
    'bg-[#FCE7F3] border-[#E5487A] border-b-[4px] border-b-[#BE185D] text-[#BE185D] cursor-default',
}

const STATE_BADGE_STYLES: Record<OptionCardState, string> = {
  idle: 'bg-[#F0E7FA] text-[#7D6A9C] border border-[#E0D0F5]',
  selected: 'bg-[#7D2BD6] text-white border border-[#7D2BD6]',
  correct: 'bg-[#2FBF71] text-white border border-[#2FBF71]',
  incorrect: 'bg-[#E5487A] text-white border border-[#E5487A]',
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
