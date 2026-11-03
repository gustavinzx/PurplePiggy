import React from 'react'

export interface SelectOption {
  value: string | number
  label: string
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options?: SelectOption[]
  icon?: React.ReactNode
  error?: string
}

/**
 * Componente Select canônico do PurplePiggy:
 * - Fundo branco puro.
 * - Seta chevron arredondada roxa no lado direito.
 * - Borda lilás fina e cantos arredondados (16px / rounded-input).
 * - Foco com anel roxo suave (ring-4 ring-primary/15).
 */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options = [], icon, error, children, className = '', ...props }, ref) => {
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

          <select
            ref={ref}
            className={`w-full h-12 bg-white text-deep font-sans rounded-input border transition-all duration-200 outline-none text-[14px] font-semibold appearance-none pr-10 cursor-pointer ${
              icon ? 'pl-11' : 'pl-4'
            } ${
              error
                ? 'border-danger focus:border-danger focus:ring-4 focus:ring-danger/15'
                : 'border-border-input hover:border-primary/50 focus:border-primary focus:ring-4 focus:ring-primary/15'
            } ${className}`}
            {...props}
          >
            {options.length > 0
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))
              : children}
          </select>

          {/* Seta Chevron customizada com traço arredondado roxo */}
          <div className="absolute right-3.5 pointer-events-none flex items-center justify-center text-btn-primary-start">
            <svg
              className="w-4 h-4 text-btn-primary-start"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
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

Select.displayName = 'Select'

export default Select
