// src/features/learn/components/LevelNode.tsx
// Nó circular 3D tátil do Mapa Sinuoso (Desafio Piggy)
import React from 'react'
import { Mascot } from '../../../components/Mascot'

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
  onClick: () => void
  className?: string
}

export const LevelNode: React.FC<LevelNodeProps> = ({
  levelNumber,
  title,
  status,
  onClick,
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

  // Renderização do conteúdo interno de acordo com o status
  const renderContent = () => {
    if (isCompleted) {
      return (
        <div className="flex flex-col items-center justify-center">
          <img
            src="/assets/icons/icon-check-nivel.png"
            alt="Concluído"
            className="w-8 h-8 object-contain drop-shadow"
            loading="lazy"
            width={32}
            height={32}
          />
        </div>
      )
    }

    if (isCurrent) {
      return (
        <div className="flex flex-col items-center justify-center">
          <span className="font-nunito font-black text-2xl text-white drop-shadow-sm">
            {levelNumber}
          </span>
        </div>
      )
    }

    if (isChest) {
      const isClaimed = status === 'chest_claimed'
      return (
        <div className="flex flex-col items-center justify-center">
          <img
            src={isClaimed ? '/assets/icons/icon-bau-aberto.png' : '/assets/icons/icon-bau.png'}
            alt="Baú de moedas"
            className={`w-9 h-9 object-contain drop-shadow ${
              isClaimed ? 'opacity-80' : 'animate-bounce-subtle'
            }`}
            loading="lazy"
            width={36}
            height={36}
          />
        </div>
      )
    }

    if (isTrophy) {
      return (
        <div className="flex flex-col items-center justify-center">
          <img
            src="/assets/icons/icon-trofeu.png"
            alt="Troféu"
            className="w-10 h-10 object-contain drop-shadow"
            loading="lazy"
            width={40}
            height={40}
          />
        </div>
      )
    }

    // Locked
    return (
      <div className="flex flex-col items-center justify-center">
        <img
          src="/assets/icons/icon-cadeado.png"
          alt="Bloqueado"
          className="w-7 h-7 object-contain opacity-70"
          loading="lazy"
          width={28}
          height={28}
        />
      </div>
    )
  }

  // Estilos da base circular tátil com bisel 3D
  const getNodeStyles = () => {
    if (isCurrent) {
      return 'bg-gradient-to-b from-[#8E2DE2] to-[#7D2BD6] border-[#7D2BD6] border-b-[6px] border-b-[#5B21B6] shadow-lg shadow-purple-500/30'
    }
    if (isCompleted) {
      return 'bg-[#7D2BD6] border-[#6D28D9] border-b-[6px] border-b-[#5B21B6] shadow-md shadow-purple-900/10'
    }
    if (isChest) {
      if (status === 'chest_claimed') {
        return 'bg-[#F3E8FF] border-[#E9D5FF] border-b-[5px] border-b-[#D8B4FE]'
      }
      return 'bg-gradient-to-b from-[#FCD34D] to-[#F59E0B] border-[#F59E0B] border-b-[6px] border-b-[#D97706] shadow-lg shadow-amber-500/25'
    }
    if (isTrophy) {
      if (status === 'trophy_completed') {
        return 'bg-gradient-to-b from-[#F59E0B] to-[#D97706] border-[#D97706] border-b-[6px] border-b-[#B45309] shadow-lg shadow-amber-600/30'
      }
      return 'bg-[#F3E8FF] border-[#E9D5FF] border-b-[5px] border-b-[#D8B4FE]'
    }
    // Locked
    return 'bg-[#F3E8FF] border-[#E9D5FF] border-b-[5px] border-b-[#DDD6FE] cursor-not-allowed opacity-85'
  }

  return (
    <div className={`relative flex flex-col items-center ${className}`}>
      {/* Balão flutuante "COMEÇAR!" no nível ativo */}
      {isCurrent && (
        <div className="absolute -top-11 z-20 flex flex-col items-center animate-bounce-subtle pointer-events-none">
          <div className="bg-[#7D2BD6] text-white text-[11px] font-extrabold px-3 py-1 rounded-full shadow-md tracking-wider uppercase border border-purple-400">
            COMEÇAR!
          </div>
          {/* Triângulo indicador do balão */}
          <div className="w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-[#7D2BD6]" />
        </div>
      )}

      {/* Mascote pequeno ao lado do nível atual */}
      {isCurrent && (
        <div className="absolute -right-12 -top-4 z-10 w-12 h-12 pointer-events-none drop-shadow">
          <Mascot pose="head" className="w-full h-full object-contain" priority />
        </div>
      )}

      {/* 3 Estrelas de Maestria douradas acima de nó concluído */}
      {isCompleted && (
        <div className="absolute -top-3 z-10 flex gap-0.5 pointer-events-none">
          <span className="text-[#F5B83D] text-[10px] leading-none drop-shadow-sm font-bold">•</span>
          <span className="text-[#F5B83D] text-[12px] -mt-1 leading-none drop-shadow-sm font-bold">•</span>
          <span className="text-[#F5B83D] text-[10px] leading-none drop-shadow-sm font-bold">•</span>
        </div>
      )}

      {/* Botão circular chunky com física 3D */}
      <button
        type="button"
        aria-label={ariaLabel}
        onClick={onClick}
        className={`w-[70px] h-[70px] rounded-full flex items-center justify-center transition-all duration-150 select-none ${getNodeStyles()} ${
          !isLocked
            ? 'active:translate-y-[3px] active:border-b-[3px] cursor-pointer'
            : 'active:scale-95'
        }`}
      >
        {renderContent()}
      </button>

      {/* Rótulo opcional ou identificador */}
      <div className="mt-2 text-center max-w-[120px] px-1">
        <p className="font-nunito font-bold text-xs text-[#581C87] truncate">
          {title}
        </p>
      </div>
    </div>
  )
}
