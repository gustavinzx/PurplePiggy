import React from 'react'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'white' | 'glass' | 'saldo' | 'baby' | 'lilac'
  size?: 'default' | 'sm'
  hoverEffect?: boolean
}

/**
 * Componente Card canônico do PurplePiggy:
 * - 'white' / 'glass': Fundo vidro claro (bg-white/90 backdrop-blur-md), raio grande (24px), borda lilás suave e sombra roxa difusa.
 * - 'saldo': Degradê roxo escuro canônico (#8E32D8 -> #521D83), texto branco, glow de elevação.
 * - 'baby': Fundo azul-bebê suave para destaques informativos.
 * - 'lilac': Fundo lilás claro para caixas de incentivo e reserva.
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
    white: 'bg-white/90 backdrop-blur-md text-deep shadow-card border border-lilac/20',
    glass: 'bg-white/80 backdrop-blur-lg text-deep shadow-glass border border-lilac/25',
    saldo: 'bg-gradient-to-br from-[#8E32D8] to-[#521D83] text-white shadow-card-saldo border-0',
    baby: 'bg-[#DEEEFC] text-deep border border-[#D5E7FA] shadow-xs',
    lilac: 'bg-[#F8E9FE] text-deep border border-[#F0DAFB] shadow-xs',
  }

  const radiusStyle = size === 'sm' ? 'rounded-card-sm p-4' : 'rounded-card p-5'
  const hoverClass = hoverEffect ? 'hover:border-primary/40 hover:shadow-md transition-all cursor-pointer' : ''

  return (
    <div
      className={`${radiusStyle} transition-all duration-200 ${variantStyles[variant]} ${hoverClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export default Card
