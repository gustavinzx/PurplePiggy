import React from 'react'

export type CategoryIconName =
  | 'cat-moradia'
  | 'cat-alimentacao'
  | 'cat-transporte'
  | 'cat-saude'
  | 'cat-educacao'
  | 'cat-lazer'
  | 'cat-compras'
  | 'cat-cuidados-familia'
  | 'cat-outros'
  | 'moradia'
  | 'alimentacao'
  | 'transporte'
  | 'saude'
  | 'educacao'
  | 'lazer'
  | 'compras'
  | 'cuidados-familia'
  | 'outros'

export interface CategoryIconProps {
  name: CategoryIconName
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  alt?: string
}

const CATEGORY_ALTS: Record<string, string> = {
  'cat-moradia': 'Categoria Moradia',
  'cat-alimentacao': 'Categoria Alimentação',
  'cat-transporte': 'Categoria Transporte',
  'cat-saude': 'Categoria Saúde',
  'cat-educacao': 'Categoria Educação',
  'cat-lazer': 'Categoria Lazer',
  'cat-compras': 'Categoria Compras',
  'cat-cuidados-familia': 'Categoria Cuidados com a Família',
  'cat-outros': 'Categoria Outros',
}

const SIZE_MAP = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-10 h-10',
  xl: 'w-14 h-14',
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  name,
  size = 'md',
  className = '',
  alt,
}) => {
  const normalized = name.startsWith('cat-') ? name : `cat-${name}`
  const src = `/assets/icons/${normalized}.png`
  const resolvedAlt = alt || CATEGORY_ALTS[normalized] || `Ícone de categoria ${normalized}`

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

export interface CategoryTileProps {
  name: CategoryIconName
  label?: string
  size?: 'sm' | 'md' | 'lg'
  bgColor?: string
  className?: string
  selected?: boolean
  onClick?: () => void
}

/**
 * Tile de Categoria do PurplePiggy:
 * Quadrado arredondado lilás claro (rounded-2xl) com o PNG da categoria centralizado.
 */
export const CategoryTile: React.FC<CategoryTileProps> = ({
  name,
  label,
  size = 'md',
  bgColor,
  className = '',
  selected = false,
  onClick,
}) => {
  const tileSizes = {
    sm: 'w-10 h-10 p-1.5',
    md: 'w-12 h-12 p-2',
    lg: 'w-14 h-14 p-2.5',
  }

  const iconSizes = {
    sm: 'sm' as const,
    md: 'md' as const,
    lg: 'lg' as const,
  }

  return (
    <div
      onClick={onClick}
      className={`inline-flex flex-col items-center gap-1 select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <div
        className={`${tileSizes[size]} rounded-2xl flex items-center justify-center transition-all ${
          selected
            ? 'bg-primary/20 ring-2 ring-primary shadow-xs'
            : bgColor
            ? ''
            : 'bg-[#F3E8FF] hover:bg-[#EBD8FF]'
        }`}
        style={bgColor ? { backgroundColor: bgColor } : undefined}
      >
        <CategoryIcon name={name} size={iconSizes[size]} />
      </div>
      {label && (
        <span className="text-[11px] font-bold text-deep leading-tight text-center max-w-[64px] truncate">
          {label}
        </span>
      )}
    </div>
  )
}

export default CategoryIcon
