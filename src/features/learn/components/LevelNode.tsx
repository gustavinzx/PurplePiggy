// src/features/learn/components/LevelNode.tsx
// Nó circular 3D tátil do Mapa Sinuoso (Desafio Piggy - Dimensões e Posição Absoluta)
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
  size: number
  onClick: () => void
  style?: React.CSSProperties
  className?: string
}

export const LevelNode: React.FC<LevelNodeProps> = ({
  levelNumber,
  title,
  status,
  size,
  onClick,
  style = {},
  className = '',
}) => {
  const isLocked = status === 'locked'
  const isCurrent = status === 'current'
  const isCompleted = status === 'completed'
  const isChest = status === 'chest' || status === 'chest_claimed'
  const isTrophy = status === 'trophy' || status === 'trophy_completed'

  let ariaLabel = `Nível ${levelNumber}: ${title}`
  if (isCurrent) ariaLabel += ' (Nível Atual - Começar)'
  else if (isCompleted) ariaLabel += ' (Concluído)'
  else if (isLocked) ariaLabel += ' (Bloqueado)'
  else if (isChest) ariaLabel += ' (Baú de Tesouro)'
  else if (isTrophy) ariaLabel += ' (Troféu da Trilha)'

  // Renderização do conteúdo interno (sempre contido DENTRO do círculo do nó)
  const renderContent = () => {
    if (isCompleted) {
      return (
        <img
          src="/assets/icons/icon-check-nivel.png"
          alt="Concluído"
          className="w-6 h-6 object-contain drop-shadow"
          loading="lazy"
          width={24}
          height={24}
        />
      )
    }

    if (isCurrent) {
      return (
        <span className="font-nunito font-black text-xl text-white drop-shadow-sm">
          {levelNumber}
        </span>
      )
    }

    if (isChest) {
      const isClaimed = status === 'chest_claimed'
      return (
        <img
          src={isClaimed ? '/assets/icons/icon-bau-aberto.png' : '/assets/icons/icon-bau.png'}
          alt="Baú"
          className={`w-7 h-7 object-contain drop-shadow ${
            isClaimed ? 'opacity-80' : 'animate-bounce-subtle'
          }`}
          loading="lazy"
          width={28}
          height={28}
        />
      )
    }

    if (isTrophy) {
      return (
        <img
          src="/assets/icons/icon-trofeu.png"
          alt="Troféu"
          className="w-7 h-7 object-contain drop-shadow"
          loading="lazy"
          width={24}
          height={24}
        />
      )
    }

    // Bloqueado: o cadeado fica DENTRO do nó, não flutuando
    return (
      <img
        src="/assets/icons/icon-cadeado.png"
        alt="Bloqueado"
        className="w-5 h-5 object-contain opacity-70"
        loading="lazy"
        width={20}
        height={20}
      />
    )
  }

  // Estilos da base circular tátil com bisel 3D
  const getNodeStyles = () => {
    if (isCurrent) {
      return 'bg-gradient-to-b from-[#8E2DE2] to-[#7D2BD6] border-[#7D2BD6] border-b-[5px] border-b-[#5B21B6] shadow-md shadow-purple-500/30'
    }
    if (isCompleted) {
      return 'bg-[#7D2BD6] border-[#6D28D9] border-b-[5px] border-b-[#5B21B6] shadow-sm shadow-purple-900/10'
    }
    if (isChest) {
      if (status === 'chest_claimed') {
        return 'bg-[#F3E8FF] border-[#E9D5FF] border-b-[4px] border-b-[#D8B4FE]'
      }
      return 'bg-gradient-to-b from-[#FCD34D] to-[#F59E0B] border-[#F59E0B] border-b-[5px] border-b-[#D97706] shadow-md shadow-amber-500/25'
    }
    if (isTrophy) {
      if (status === 'trophy_completed') {
        return 'bg-gradient-to-b from-[#F59E0B] to-[#D97706] border-[#D97706] border-b-[5px] border-b-[#B45309] shadow-md shadow-amber-600/30'
      }
      return 'bg-[#F3E8FF] border-[#E9D5FF] border-b-[4px] border-b-[#D8B4FE]'
    }
    // Locked
    return 'bg-[#F3E8FF] border-[#E9D5FF] border-b-[4px] border-b-[#DDD6FE] cursor-not-allowed opacity-85'
  }

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        ...style,
      }}
      className="absolute flex items-center justify-center select-none z-10"
    >
      {/* Pedestal / Ilha flutuante 3D embaixo do nó */}
      <div
        className="absolute -bottom-2 w-[124%] h-5 rounded-full bg-gradient-to-b from-[#EEDEFB] via-[#DFC6FF] to-[#C49BFA]/70 shadow-sm -z-10 pointer-events-none"
        aria-hidden="true"
      />

      <button
        type="button"
        aria-label={ariaLabel}
        onClick={onClick}
        style={{
          width: `${size}px`,
          height: `${size}px`,
        }}
        className={`w-full h-full rounded-full flex items-center justify-center transition-all duration-150 select-none ${getNodeStyles()} ${
          !isLocked
            ? 'active:translate-y-[2px] active:border-b-[2px] cursor-pointer'
            : 'active:scale-95'
        } ${className}`}
      >
        {renderContent()}
      </button>

      {/* Badge ou etiqueta de status */}
      {isCurrent && (
        <span className="absolute -bottom-5.5 bg-[#432171] text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-xs border border-purple-300 whitespace-nowrap pointer-events-none z-20">
          Atual
        </span>
      )}
      {isCompleted && (
        <span className="absolute -bottom-5.5 bg-white text-[#15803D] text-[9px] font-black tracking-wider px-2 py-0.5 rounded-full shadow-xs border border-green-200 whitespace-nowrap pointer-events-none z-20 flex items-center gap-0.5">
          ✓ Concluído
        </span>
      )}
      {isLocked && !isChest && !isTrophy && (
        <span className="absolute -bottom-5 bg-white/95 text-[#7D6A9C] text-[8px] font-bold px-1.5 py-0.5 rounded-full border border-purple-100 whitespace-nowrap pointer-events-none opacity-80">
          Bloqueado
        </span>
      )}
    </div>
  )
}

export default LevelNode
