// src/features/learn/components/HeartsModal.tsx
// Modal de Gerenciamento e Recarga de Vidas no estilo Duolingo / PurplePiggy
import React, { useState } from 'react'
import { X, Heart, Sparkles, RefreshCw } from 'lucide-react'
import { Mascot } from '../../../components/Mascot'
import { learnService, LearnStats } from '../services/learnService'
import { toast } from 'sonner'

interface HeartsModalProps {
  isOpen: boolean
  onClose: () => void
  stats: LearnStats | null
  onHeartsUpdated: (newStats: LearnStats) => void
}

export const HeartsModal: React.FC<HeartsModalProps> = ({
  isOpen,
  onClose,
  stats,
  onHeartsUpdated,
}) => {
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const currentHearts = stats?.hearts ?? 3
  const currentCoins = stats?.piggy_coins ?? 0
  const maxHearts = 3

  const handleRecharge = async () => {
    if (currentCoins < 30) {
      toast.error('Você precisa de 30 moedas para recarregar suas vidas.')
      return
    }

    setLoading(true)
    try {
      const res = await learnService.rechargeHearts()
      if (res.success) {
        toast.success('Vidas recarregadas com sucesso! ❤️')
        const updated = await learnService.getStats()
        onHeartsUpdated(updated)
        onClose()
      } else {
        toast.error(res.message || 'Não foi possível recarregar vidas agora.')
      }
    } catch {
      toast.error('Erro ao recarregar vidas.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-[#1F0F38]/60 backdrop-blur-xs animate-fadeIn p-0 sm:p-4">
      <div
        className="w-full max-w-[400px] bg-white rounded-t-[28px] sm:rounded-[28px] p-6 flex flex-col items-center text-center shadow-2xl border-t sm:border border-purple-100 relative animate-slideUp"
        style={{
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)',
        }}
      >
        {/* Pílula superior em telas mobile */}
        <div className="w-11 h-1.5 bg-purple-200/70 rounded-full mx-auto mb-3 sm:hidden" />

        {/* Botão Fechar */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar vidas"
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#FAF5FF] flex items-center justify-center text-[#6E568A] hover:text-[#432171] active:scale-95 transition-transform cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Mascote Encantador */}
        <div className="w-18 h-18 -mt-2 mb-2 flex items-center justify-center drop-shadow-md">
          <Mascot
            pose={currentHearts > 0 ? 'idea' : 'retry'}
            size="sm"
            className="w-full h-full object-contain"
          />
        </div>

        <h3 className="font-nunito font-black text-xl text-[#33105D] leading-tight">
          Suas Vidas
        </h3>

        {/* Corações Visuais Grandes */}
        <div className="flex items-center gap-3 my-4">
          {Array.from({ length: maxHearts }).map((_, idx) => {
            const isFull = idx < currentHearts
            return (
              <div
                key={idx}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                  isFull
                    ? 'bg-[#FFE4EE] border-2 border-[#E5487A] shadow-md shadow-[#E5487A]/20 scale-105'
                    : 'bg-[#F3E8FF]/60 border-2 border-purple-200/60 opacity-40'
                }`}
              >
                <Heart
                  className={`w-7 h-7 ${
                    isFull
                      ? 'fill-[#E5487A] text-[#E5487A] drop-shadow-[0_2px_4px_rgba(229,72,122,0.4)]'
                      : 'text-purple-300'
                  }`}
                />
              </div>
            )
          })}
        </div>

        <p className="font-nunito text-xs text-[#6B5A8E] font-bold leading-relaxed max-w-xs mb-5">
          {currentHearts === 3
            ? 'Você está com todas as vidas cheias! Pratique lições à vontade para ganhar Moedas e XP.'
            : currentHearts > 0
            ? `Você ainda tem ${currentHearts} de ${maxHearts} vidas. Se errar uma questão, perde 1 vida.`
            : 'Suas vidas acabaram! Recarregue agora com suas moedas para continuar praticando.'}
        </p>

        {/* Botão de Ação */}
        {currentHearts < 3 ? (
          <button
            type="button"
            onClick={handleRecharge}
            disabled={loading || currentCoins < 30}
            className="w-full h-12 rounded-full bg-gradient-to-r from-[#E5487A] to-[#B037F8] text-white font-black text-sm shadow-[0_6px_20px_rgba(229,72,122,0.3)] hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Recarregar Vidas</span>
                <span className="inline-flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full text-xs font-black ml-1">
                  <img src="/assets/coins/coin-1.png" alt="" className="w-3.5 h-3.5 object-contain" />
                  30
                </span>
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={onClose}
            className="w-full h-12 rounded-full bg-[#FAF5FF] border border-[#E9D5FF] text-[#7D2BD6] font-black text-sm active:scale-95 transition-transform cursor-pointer"
          >
            Vidas Cheias · Praticar Agora
          </button>
        )}
      </div>
    </div>
  )
}
