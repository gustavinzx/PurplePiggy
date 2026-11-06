import React from 'react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'destructive' | 'link' | 'ghost' | 'pink'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  loading?: boolean
  icon?: React.ReactNode
}

/**
 * Componente Button canônico do PurplePiggy.
 * 100% customizado, sem bibliotecas externas:
 * - Primário: formato pílula (rounded-full), degradê roxo horizontal, texto branco bold, sombra suave e sutil brilho superior.
 * - Secundário: usa o rosa oficial #FF79A8.
 * - Destrutivo: fundo branco com contorno rosa-vermelho e texto rosa-vermelho bold.
 * - Link: texto puro sem moldura (ex: "Entrar", "Já tem uma conta? Entrar").
 * Estados: active:scale-[0.98], disabled e loading com spinner.
 */
export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const isLink = variant === 'link'

  const baseStyles = isLink
    ? 'inline-flex items-center justify-center font-bold font-sans text-deep hover:text-primary hover:underline transition-colors duration-150 select-none p-0 h-auto disabled:opacity-50 disabled:pointer-events-none'
    : 'relative inline-flex items-center justify-center font-extrabold font-sans rounded-pill transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 select-none overflow-hidden cursor-pointer'

  const sizeStyles = isLink
    ? {
        sm: 'text-xs gap-1',
        md: 'text-sm gap-1.5',
        lg: 'text-base gap-2',
      }
    : {
        sm: 'h-9 px-4 text-xs gap-1.5',
        md: 'h-12 px-6 text-[15px] gap-2', // 48px canônico do layout
        lg: 'h-14 px-8 text-base gap-2.5',
      }

  const variantStyles = {
    primary:
      'bg-gradient-to-r from-btn-primary-start to-btn-primary-end text-white shadow-button border-t border-white/25 hover:brightness-105 active:shadow-none active:brightness-95',
    secondary:
      'bg-[#FF79A8] text-white border-2 border-[#FF79A8] shadow-[0_6px_16px_rgba(255,121,168,0.3)] hover:bg-[#FF6096] active:brightness-95',
    outline:
      'border-2 border-[#FF79A8] bg-[#FFF0F6] text-[#D6336C] hover:bg-[#FF79A8] hover:text-white active:brightness-95',
    destructive:
      'border-2 border-danger bg-white text-danger hover:bg-danger/5 active:bg-danger/10',
    pink:
      'bg-[#FF79A8] text-white hover:bg-[#FF6096] shadow-[0_6px_16px_rgba(255,121,168,0.3)] active:brightness-95',
    ghost:
      'text-deep hover:bg-lilac/10 active:bg-lilac/20',
    link: '',
  }

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${
        fullWidth && !isLink ? 'w-full' : ''
      } ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>Carregando...</span>
        </span>
      ) : (
        <>
          {icon && <span className="inline-flex shrink-0 items-center justify-center">{icon}</span>}
          <span>{children}</span>
        </>
      )}
    </button>
  )
}

export default Button
