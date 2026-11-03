import React, { useId } from 'react'

export interface ProgressRingProps {
  progress: number // 0 a 100
  size?: number
  strokeWidth?: number
  showLabel?: boolean
  variant?: 'gold' | 'purple' | 'custom'
  strokeColor?: string
  trackColor?: string
  className?: string
}

/**
 * Componente ProgressRing (Anel de Progresso Circular) canônico do PurplePiggy:
 * - Traço 100% arredondado (strokeLinecap="round").
 * - Variante 'gold': Degradê dourado-laranja (#F5B83D -> #F08A3C) canônico das Metas.
 * - Variante 'purple': Degradê roxo (#7D2BD6 -> #B037F8) das metas da Home.
 * - Trilho lilás claro (#EADFFB / #F0E7FA).
 * - Rótulo central de porcentagem em negrito (Nunito ExtraBold).
 */
export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 54,
  strokeWidth = 5,
  showLabel = true,
  variant = 'gold',
  strokeColor,
  trackColor = '#EADFFB',
  className = '',
}) => {
  const gradientId = useId().replace(/:/g, '')
  const clamped = Math.min(Math.max(progress, 0), 100)
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDashoffset = circumference - (clamped / 100) * circumference

  // Resolver cor do traço
  const strokeProp =
    variant === 'gold'
      ? `url(#${gradientId}-gold)`
      : variant === 'purple'
      ? `url(#${gradientId}-purple)`
      : strokeColor || '#7D2BD6'

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        <defs>
          {/* Degradê Dourado-Laranja das Metas */}
          <linearGradient id={`${gradientId}-gold`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F5B83D" />
            <stop offset="100%" stopColor="#F08A3C" />
          </linearGradient>

          {/* Degradê Roxo Canônico */}
          <linearGradient id={`${gradientId}-purple`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7D2BD6" />
            <stop offset="100%" stopColor="#B037F8" />
          </linearGradient>
        </defs>

        {/* Trilho circular lilás claro */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />

        {/* Arco de progresso com traço arredondado */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeProp}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-700 ease-out"
        />
      </svg>

      {/* Rótulo de porcentagem central */}
      {showLabel && (
        <span className="absolute text-[11px] font-extrabold font-sans text-deep leading-none">
          {Math.round(clamped)}%
        </span>
      )}
    </div>
  )
}

export default ProgressRing
