import React from 'react'

export type DecorName = 'coin-1' | 'heart-filled' | 'sparkle' | 'confetti'

export interface DecorProps {
  name: DecorName
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  alt?: string
}

const DECOR_MAP: Record<DecorName, { src: string; alt: string }> = {
  'coin-1': {
    src: '/assets/coins/coin-1.png',
    alt: 'Moeda dourada brilhante com cifrão 3D',
  },
  'heart-filled': {
    src: '/assets/icons/heart-filled.png',
    alt: 'Coração rosa 3D brilhante',
  },
  'sparkle': {
    src: '/assets/icons/sparkle.png',
    alt: 'Estrela lilás brilhante em 3D',
  },
  'confetti': {
    src: '/assets/icons/confetti.png',
    alt: 'Confetes glossy em espiral',
  },
}

const SIZE_MAP = {
  xs: 'w-5 h-5',
  sm: 'w-7 h-7',
  md: 'w-10 h-10',
  lg: 'w-14 h-14',
  xl: 'w-20 h-20',
}

export const Decor: React.FC<DecorProps> = ({
  name,
  size = 'md',
  className = '',
  alt,
}) => {
  const meta = DECOR_MAP[name] || DECOR_MAP['sparkle']
  const resolvedAlt = alt || meta.alt

  return (
    <img
      src={meta.src}
      alt={resolvedAlt}
      className={`inline-block object-contain select-none ${SIZE_MAP[size]} ${className}`}
      loading="lazy"
      draggable={false}
    />
  )
}

export default Decor
