import React from 'react'

export interface LogoProps {
  variant?: 'stacked' | 'inline' | 'icon'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showIcon?: boolean
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'inline',
  size = 'md',
  className = '',
  showIcon = true,
}) => {
  const sizeMap = {
    sm: { img: 'w-7 h-7', width: 28, height: 28, text: 'text-xl' },
    md: { img: 'w-10 h-10', width: 40, height: 40, text: 'text-2xl' },
    lg: { img: 'w-14 h-14', width: 56, height: 56, text: 'text-3xl' },
    xl: { img: 'w-20 h-20', width: 80, height: 80, text: 'text-4xl' },
  }

  const currentSize = sizeMap[size]

  if (variant === 'icon') {
    return (
      <img
        src="/assets/brand/pig-oficial-512.png"
        alt="PurplePiggy"
        width={currentSize.width}
        height={currentSize.height}
        style={{ aspectRatio: '1 / 1' }}
        className={`${currentSize.img} object-contain ${className}`}
        loading="eager"
        fetchPriority="high"
        decoding="async"
      />
    )
  }

  const isStacked = variant === 'stacked'

  return (
    <div
      className={`inline-flex ${
        isStacked ? 'flex-col items-center gap-1.5 text-center' : 'items-center gap-2.5'
      } select-none ${className}`}
    >
      {showIcon && (
        <img
          src="/assets/brand/pig-oficial-512.png"
          alt="PurplePiggy Logo"
          width={currentSize.width}
          height={currentSize.height}
          style={{ aspectRatio: '1 / 1' }}
          className={`${currentSize.img} object-contain transition-transform duration-300 hover:scale-105`}
          loading="eager"
          fetchPriority="high"
          decoding="async"
        />
      )}
      <div className={`font-extrabold font-sans tracking-tight ${currentSize.text} leading-none flex items-center`}>
        <span className="text-deep">Purple</span>
        <span className="bg-gradient-to-r from-brand-piggy-start to-brand-piggy-end bg-clip-text text-transparent ml-0.5">
          Piggy
        </span>
      </div>
    </div>
  )
}

export default Logo
