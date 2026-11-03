// src/features/learn/components/TrackSelectorSheet.tsx
// Gaveta inferior de troca de trilhas (Mockup 10b-trocar-trilha.png)
import React from 'react'
import { X, BookOpen, ChevronRight, CheckCircle2 } from 'lucide-react'
import { Mascot } from '../../../components/Mascot'
import { ChunkyButton } from './ChunkyButton'

export interface TrackSummary {
  trackSlug: string
  trackTitle: string
  trackDescription: string
  trackOrder: number
  progressPct: number
  isCompleted?: boolean
  isActive?: boolean
}

interface TrackSelectorSheetProps {
  isOpen: boolean
  onClose: () => void
  tracks: TrackSummary[]
  activeTrackSlug: string
  onSelectTrack: (trackSlug: string) => void
  onOpenStudyGuides?: () => void
}

export const TrackSelectorSheet: React.FC<TrackSelectorSheetProps> = ({
  isOpen,
  onClose,
  tracks,
  activeTrackSlug,
  onSelectTrack,
  onOpenStudyGuides,
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
      {/* Backdrop click */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer Container */}
      <div className="relative z-10 w-full max-w-lg bg-[#FAF5FF] rounded-t-[32px] p-5 sm:p-6 shadow-2xl border-t border-purple-200 max-h-[88vh] flex flex-col animate-slideUp">
        {/* Top handle */}
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4 flex-shrink-0" />

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white flex items-center justify-center text-purple-700 shadow-sm hover:bg-purple-50 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header com Mascote Graduate (Mockup 10b) */}
        <div className="flex items-center gap-4 mb-5 flex-shrink-0">
          <div className="w-16 h-16 flex-shrink-0 drop-shadow">
            <Mascot pose="graduate" className="w-full h-full object-contain" priority />
          </div>
          <div>
            <h2 className="font-nunito font-black text-xl text-[#3B0764] leading-tight">
              Aprenda no seu ritmo
            </h2>
            <p className="font-nunito text-xs text-purple-900/70 mt-0.5">
              Conhecimento financeiro para a vida real.
            </p>
          </div>
        </div>

        {/* Lista de Trilhas com Scroll suave */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 pb-4">
          {tracks.map((track) => {
            const isActive = track.trackSlug === activeTrackSlug
            const isFinished = track.progressPct === 100
            const orderStr = String(track.trackOrder).padStart(2, '0')

            return (
              <div
                key={track.trackSlug}
                className={`p-4 rounded-2xl bg-white border transition-all duration-200 shadow-sm ${
                  isActive
                    ? 'border-[#7D2BD6] ring-2 ring-purple-400/30'
                    : 'border-purple-100 hover:border-purple-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#7D2BD6]">
                        TRILHA {orderStr}
                      </span>
                      {isFinished && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold text-[#2FBF71] bg-green-50 px-1.5 py-0.2 rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          Concluída
                        </span>
                      )}
                    </div>
                    <h3 className="font-nunito font-extrabold text-base text-[#3B0764] mt-0.5">
                      {track.trackTitle}
                    </h3>
                    <p className="font-nunito text-xs text-gray-500 mt-0.5">
                      {track.trackDescription}
                    </p>
                  </div>
                </div>

                {/* Barra de Progresso */}
                <div className="flex items-center gap-2.5 my-3">
                  <div className="flex-1 bg-purple-50 h-2.5 rounded-full overflow-hidden p-0.5 border border-purple-100">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isFinished ? 'bg-[#2FBF71]' : 'bg-[#7D2BD6]'
                      }`}
                      style={{ width: `${track.progressPct}%` }}
                    />
                  </div>
                  <span className="font-nunito font-black text-xs text-[#7D2BD6]">
                    {track.progressPct}%
                  </span>
                </div>

                {/* Botão Chunky de Ação */}
                <ChunkyButton
                  variant={isActive ? 'primary' : 'secondary'}
                  size="sm"
                  className="w-full text-xs font-black tracking-wide uppercase"
                  onClick={() => {
                    onSelectTrack(track.trackSlug)
                    onClose()
                  }}
                >
                  {isActive
                    ? 'Continuar trilha'
                    : isFinished
                    ? 'Revisar trilha'
                    : 'Começar a aprender'}
                </ChunkyButton>
              </div>
            )
          })}

          {/* Card: Guias de Estudo (Mockup 10b) */}
          <div
            onClick={onOpenStudyGuides}
            className="p-4 rounded-2xl bg-gradient-to-r from-purple-100/70 to-pink-50 border border-purple-200 cursor-pointer hover:border-purple-300 transition-all flex items-center justify-between gap-3 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-[#7D2BD6]">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-nunito font-extrabold text-sm text-[#3B0764]">
                  Guias de estudo
                </h4>
                <p className="font-nunito text-xs text-purple-900/70">
                  Resumos para consultar quando quiser.
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-purple-400" />
          </div>
        </div>
      </div>
    </div>
  )
}
