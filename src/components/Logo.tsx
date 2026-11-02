import React from 'react'

interface LogoProps {
  variant?: 'dark' | 'light' | 'icon'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export const Logo: React.FC<LogoProps> = ({ variant = 'dark', size = 'md', className = '' }) => {
  const sizeMap = {
    sm: { img: 'w-6 h-6', text: 'text-xl' },
    md: { img: 'w-9 h-9', text: 'text-2xl' },
    lg: { img: 'w-12 h-12', text: 'text-3xl' },
    xl: { img: 'w-16 h-16', text: 'text-4xl' },
  }

  const currentSize = sizeMap[size]

  if (variant === 'icon') {
    return (
      <img
        src="/assets/pig-oficial-512.png"
        alt="PurplePiggy"
        className={`${currentSize.img} object-contain ${className}`}
      />
    )
  }

  const isLight = variant === 'light'

  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      <img
        src="/assets/pig-oficial-512.png"
        alt="PurplePiggy"
        className={`${currentSize.img} object-contain transition-transform hover:scale-105`}
      />
      <span className={`font-extrabold tracking-tight ${currentSize.text} leading-none font-sans`}>
        <span className={isLight ? 'text-white' : 'text-deep'}>Purple</span>
        <span className="text-primary">Piggy</span>
      </span>
    </div>
  )
}
