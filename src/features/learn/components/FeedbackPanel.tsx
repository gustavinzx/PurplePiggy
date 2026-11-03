// src/features/learn/components/FeedbackPanel.tsx
// Painel de Feedback Fixo no Rodapé (Drawer de Validação com Mascote e Botão Chunky)

import React from 'react'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import { Mascot } from '../../../components/Mascot'
import { ChunkyButton } from './ChunkyButton'

export type FeedbackPanelStatus = 'correct' | 'incorrect' | 'game_over'

export interface FeedbackPanelProps {
  status: FeedbackPanelStatus
  title?: string
  explanation?: string
  tip?: string
  actionText?: string
  onAction: () => void
  className?: string
}

export const FeedbackPanel: React.FC<FeedbackPanelProps> = ({
  status,
  title,
  explanation,
  tip,
  actionText,
  onAction,
  className = '',
}) => {
  const isCorrect = status === 'correct'
  const isGameOver = status === 'game_over'

  const defaultTitle = isCorrect
    ? 'Excelente! Mandou muito bem!'
    : isGameOver
    ? 'Corações esgotados!'
    : 'Quase lá! Veja a explicação:'

  const resolvedTitle = title || defaultTitle

  const defaultActionText = isCorrect
    ? 'CONTINUAR'
    : isGameOver
    ? 'RECOMEÇAR LIÇÃO'
    : 'ENTENDI'

  const resolvedActionText = actionText || defaultActionText

  return (
    <div
      role="region"
      aria-live="polite"
      className={`w-full max-w-md mx-auto p-5 select-none transition-all duration-200 border-t-2 ${
        isCorrect
          ? 'bg-[#DCFCE7] border-[#86EFAC]'
          : 'bg-[#FCE7F3] border-[#F472B6]'
      } ${className}`}
    >
      <div className="flex items-start gap-4 mb-4">
        {/* Mascote Aprovado */}
        <div className="flex-shrink-0">
          <Mascot
            pose={isCorrect ? 'success' : 'retry'}
            size="sm"
            priority
            alt={isCorrect ? 'Mascote celebrando acerto' : 'Mascote encorajando após erro'}
          />
        </div>

        {/* Textos de Feedback */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {isCorrect ? (
              <CheckCircle2 className="w-5 h-5 text-[#15803D] flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-[#BE185D] flex-shrink-0" />
            )}
            <h3
              className={`font-extrabold text-base leading-tight ${
                isCorrect ? 'text-[#15803D]' : 'text-[#BE185D]'
              }`}
            >
              {resolvedTitle}
            </h3>
          </div>

          {explanation ? (
            <p
              className={`text-sm font-semibold leading-relaxed ${
                isCorrect ? 'text-[#166534]' : 'text-[#9D174D]'
              }`}
            >
              {explanation}
            </p>
          ) : null}

          {tip ? (
            <p className="text-xs text-[#7D6A9C] mt-1 italic">
              Dica: {tip}
            </p>
          ) : null}
        </div>
      </div>

      {/* Botão de Ação Chunky Largo */}
      <ChunkyButton
        variant={isCorrect ? 'success' : isGameOver ? 'primary' : 'danger'}
        size="full"
        onClick={onAction}
      >
        {resolvedActionText}
      </ChunkyButton>
    </div>
  )
}
