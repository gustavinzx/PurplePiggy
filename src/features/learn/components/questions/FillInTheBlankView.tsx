import React, { useState } from 'react'
import type { FillInTheBlankQuestion } from '../../questions/types'

export interface FillInTheBlankViewProps {
  question: FillInTheBlankQuestion
  disabled?: boolean
  isValidated?: boolean
  isCorrect?: boolean
  onAnswerChange: (word: string) => void
}

export const FillInTheBlankView: React.FC<FillInTheBlankViewProps> = ({
  question,
  disabled = false,
  isValidated = false,
  isCorrect = false,
  onAnswerChange,
}) => {
  const [selectedWord, setSelectedWord] = useState<string | null>(null)

  const handleSelectWord = (word: string) => {
    if (disabled || isValidated) return
    const next = selectedWord === word ? null : word
    setSelectedWord(next)
    onAnswerChange(next || '')
  }

  // Divide a frase pela lacuna "___"
  const parts = question.sentence.split('___')

  return (
    <div className="w-full space-y-4 pt-1">
      {/* Frase com a lacuna interativa */}
      <div className="p-4 rounded-2xl bg-white border-2 border-[#E9D8FF] shadow-xs leading-relaxed font-nunito text-base text-[#432171] font-bold">
        <span>{parts[0]}</span>
        <span
          className={`inline-block px-3 py-1 mx-1.5 rounded-xl border-2 transition-all font-black text-sm align-middle ${
            selectedWord
              ? isValidated
                ? isCorrect
                  ? 'bg-[#DCFCE7] border-[#86EFAC] text-[#15803D]'
                  : 'bg-[#FEE2E2] border-[#FECACA] text-[#DC2626]'
                : 'bg-[#F3E8FF] border-[#7D2BD6] text-[#7D2BD6]'
              : 'border-dashed border-[#CF91F6] bg-[#FAF5FF] text-[#CF91F6] min-w-[70px] text-center'
          }`}
        >
          {selectedWord || '...'}
        </span>
        <span>{parts[1] || ''}</span>
      </div>

      {/* Banco de palavras para escolher */}
      <div className="pt-2">
        <p className="text-[12px] font-bold text-[#7D6A9C] mb-2 px-1">
          Selecione a palavra que completa a frase:
        </p>
        <div className="flex flex-wrap gap-2.5">
          {question.options.map((word) => {
            const isSelected = selectedWord === word
            let pillStyle =
              'bg-white border-[#E9D8FF] text-[#432171] hover:border-[#CF91F6]'

            if (isSelected) {
              pillStyle = 'bg-[#7D2BD6] border-[#7D2BD6] text-white shadow-sm'
            }

            if (isValidated) {
              if (word === question.correctAnswer) {
                pillStyle = 'bg-[#15803D] border-[#15803D] text-white'
              } else if (isSelected && !isCorrect) {
                pillStyle = 'bg-[#DC2626] border-[#DC2626] text-white'
              }
            }

            return (
              <button
                key={word}
                type="button"
                disabled={disabled || isValidated}
                onClick={() => handleSelectWord(word)}
                className={`px-4 py-2.5 rounded-xl border-2 font-nunito font-extrabold text-sm transition-all cursor-pointer active:scale-95 ${pillStyle}`}
              >
                {word}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
