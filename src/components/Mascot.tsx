import React from 'react'

interface MascotProps {
  accessory?: 'none' | 'floating' | 'graduate' | 'idea' | 'coins'
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero'
  className?: string
  alt?: string
}

export const Mascot: React.FC<MascotProps> = ({
  accessory = 'none',
  size = 'md',
  className = '',
  alt = 'Porquinho mascote do PurplePiggy',
}) => {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-32 h-32',
    xl: 'w-48 h-48',
    hero: 'w-60 h-60',
  }

  const dimension = sizeClasses[size]

  return (
    <div className={`relative inline-block select-none ${className}`}>
      {/* Adereço: Capelo de formatura (composto ao redor da mascote) */}
      {accessory === 'graduate' && (
        <div className="absolute -top-3 -right-2 z-10 animate-bounce duration-1000">
          <svg className="w-10 h-10 text-deep drop-shadow-md" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3L1 9L12 15L21 10.09V17H23V9M5 13.18V17.18C5 19.94 8.13 22 12 22C15.87 22 19 19.94 19 17.18V13.18L12 17L5 13.18Z" />
          </svg>
        </div>
      )}

      {/* Adereço: Lâmpada de ideia (composto ao redor da mascote) */}
      {accessory === 'idea' && (
        <div className="absolute -top-4 -right-1 z-10 animate-pulse">
          <div className="bg-gold rounded-full p-2 shadow-lg border-2 border-white">
            <svg className="w-6 h-6 text-deep" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9C5 11.38 6.19 13.47 8 14.74V17C8 17.55 8.45 18 9 18H15C15.55 18 16 17.55 16 17V14.74C17.81 13.47 19 11.38 19 9C19 5.13 15.87 2 12 2M9 21C9 21.55 9.45 22 10 22H14C14.55 22 15 21.55 15 21V20H9V21Z" />
            </svg>
          </div>
        </div>
      )}

      {/* Mascote oficial intacto */}
      <img
        src="/assets/pig-oficial-512.png"
        alt={alt}
        className={`${dimension} object-contain transition-transform duration-300 ${
          accessory === 'floating' ? 'animate-bounce' : ''
        }`}
        style={{ animationDuration: '3s' }}
      />
    </div>
  )
}
