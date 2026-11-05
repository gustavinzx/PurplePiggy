// src/features/learn/components/NodeSheet.tsx
// Gaveta inferior ao tocar em um nó do mapa - Tokens V2 (Redesign V2)
import React from 'react'
import { X, BookOpen, RotateCcw, Play, Sparkles } from 'lucide-react'
import { Mascot } from '../../../components/Mascot'

interface NodeSheetProps {
  isOpen: boolean
  onClose: () => void
  levelNumber: number
  title: string
  description?: string
  isCompleted?: boolean
  stars?: number
  isChest?: boolean
  isChestClaimed?: boolean
  isTrophy?: boolean
  allLevelsCompleted?: boolean
  onStartLesson: () => void
  onReadGuide?: () => void
  onClaimChest?: () => Promise<void>
}

export const NodeSheet: React.FC<NodeSheetProps> = ({
  isOpen,
  onClose,
  levelNumber,
  title,
  description,
  isCompleted = false,
  stars = 3,
  isChest = false,
  isChestClaimed = false,
  isTrophy = false,
  allLevelsCompleted = false,
  onStartLesson,
  onReadGuide,
  onClaimChest,
}) => {
  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="node-sheet-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 backdrop-blur-xs animate-fadeIn select-none"
    >
      {/* Backdrop click */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer Container */}
      <div className="relative z-10 w-full max-w-[430px] bg-white rounded-t-[28px] p-6 shadow-2xl border-t border-[#E8DEFB] animate-slideUp">
        {/* Top handle bar */}
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4" />

        {/* Botão de Fechar */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar gaveta"
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-purple-50 hover:bg-purple-100 flex items-center justify-center text-purple-700 transition-colors active:scale-95"
        >
          <X className="w-4 h-4" />
        </button>

        {/* 1. CASO BAÚ DE RECOMPENSA */}
        {isChest ? (
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 mb-3 drop-shadow-md">
              <img
                src={isChestClaimed ? '/assets/icons/icon-bau-aberto.png' : '/assets/icons/icon-bau.png'}
                alt="Baú de Recompensa"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-600 bg-purple-50 px-2.5 py-0.5 rounded-full mb-1.5">
              Recompensa da Trilha
            </span>
            <h2 id="node-sheet-title" className="font-nunito font-black text-xl text-[#432171] leading-tight">
              Baú de Experiência
            </h2>
            <p className="font-nunito font-semibold text-xs text-[#7D6A9C] mt-1 max-w-xs leading-relaxed">
              Você avançou na sua jornada e liberou uma recompensa especial com XP adicional!
            </p>

            <div className="bg-[#FAF5FF] border border-purple-100 rounded-2xl p-3 my-4 flex items-center gap-2 justify-center w-full">
              <img src="/assets/icons/icon-xp.png" alt="XP" className="w-6 h-6 object-contain" />
              <span className="font-nunito font-black text-base text-[#7D2BD6]">+30 XP</span>
              <span className="text-xs text-gray-500 font-nunito font-bold">para sua evolução</span>
            </div>

            <button
              type="button"
              disabled={isChestClaimed}
              onClick={async () => {
                if (onClaimChest && !isChestClaimed) {
                  await onClaimChest()
                }
                onClose()
              }}
              className={`w-full py-3.5 px-6 rounded-full font-nunito font-black text-sm tracking-wide shadow-md transition-all active:scale-[0.98] ${
                isChestClaimed
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                  : 'bg-gradient-to-r from-[#7D2BD6] to-[#8E2DE2] text-white hover:opacity-95'
              }`}
            >
              {isChestClaimed ? 'Baú já resgatado' : 'Resgatar +30 XP'}
            </button>
          </div>
        ) : isTrophy ? (
          /* 2. CASO TROFÉU DA TRILHA */
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 mb-3 drop-shadow-md">
              <img
                src="/assets/icons/icon-trofeu.png"
                alt="Troféu da Trilha"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-600 bg-purple-50 px-2.5 py-0.5 rounded-full mb-1.5">
              Troféu de Domínio
            </span>
            <h2 id="node-sheet-title" className="font-nunito font-black text-xl text-[#432171] leading-tight">
              Troféu da Trilha
            </h2>
            <p className="font-nunito font-semibold text-xs text-[#7D6A9C] mt-1 max-w-xs leading-relaxed">
              {allLevelsCompleted
                ? 'Parabéns! Você completou com excelência todos os níveis desta trilha financeira!'
                : 'Conclua todas as etapas anteriores para desbloquear e erguer o grande troféu dourado.'}
            </p>

            <button
              type="button"
              onClick={onClose}
              className="w-full mt-5 py-3.5 px-6 rounded-full font-nunito font-black text-sm text-white bg-gradient-to-r from-[#7D2BD6] to-[#8E2DE2] shadow-md hover:opacity-95 transition-all active:scale-[0.98]"
            >
              {allLevelsCompleted ? 'Conquista Dominada!' : 'Continuar Jornada'}
            </button>
          </div>
        ) : (
          /* 3. CASO NÍVEL NORMAL (ATUAL OU CONCLUÍDO) */
          <div>
            {/* Header com Mascote e Título */}
            <div className="flex items-start gap-4 mb-4">
              <div className="w-16 h-16 flex-shrink-0 drop-shadow">
                <Mascot
                  pose={isCompleted ? 'trophy' : 'idea'}
                  size="md"
                  className="w-full h-full object-contain"
                  priority
                />
              </div>
              <div className="flex-1 pr-6">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                    {isCompleted ? 'Nível Concluído' : `Nível ${levelNumber}`}
                  </span>
                  {/* Estrelas do Nível Concluído */}
                  {isCompleted && (
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 3 }).map((_, idx) => (
                        <img
                          key={idx}
                          src="/assets/icons/icon-goal-star.webp"
                          alt=""
                          className={`w-3.5 h-3.5 object-contain ${
                            idx < stars ? 'opacity-100 drop-shadow-xs' : 'opacity-25 grayscale'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
                <h2 id="node-sheet-title" className="font-nunito font-extrabold text-lg text-[#432171] leading-snug">
                  {title}
                </h2>
                {description && (
                  <p className="font-nunito font-semibold text-xs text-[#7D6A9C] mt-1 leading-relaxed">
                    {description}
                  </p>
                )}
              </div>
            </div>

            {/* Recompensas / Duração */}
            <div className="bg-[#FAF5FF] border border-purple-100 rounded-2xl p-3 mb-5 flex items-center justify-around text-center">
              <div className="flex items-center gap-1.5">
                <img src="/assets/icons/icon-xp.png" alt="XP" className="w-5 h-5 object-contain" />
                <span className="font-nunito font-black text-sm text-[#7D2BD6]">+20 XP</span>
              </div>
              <div className="w-px h-6 bg-purple-200/60" />
              <div className="flex items-center gap-1.5">
                <img src="/assets/coins/coin-1.png" alt="Moedas" className="w-5 h-5 object-contain" />
                <span className="font-nunito font-black text-sm text-[#B45309]">+10 Moedas</span>
              </div>
              <div className="w-px h-6 bg-purple-200/60" />
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#2FBF71]" />
                <span className="font-nunito font-bold text-xs text-gray-600">
                  {isCompleted ? 'Praticar' : '2-3 min'}
                </span>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={onStartLesson}
                className="w-full py-3.5 px-6 rounded-full font-nunito font-black text-sm text-white bg-gradient-to-r from-[#7D2BD6] to-[#8E2DE2] shadow-md hover:opacity-95 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {isCompleted ? (
                  <>
                    <RotateCcw className="w-4 h-4 text-white" />
                    <span>Refazer nível</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white text-white" />
                    <span>Começar</span>
                  </>
                )}
              </button>

              {onReadGuide && (
                <button
                  type="button"
                  onClick={onReadGuide}
                  className="w-full py-2.5 text-center font-nunito font-extrabold text-sm text-[#7D2BD6] hover:bg-purple-50 rounded-full transition-colors flex items-center justify-center gap-2 border border-purple-200/60"
                >
                  <BookOpen className="w-4 h-4 text-purple-600" />
                  <span>Ler guia do nível</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
export default NodeSheet
