import React from 'react'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'white' | 'glass' | 'saldo' | 'baby' | 'lilac'
  size?: 'default' | 'sm'
  hoverEffect?: boolean
}

/**
 * Componente Card canônico do PurplePiggy (design/tokens.md):
 * - 'white': Fundo branco (#FFFFFF), raio 24px (rounded-[24px]), borda #F0EBF8, sombra card suave e padding interno p-5 (20px).
 * - 'saldo': Fundo degradê roxo (#8E32D8 -> #521D83), texto branco, raio 24px, padding p-5 (20px).
 * - 'sm': Raio 20px (rounded-[20px]), padding p-3.5 (14px).
 * - Altura automática (h-auto), overflow visível (overflow-visible) para garantir que sombras e anéis nunca sejam cortados.
 */
export const Card: React.FC<CardProps> = ({
  children,
  variant = 'white',
  size = 'default',
  hoverEffect = false,
  className = '',
  ...props
}) => {
  const variantStyles = {
    white: 'bg-white text-deep shadow-card border border-[#F0EBF8]',
    glass: 'bg-white/85 backdrop-blur-md text-deep shadow-card border border-lilac/25',
    saldo: 'bg-gradient-to-br from-[#8E32D8] to-[#521D83] text-white shadow-card-saldo border-0',
    baby: 'bg-[#DEEEFC] text-deep border border-[#D5E7FA] shadow-xs',
    lilac: 'bg-[#F8E9FE] text-deep border border-[#F0DAFB] shadow-xs',
  }

  const radiusAndPadding = size === 'sm' ? 'rounded-[20px] p-3.5' : 'rounded-[24px] p-5'
  const hoverClass = hoverEffect
    ? 'hover:border-primary/30 transition-all cursor-pointer active:scale-[0.99]'
    : ''

  return (
    <div
      className={`w-full h-auto overflow-visible min-w-0 transition-all duration-200 ${radiusAndPadding} ${variantStyles[variant]} ${hoverClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export default Card
