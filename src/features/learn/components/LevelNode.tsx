// src/features/learn/components/LevelNode.tsx
// Nó como Ilha Flutuante V2 (island-done, island-current, island-rock) com sobreposições em código
import React from 'react'

export type LevelNodeStatus =
  | 'completed'
  | 'current'
  | 'locked'
  | 'chest'
  | 'chest_claimed'
  | 'trophy'
  | 'trophy_completed'

interface LevelNodeProps {
  levelNumber: number
  title: string
  status: LevelNodeStatus
  size_w?: number
  size_h?: number
  size?: number // retrocompatibilidade
  stars?: number // 1 a 3 estrelas para nível concluído
  isFirstLocked?: boolean
  isUnlocking?: boolean
  onClick: () => void
  style?: React.CSSProperties
  className?: string
}

export const LevelNode: React.FC<LevelNodeProps> = ({
  levelNumber,
  title,
  status,
  size_w = 112,
  size_h = 88,
  size,
  stars = 3,
  isFirstLocked = false,
  isUnlocking = false,
  onClick,
  style = {},
  className = '',
}) => {
  const isLocked = status === 'locked'
  const isCurrent = status === 'current'
  const isCompleted = status === 'completed'
  const isChest = status === 'chest' || status === 'chest_claimed'
  const isTrophy = status === 'trophy' || status === 'trophy_completed'

  const effectiveW = isCurrent ? 140 : size_w || size || 112
  const effectiveH = isCurrent ? 108 : size_h || size || 88

  // Classes de flutuação em fases distintas (respeitando prefers-reduced-motion)
  const floatClass = isCurrent
    ? 'animate-island-1'
    : levelNumber % 3 === 0
    ? 'animate-island-0'
    : levelNumber % 3 === 1
    ? 'animate-island-1'
    : 'animate-island-2'

  // Asset de ilha correspondente
  const getIslandSrc = () => {
    if (isLocked) return '/assets/learn/island-rock.webp'
    if (isCurrent) return '/assets/learn/island-current.webp'
    return '/assets/learn/island-done.webp'
  }

  let ariaLabel = `Nível ${levelNumber}: ${title}`
  if (isCurrent) ariaLabel += ' (Nível Atual - Começar)'
  else if (isCompleted) ariaLabel += ' (Concluído)'
  else if (isLocked) ariaLabel += ' (Bloqueado)'
  else if (isChest) ariaLabel += ' (Baú de Tesouro)'
  else if (isTrophy) ariaLabel += ' (Troféu da Trilha)'

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      style={{
        width: `${effectiveW}px`,
        ...style,
      }}
      className={`absolute z-10 flex flex-col items-center select-none cursor-pointer group transition-transform active:scale-95 ${
        isLocked ? 'cursor-not-allowed opacity-90' : ''
      } ${className}`}
    >
      {/* Ilha flutuante e sobreposições */}
      <div
        className={`relative flex items-center justify-center ${floatClass} ${
          isUnlocking ? 'animate-unlock-glow' : ''
        }`}
        style={{
          width: `${effectiveW}px`,
          height: `${effectiveH}px`,
        }}
      >
        {/* Imagem da ilha */}
        <img
          src={getIslandSrc()}
          alt=""
          className="w-full h-full object-contain pointer-events-none drop-shadow-md"
          loading="lazy"
        />

        {/* 1. Nível Concluído: Selo verde de check no topo da ilha */}
        {isCompleted && (
          <div className="absolute top-1 left-1/2 -translate-x-1/2 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-[#15803D] border-2 border-white flex items-center justify-center shadow-md">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        )}

        {/* 2. Nível Atual: Círculo roxo com número e rótulo "Atual" */}
        {isCurrent && (
          <>
            <div className="absolute top-2 left-1/2 -translate-x-1/2 flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-b from-[#7D2BD6] via-[#6D28C9] to-[#5B21B6] border-2 border-white text-white flex flex-col items-center justify-center shadow-lg animate-pulseGlow">
                <span className="font-nunito font-black text-[18px] leading-none">
                  {levelNumber}
                </span>
                <span className="text-[7.5px] font-extrabold uppercase tracking-wider text-purple-200 leading-none mt-0.5">
                  Atual
                </span>
              </div>
            </div>

            {/* Moeda decorativa (coin-1) ao lado do nó atual */}
            <img
              src="/assets/coins/coin-1.png"
              alt=""
              className="w-7 h-7 object-contain absolute -right-2 top-2 drop-shadow-sm pointer-events-none animate-bounce-subtle"
              width={28}
              height={28}
            />
          </>
        )}

        {/* 3. Bloqueado: Cadeado sobre a pedra */}
        {isLocked && !isChest && !isTrophy && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center justify-center">
            <img
              src="/assets/icons/icon-cadeado.png"
              alt="Bloqueado"
              className="w-7 h-7 object-contain opacity-80 drop-shadow-xs"
              width={28}
              height={28}
            />
          </div>
        )}

        {/* 4. Baú de Tesouro */}
        {isChest && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center justify-center">
            <img
              src={
                status === 'chest_claimed'
                  ? '/assets/icons/icon-bau-aberto.png'
                  : '/assets/icons/icon-bau.png'
              }
              alt="Baú de moedas"
              className={`w-9 h-9 object-contain drop-shadow ${
                status === 'chest_claimed' ? 'opacity-80' : 'animate-bounce-subtle'
              }`}
              width={36}
              height={36}
            />
          </div>
        )}

        {/* 5. Troféu Final */}
        {isTrophy && (
          <div className="absolute top-1 left-1/2 -translate-x-1/2 flex items-center justify-center">
            <img
              src="/assets/icons/icon-trofeu.png"
              alt="Troféu da Trilha"
              className="w-9 h-9 object-contain drop-shadow animate-bounce-subtle"
              width={36}
              height={36}
            />
          </div>
        )}
      </div>

      {/* Rótulo abaixo da ilha */}
      <div className="w-full flex flex-col items-center text-center mt-0.5">
        {/* Nível Concluído: 1 a 3 estrelas douradas de maestria + título do nível */}
        {isCompleted && (
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-0.5 -mt-1 mb-0.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <img
                  key={i}
                  src="/assets/icons/icon-goal-star.webp"
                  alt=""
                  className={`w-3.5 h-3.5 object-contain ${
                    i < stars ? 'opacity-100 drop-shadow-xs' : 'opacity-25 grayscale'
                  }`}
                  width={14}
                  height={14}
                />
              ))}
            </div>
            <span className="text-[11px] font-extrabold text-[#432171] leading-tight line-clamp-2 max-w-[120px]">
              {title}
            </span>
          </div>
        )}

        {/* Primeiro bloqueado: rótulo "Próxima etapa bloqueada" */}
        {isLocked && isFirstLocked && (
          <span className="inline-block text-[10px] font-extrabold text-[#7D6A9C] bg-white/80 px-2 py-0.5 rounded-full border border-lilac/25 leading-tight shadow-2xs mt-0.5">
            Próxima etapa bloqueada
          </span>
        )}
      </div>
    </div>
  )
}
export default LevelNode
