import React, { useState, useEffect } from 'react'
import { Check, X } from 'lucide-react'
import type { ConceptMatchingQuestion } from '../../questions/types'

export interface ConceptMatchingViewProps {
  question: ConceptMatchingQuestion
  disabled?: boolean
  isValidated?: boolean
  isCorrect?: boolean
  onAnswerChange: (mapping: Record<string, string>) => void
}

const PAIR_COLORS = [
  { border: 'border-[#CF91F6]', bg: 'bg-[#FAF5FF]', text: 'text-[#7D2BD6]' },
  { border: 'border-[#93C5FD]', bg: 'bg-[#EFF6FF]', text: 'text-[#1D4ED8]' },
  { border: 'border-[#FDE047]', bg: 'bg-[#FEFCE8]', text: 'text-[#A16207]' },
  { border: 'border-[#86EFAC]', bg: 'bg-[#F0FDF4]', text: 'text-[#15803D]' },
]

export const ConceptMatchingView: React.FC<ConceptMatchingViewProps> = ({
  question,
  disabled = false,
  isValidated = false,
  isCorrect = false,
  onAnswerChange,
}) => {
  // Shuffled right-side items (garante que nunca fique na mesma ordem da coluna esquerda)
  const [shuffledRights] = useState<string[]>(() => {
    const originals = question.pairs.map((p) => p.right)
    if (originals.length <= 1) return originals
    const copy = [...originals]
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const temp = copy[i]
      copy[i] = copy[j]
      copy[j] = temp
    }
    // Se por acaso sorteou igual à ordem original, rotaciona 1 posição
    if (copy.every((val, idx) => val === originals[idx])) {
      return [...copy.slice(1), copy[0]]
    }
    return copy
  })

  const [selectedLeft, setSelectedLeft] = useState<string | null>(null)
  const [matches, setMatches] = useState<Record<string, string>>({})

  useEffect(() => {
    onAnswerChange(matches)
  }, [matches])

  const handleLeftClick = (left: string) => {
    if (disabled || isValidated) return
    if (matches[left]) {
      // Se já estava associado, desassocia ao clicar
      const updated = { ...matches }
      delete updated[left]
      setMatches(updated)
      setSelectedLeft(null)
      return
    }
    setSelectedLeft(selectedLeft === left ? null : left)
  }

  const handleRightClick = (right: string) => {
    if (disabled || isValidated) return
    // Se o right já estiver pareado com outro, não faz nada ou troca
    const existingLeft = Object.keys(matches).find((k) => matches[k] === right)

    if (selectedLeft) {
      const updated = { ...matches }
      if (existingLeft) {
        delete updated[existingLeft]
      }
      updated[selectedLeft] = right
      setMatches(updated)
      setSelectedLeft(null)
    } else if (existingLeft) {
      // Desfaz par
      const updated = { ...matches }
      delete updated[existingLeft]
      setMatches(updated)
    }
  }

  return (
    <div className="w-full space-y-3 pt-1">
      <p className="text-[12px] font-bold text-[#7D6A9C] mb-2 px-1">
        Toque em um conceito à esquerda e depois na sua definição:
      </p>

      <div className="grid grid-cols-2 gap-2.5">
        {/* Coluna Esquerda: Conceitos */}
        <div className="space-y-2">
          {question.pairs.map((pair, idx) => {
            const isMatched = !!matches[pair.left]
            const isSelected = selectedLeft === pair.left
            const pairColor = PAIR_COLORS[idx % PAIR_COLORS.length]

            let style = 'bg-white border-[#E9D8FF] text-[#432171]'
            if (isSelected) {
              style = 'bg-[#F3E8FF] border-[#7D2BD6] ring-2 ring-[#7D2BD6]/30 text-[#7D2BD6]'
            } else if (isMatched) {
              style = `${pairColor.bg} ${pairColor.border} ${pairColor.text} font-black`
            }

            if (isValidated) {
              const userRight = matches[pair.left]
              if (userRight === pair.right) {
                style = 'bg-[#F0FDF4] border-[#86EFAC] text-[#15803D]'
              } else {
                style = 'bg-[#FEF2F2] border-[#FECACA] text-[#DC2626]'
              }
            }

            return (
              <button
                key={pair.id}
                type="button"
                disabled={disabled || isValidated}
                onClick={() => handleLeftClick(pair.left)}
                className={`w-full min-h-[56px] p-2.5 rounded-xl border-2 text-left font-nunito font-bold text-xs sm:text-sm transition-all flex items-center justify-between shadow-xs ${style} cursor-pointer active:scale-95`}
              >
                <span className="truncate">{pair.left}</span>
                {isMatched && (
                  <span className="w-5 h-5 rounded-full bg-white/80 flex items-center justify-center shrink-0 ml-1">
                    <Check className="w-3 h-3" />
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Coluna Direita: Exemplos/Definições */}
        <div className="space-y-2">
          {shuffledRights.map((right) => {
            const matchedLeft = Object.keys(matches).find((k) => matches[k] === right)
            const leftIdx = question.pairs.findIndex((p) => p.left === matchedLeft)
            const pairColor = leftIdx >= 0 ? PAIR_COLORS[leftIdx % PAIR_COLORS.length] : null

            let style = 'bg-white border-[#E9D8FF] text-[#432171]'
            if (matchedLeft && pairColor) {
              style = `${pairColor.bg} ${pairColor.border} ${pairColor.text} font-black`
            }

            if (isValidated && matchedLeft) {
              const pair = question.pairs.find((p) => p.left === matchedLeft)
              if (pair && pair.right === right) {
                style = 'bg-[#F0FDF4] border-[#86EFAC] text-[#15803D]'
              } else {
                style = 'bg-[#FEF2F2] border-[#FECACA] text-[#DC2626]'
              }
            }

            return (
              <button
                key={right}
                type="button"
                disabled={disabled || isValidated}
                onClick={() => handleRightClick(right)}
                className={`w-full min-h-[56px] p-2.5 rounded-xl border-2 text-left font-nunito font-bold text-xs sm:text-sm transition-all flex items-center justify-between shadow-xs ${style} cursor-pointer active:scale-95`}
              >
                <span className="leading-snug">{right}</span>
                {matchedLeft && !isValidated && (
                  <span className="w-4 h-4 rounded-full bg-black/10 flex items-center justify-center shrink-0 ml-1">
                    <X className="w-2.5 h-2.5 text-black/60" />
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
