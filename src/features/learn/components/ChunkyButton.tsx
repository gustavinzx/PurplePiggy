// src/features/learn/components/ChunkyButton.tsx
// Botão Chunky com física tátil 3D e feedback tátil (tokens de design/tokens.md Seção 7)

import React from 'react'

export type ChunkyButtonVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'danger'
  | 'neutral'

export type ChunkyButtonSize = 'sm' | 'md' | 'lg' | 'full'

export interface ChunkyButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ChunkyButtonVariant
  size?: ChunkyButtonSize
  loading?: boolean
}

const VARIANT_STYLES: Record<ChunkyButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-[#7D2BD6] to-[#8E2DE2] text-white border-2 border-[#7D2BD6] border-b-[4px] border-b-[#5B21B6] hover:brightness-105 active:border-b-[2px] active:translate-y-[2px]',
  success:
    'bg-[#2FBF71] text-white border-2 border-[#2FBF71] border-b-[4px] border-b-[#1E824C] hover:brightness-105 active:border-b-[2px] active:translate-y-[2px]',
  danger:
    'bg-[#E5487A] text-white border-2 border-[#E5487A] border-b-[4px] border-b-[#BE185D] hover:brightness-105 active:border-b-[2px] active:translate-y-[2px]',
  secondary:
    'bg-white text-[#432171] border-2 border-[#D8C2FF] border-b-[4px] border-b-[#5B21B6] hover:bg-[#F9F5FF] active:border-b-[2px] active:translate-y-[2px]',
  neutral:
    'bg-white text-[#432171] border-2 border-[#EADFFB] border-b-[4px] border-b-[#D8C2FF] hover:bg-[#F9F5FF] active:border-b-[2px] active:translate-y-[2px]',
}

const DISABLED_STYLE =
  'bg-[#E8DEFB] text-[#9CA3AF] border-2 border-[#E8DEFB] border-b-[4px] border-b-[#D8C2FF] cursor-not-allowed select-none active:translate-y-0 active:border-b-[4px]'

const SIZE_STYLES: Record<ChunkyButtonSize, string> = {
  sm: 'h-10 px-4 text-xs rounded-xl',
  md: 'h-12 px-6 text-sm rounded-2xl',
  lg: 'h-14 px-8 text-base rounded-2xl',
  full: 'w-full h-14 px-6 text-base rounded-2xl',
}

export const ChunkyButton: React.FC<ChunkyButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  ...props
}) => {
  const isButtonDisabled = disabled || loading
  const variantClass = isButtonDisabled ? DISABLED_STYLE : VARIANT_STYLES[variant]
  const sizeClass = SIZE_STYLES[size]

  return (
    <button
      disabled={isButtonDisabled}
      className={`relative inline-flex items-center justify-center font-extrabold uppercase tracking-wide select-none transition-all duration-75 outline-none focus-visible:ring-2 focus-visible:ring-[#7D2BD6] focus-visible:ring-offset-2 ${variantClass} ${sizeClass} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
      ) : null}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </button>
  )
}
