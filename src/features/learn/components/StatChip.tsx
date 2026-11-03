// src/features/learn/components/StatChip.tsx
// Chip de estatística do topo do mapa (Ofensiva, XP, Moedas, Vidas)
import React from 'react'

export type StatChipVariant = 'streak' | 'xp' | 'coins' | 'hearts'

interface StatChipProps {
  variant: StatChipVariant
  value: number | string
  className?: string
  onClick?: () => void
}

const STAT_CONFIG = {
  streak: {
    icon: '/assets/icons/icon-chama.png',
    alt: 'Ofensiva',
    textColor: 'text-[#D97706]', // Amarelo/Laranja fogo
    bg: 'bg-white/90 shadow-sm border border-amber-200/60',
  },
  xp: {
    icon: '/assets/icons/icon-xp.png',
    alt: 'XP',
    textColor: 'text-[#7D2BD6]', // Roxo PurplePiggy
    bg: 'bg-white/90 shadow-sm border border-purple-200/60',
  },
  coins: {
    icon: '/assets/coins/coin-1.png',
    alt: 'Moedas Piggy',
    textColor: 'text-[#B45309]', // Dourado
    bg: 'bg-white/90 shadow-sm border border-amber-200/60',
  },
  hearts: {
    icon: '/assets/icons/heart-filled.png',
    alt: 'Vidas',
    textColor: 'text-[#E5487A]', // Rosa / Vermelho acolhedor
    bg: 'bg-white/90 shadow-sm border border-pink-200/60',
  },
}

export const StatChip: React.FC<StatChipProps> = ({
  variant,
  value,
  className = '',
  onClick,
}) => {
  const config = STAT_CONFIG[variant]

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-extrabold text-sm select-none transition-transform ${
        onClick ? 'active:scale-95 cursor-pointer' : 'cursor-default'
      } ${config.bg} ${className}`}
    >
      <img
        src={config.icon}
        alt={config.alt}
        className="w-5 h-5 object-contain drop-shadow-sm flex-shrink-0"
        loading="lazy"
        width={20}
        height={20}
      />
      <span className={`font-nunito tracking-tight ${config.textColor}`}>
        {value}
      </span>
    </button>
  )
}
