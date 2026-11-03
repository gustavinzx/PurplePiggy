import React, { useState } from 'react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  icon?: React.ReactNode
  error?: string
}

/**
 * Componente Input canônico do PurplePiggy:
 * - Fundo branco puro.
 * - Ícone roxo à esquerda com traço arredondado.
 * - Borda lilás fina e cantos arredondados (raio grande de 16px / rounded-2xl).
 * - Variante senha com botão de olho para alternar visibilidade.
 * - Foco com anel roxo suave (ring-4 ring-primary/15).
 * - Estado de erro com borda rosa-vermelha e mensagem descritiva.
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, icon, error, type = 'text', className = '', ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false)
    const isPasswordType = type === 'password'
    const inputType = isPasswordType ? (showPassword ? 'text' : 'password') : type

    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs font-bold text-deep mb-1.5 font-sans">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-3.5 flex items-center justify-center text-btn-primary-start pointer-events-none z-10">
              {icon}
            </div>
          )}

          <input
            ref={ref}
            type={inputType}
            className={`w-full h-12 bg-white text-deep font-sans rounded-input border transition-all duration-200 outline-none placeholder:text-textSec/50 text-[14px] font-semibold ${
              icon ? 'pl-11' : 'pl-4'
            } ${isPasswordType ? 'pr-11' : 'pr-4'} ${
              error
                ? 'border-danger focus:border-danger focus:ring-4 focus:ring-danger/15'
                : 'border-border-input hover:border-primary/50 focus:border-primary focus:ring-4 focus:ring-primary/15'
            } ${className}`}
            {...props}
          />

          {isPasswordType && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 p-1 text-textSec hover:text-deep transition-colors focus:outline-none"
              tabIndex={-1}
              aria-label={showPassword ? 'Ocultar senha' : 'Ver senha'}
            >
              {showPassword ? (
                // SVG Olho Fechado (EyeOff) traço arredondado canônico
                <svg
                  className="w-5 h-5 text-textSec"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                  <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                  <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                  <line x1="2" y1="2" x2="22" y2="22" />
                </svg>
              ) : (
                // SVG Olho Aberto (Eye) traço arredondado canônico
                <svg
                  className="w-5 h-5 text-textSec"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          )}
        </div>

        {error && (
          <p className="mt-1 text-xs text-danger font-bold font-sans ml-2 animate-fadeIn">
            {error}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
