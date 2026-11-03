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
  name: CategoryIconName | string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
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
  xs: 'w-5 h-5',
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-10 h-10',
  xl: 'w-14 h-14',
}

/**
 * Converte qualquer identificador de categoria (slug, nome em pt-BR ou ícone legado)
 * para o asset PNG canônico em public/assets/icons/cat-*.png.
 */
export const resolveCategoryIconName = (nameOrSlug?: string): CategoryIconName => {
  if (!nameOrSlug) return 'cat-outros'
  const clean = nameOrSlug.toLowerCase().trim()

  if (clean.includes('mora') || clean === 'home') return 'cat-moradia'
  if (
    clean.includes('alimen') ||
    clean.includes('mercado') ||
    clean.includes('superm') ||
    clean === 'shoppingcart'
  )
    return 'cat-alimentacao'
  if (clean.includes('transp') || clean === 'bus') return 'cat-transporte'
  if (clean.includes('saud') || clean.includes('saúde') || clean === 'heartpulse')
    return 'cat-saude'
  if (
    clean.includes('fam') ||
    clean.includes('cuidado') ||
    clean === 'users'
  )
    return 'cat-cuidados-familia'
  if (clean.includes('educ') || clean === 'graduationcap') return 'cat-educacao'
  if (clean.includes('lazer') || clean === 'sparkles') return 'cat-lazer'
  if (clean.includes('comp') || clean === 'shoppingbag') return 'cat-compras'
  if (clean.startsWith('cat-')) return clean as CategoryIconName
  return 'cat-outros'
}

/**
 * Cores de fundo pastel fiéis ao layout de design (design/telas/07-gastos.png)
 * para os círculos de categoria.
 */
export const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  'cat-moradia': { bg: '#FFE4E6', text: '#E11D48' }, // Rosa suave (ex.: Aluguel no layout)
  'cat-alimentacao': { bg: '#FFEDD5', text: '#EA580C' }, // Pêssego suave (ex.: Supermercado)
  'cat-transporte': { bg: '#E0F2FE', text: '#0284C7' }, // Azul céu suave
  'cat-saude': { bg: '#FCE7F3', text: '#DB2777' }, // Rosa magenta suave
  'cat-cuidados-familia': { bg: '#F3E8FF', text: '#9333EA' }, // Lilás suave
  'cat-educacao': { bg: '#EDE9FE', text: '#7C3AED' }, // Violeta suave
  'cat-lazer': { bg: '#FEF3C7', text: '#D97706' }, // Amarelo dourado suave
  'cat-compras': { bg: '#E0E7FF', text: '#4F46E5' }, // Índigo suave
  'cat-outros': { bg: '#F1F5F9', text: '#64748B' }, // Cinza ardósia suave
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  name,
  size = 'md',
  className = '',
  alt,
}) => {
  const canonical = resolveCategoryIconName(name)
  const normalized = canonical.startsWith('cat-') ? canonical : `cat-${canonical}`
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

export interface CategoryCircleProps {
  name: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
  alt?: string
}

/**
 * Círculo de Categoria oficial do PurplePiggy:
 * Círculo arredondado perfeito com fundo pastel suave e o PNG 3D da categoria centralizado,
 * exatamente igual ao layout de design/telas/07-gastos.png.
 */
export const CategoryCircle: React.FC<CategoryCircleProps> = ({
  name,
  size = 'md',
  className = '',
  alt,
}) => {
  const canonical = resolveCategoryIconName(name)
  const color = CATEGORY_COLORS[canonical] || CATEGORY_COLORS['cat-outros']

  const sizeClasses = {
    sm: 'w-9 h-9',
    md: 'w-11 h-11',
    lg: 'w-14 h-14',
  }[size]

  const iconSizes = {
    sm: 'xs' as const,
    md: 'sm' as const,
    lg: 'md' as const,
  }[size]

  return (
    <div
      className={`${sizeClasses} rounded-full flex items-center justify-center shrink-0 shadow-xs ${className}`}
      style={{ backgroundColor: color.bg }}
    >
      <CategoryIcon name={canonical} size={iconSizes} alt={alt} />
    </div>
  )
}

export interface CategoryTileProps {
  name: CategoryIconName | string
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

  const canonical = resolveCategoryIconName(name)

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
        <CategoryIcon name={canonical} size={iconSizes[size]} />
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
