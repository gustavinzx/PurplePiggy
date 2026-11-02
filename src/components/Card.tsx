import React from 'react'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'white' | 'baby' | 'gradient'
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'white',
  className = '',
  ...props
}) => {
  const variantStyles = {
    white: 'bg-white text-deep shadow-card border border-lilac/10',
    baby: 'bg-baby text-deep shadow-sm border border-blue-100',
    gradient: 'bg-gradient-to-br from-primary to-deep text-white shadow-soft',
  }

  return (
    <div
      className={`rounded-[22px] p-5 transition-all duration-200 ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
