import React from 'react'

export type TopIconName =
  | 'icon-controle'
  | 'icon-metas'
  | 'icon-educacao'
  | 'icon-tranquilidade'
  | 'controle'
  | 'metas'
  | 'educacao'
  | 'tranquilidade'

export interface TopIconProps {
  name: TopIconName
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  alt?: string
}

const TOP_ICON_ALTS: Record<string, string> = {
  'icon-controle': 'Ícone Controle Financeiro — Gráfico 3D',
  'icon-metas': 'Ícone Metas — Alvo com Dardo 3D',
  'icon-educacao': 'Ícone Educação — Livro Aberto 3D',
  'icon-tranquilidade': 'Ícone Tranquilidade — Escudo de Segurança 3D',
}

const SIZE_MAP = {
  sm: 'w-7 h-7',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
}

export const TopIcon: React.FC<TopIconProps> = ({
  name,
  size = 'md',
  className = '',
  alt,
}) => {
  const normalized = name.startsWith('icon-') ? name : `icon-${name}`
  const src = `/assets/icons/${normalized}.png`
  const resolvedAlt = alt || TOP_ICON_ALTS[normalized] || `Ícone de topo ${normalized}`

  return (
    <img
      src={src}
      alt={resolvedAlt}
      className={`inline-block object-contain select-none ${SIZE_MAP[size]} ${className}`}
      loading="lazy"
      draggable={false}
    />
  )
}

export interface TopIconChipProps {
  name: TopIconName
  label: string
  className?: string
  onClick?: () => void
}

/**
 * Chip dos 4 ícones de topo (cabeçalho oficial do layout):
 * Fundo branco translúcido, raio grande (18px / rounded-2xl), sombra suave,
 * com o PNG 3D oficial (<TopIcon>) e o rótulo em negrito embaixo.
 */
export const TopIconChip: React.FC<TopIconChipProps> = ({
  name,
  label,
  className = '',
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white/95 backdrop-blur-md rounded-2xl p-3 border border-lilac/20 shadow-card flex flex-col items-center text-center justify-between min-w-[76px] transition-transform active:scale-95 select-none ${
        onClick ? 'cursor-pointer hover:border-primary/40' : ''
      } ${className}`}
    >
      <div className="w-10 h-10 flex items-center justify-center mb-1">
        <TopIcon name={name} size="md" />
      </div>
      <span className="text-[10px] font-extrabold text-deep leading-tight max-w-[70px]">
        {label}
      </span>
    </div>
  )
}

export default TopIcon
