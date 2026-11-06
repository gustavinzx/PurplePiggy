// src/features/learn/components/NodeSheet.tsx
// Gaveta inferior ao tocar em um nó do mapa (com createPortal para ficar sempre acima da BottomNav)
import React from 'react'
import { createPortal } from 'react-dom'
import { X, BookOpen, Sparkles } from 'lucide-react'
import { ChunkyButton } from './ChunkyButton'
import { Mascot } from '../../../components/Mascot'

interface NodeSheetProps {
  isOpen: boolean
  onClose: () => void
  levelNumber: number
  title: string
  description?: string
  isCompleted?: boolean
  onStartLesson: () => void
  onReadGuide?: () => void
}

export const NodeSheet: React.FC<NodeSheetProps> = ({
  isOpen,
  onClose,
  levelNumber,
  title,
  description,
  isCompleted = false,
  onStartLesson,
  onReadGuide,
}) => {
  if (!isOpen) return null

  const sheetContent = (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 backdrop-blur-sm animate-fadeIn">
      {/* Backdrop click */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer Container */}
      <div
        className="relative z-10 w-full max-w-md bg-white rounded-t-3xl p-6 shadow-2xl border-t border-purple-100 animate-slideUp"
        style={{
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 28px)',
        }}
      >
        {/* Top handle */}
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4" />

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-700 hover:bg-purple-100 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header com Mascote e Título */}
        <div className="flex items-start gap-4 mb-5">
          <div className="w-14 h-14 flex-shrink-0 drop-shadow">
            <Mascot pose={isCompleted ? 'medal' : 'idea'} className="w-full h-full object-contain" priority />
          </div>
          <div className="flex-1 pr-6">
            <span className="text-xs font-black uppercase tracking-wider text-purple-600">
              NÍVEL {levelNumber}
            </span>
            <h2 className="font-nunito font-extrabold text-xl text-[#3B0764] leading-snug">
              {title}
            </h2>
            {description && (
              <p className="font-nunito text-xs text-gray-500 mt-1 leading-relaxed">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Recompensas */}
        <div className="bg-[#FAF5FF] border border-purple-100 rounded-2xl p-3 mb-5 flex items-center justify-around text-center">
          <div className="flex items-center gap-1.5">
            <img src="/assets/icons/icon-xp.png" alt="XP" className="w-5 h-5 object-contain" />
            <span className="font-nunito font-extrabold text-sm text-[#7D2BD6]">+20 XP</span>
          </div>
          <div className="w-px h-6 bg-purple-200" />
          <div className="flex items-center gap-1.5">
            <img src="/assets/coins/coin-1.png" alt="Moedas" className="w-5 h-5 object-contain" />
            <span className="font-nunito font-extrabold text-sm text-[#B45309]">+10 Moedas</span>
          </div>
          <div className="w-px h-6 bg-purple-200" />
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#2FBF71]" />
            <span className="font-nunito font-bold text-xs text-gray-600">
              {isCompleted ? 'Já concluído' : '3-4 min'}
            </span>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="space-y-2.5">
          <ChunkyButton
            variant="primary"
            size="lg"
            className="w-full"
            onClick={onStartLesson}
          >
            {isCompleted ? 'REVISAR LIÇÃO' : 'INICIAR NÍVEL'}
          </ChunkyButton>

          {onReadGuide && (
            <button
              type="button"
              onClick={onReadGuide}
              className="w-full py-2.5 text-center font-nunito font-extrabold text-sm text-[#7D2BD6] hover:bg-purple-50 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              Ler Guia do Nível
            </button>
          )}
        </div>
      </div>
    </div>
  )

  return typeof document !== 'undefined' ? createPortal(sheetContent, document.body) : sheetContent
}

export default NodeSheet
