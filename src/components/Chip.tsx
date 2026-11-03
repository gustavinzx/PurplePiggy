import React from 'react'

export type ChipVariant = 'filter' | 'positive' | 'negative' | 'active' | 'neutral' | 'chip'

export interface ChipProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: ChipVariant
  hasDropdown?: boolean
  icon?: React.ReactNode
  interactive?: boolean
  selected?: boolean
}

/**
 * Componente Chip e Pílulas de Filtro / Status do PurplePiggy:
 * - Pílula de filtro: fundo lilás claro (#F3E8FF), texto roxo escuro (#432171), seta dropdown arredondada (ex: "Este mês", "Todas").
 * - Chip de status:
 *   - 'positive' (+12%, Receitas): fundo verde pastel (#DCFCE7), texto verde (#15803D).
 *   - 'negative' (Despesa, Excluir): fundo rosa pastel (#FCE7F3), texto rosa-avermelhado (#BE185D).
 *   - 'active' (Ativa): fundo verde pastel ou lilás com indicação ativa.
 *   - 'neutral': fundo cinza-lilás (#F0EBF8), texto neutro (#7D6A9C).
 */
export const Chip: React.FC<ChipProps> = ({
  children,
  variant = 'filter',
  hasDropdown = false,
  icon,
  interactive = false,
  selected = false,
  className = '',
  ...props
}) => {
  const isFilter = variant === 'filter'

  const variantStyles: Record<ChipVariant, string> = {
    filter: selected
      ? 'bg-primary text-white shadow-xs font-bold'
      : 'bg-[#F3E8FF] text-[#432171] hover:bg-[#EBDAFF] cursor-pointer font-bold border border-lilac/20',
    positive: 'bg-[#DCFCE7] text-[#15803D] font-extrabold',
    negative: 'bg-[#FCE7F3] text-[#BE185D] font-extrabold',
    active: 'bg-[#DCFCE7] text-[#15803D] font-extrabold',
    neutral: 'bg-[#F0EBF8] text-[#7D6A9C] font-bold',
    chip: 'bg-[#F3E8FF] text-[#432171] font-bold',
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-pill text-[12px] leading-tight select-none transition-all duration-150 ${
        variantStyles[variant]
      } ${interactive ? 'cursor-pointer active:scale-95' : ''} ${className}`}
      {...props}
    >
      {icon && <span className="inline-flex shrink-0 items-center justify-center">{icon}</span>}
      <span>{children}</span>
      {hasDropdown && (
        <svg
          className="w-3.5 h-3.5 text-current opacity-80 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      )}
    </div>
  )
}

export default Chip
