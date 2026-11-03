import React from 'react'

export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  description?: string
  card?: boolean
}

/**
 * Componente Radio canônico do PurplePiggy:
 * - Não selecionado: círculo branco com borda lilás suave (border-2 border-lilac/50).
 * - Selecionado: bolinha roxa preenchida (bg-primary border-primary) com miolo branco centralizado.
 * - Suporta variante card (RadioCard) idêntica às opções do Diagnóstico (tela 05).
 */
export const Radio: React.FC<RadioProps> = ({
  label,
  description,
  card = false,
  checked,
  disabled,
  className = '',
  onChange,
  ...props
}) => {
  const radioIndicator = (
    <div
      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${
        checked
          ? 'border-primary bg-primary shadow-xs'
          : 'border-lilac/60 bg-white hover:border-primary/60'
      } ${disabled ? 'opacity-50' : ''}`}
    >
      {checked && <div className="w-2 h-2 rounded-full bg-white shadow-xs animate-scaleIn" />}
    </div>
  )

  if (card) {
    return (
      <label
        className={`relative flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 cursor-pointer select-none ${
          checked
            ? 'bg-primary/5 border-primary shadow-xs ring-2 ring-primary/20'
            : 'bg-white border-border-input hover:border-primary/40 hover:bg-bg/40'
        } ${disabled ? 'opacity-50 pointer-events-none' : ''} ${className}`}
      >
        <input
          type="radio"
          checked={checked}
          disabled={disabled}
          onChange={onChange}
          className="sr-only"
          {...props}
        />
        <div className="flex flex-col pr-3">
          {label && <span className="text-sm font-extrabold text-deep">{label}</span>}
          {description && <span className="text-xs font-semibold text-textSec mt-0.5">{description}</span>}
        </div>
        {radioIndicator}
      </label>
    )
  }

  return (
    <label
      className={`inline-flex items-center gap-2.5 cursor-pointer select-none ${
        disabled ? 'opacity-50 pointer-events-none' : ''
      } ${className}`}
    >
      <input
        type="radio"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className="sr-only"
        {...props}
      />
      {radioIndicator}
      {label && <span className="text-sm font-bold text-deep font-sans">{label}</span>}
    </label>
  )
}

export default Radio
