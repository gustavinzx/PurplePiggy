import React, { useState, useEffect } from 'react'
import { ArrowUp, ArrowDown } from 'lucide-react'
import type { OrderPrioritiesQuestion } from '../../questions/types'

export interface OrderPrioritiesViewProps {
  question: OrderPrioritiesQuestion
  disabled?: boolean
  isValidated?: boolean
  isCorrect?: boolean
  onAnswerChange: (order: string[]) => void
}

export const OrderPrioritiesView: React.FC<OrderPrioritiesViewProps> = ({
  question,
  disabled = false,
  isValidated = false,
  isCorrect = false,
  onAnswerChange,
}) => {
  // Inicializar com itens misturados se houver mais de um item
  const [items, setItems] = useState<string[]>(() => {
    const raw = [...question.items]
    // Inverter se já estiver na ordem certa para desafiar o usuário
    if (
      raw.length > 1 &&
      JSON.stringify(raw) === JSON.stringify(question.correctOrder)
    ) {
      return [...raw].reverse()
    }
    return raw
  })

  // Notificar pai na montagem
  useEffect(() => {
    onAnswerChange(items)
  }, [])

  const moveItem = (index: number, direction: 'up' | 'down') => {
    if (disabled || isValidated) return
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= items.length) return

    const newItems = [...items]
    const temp = newItems[index]
    newItems[index] = newItems[targetIndex]
    newItems[targetIndex] = temp

    setItems(newItems)
    onAnswerChange(newItems)
  }

  return (
    <div className="w-full space-y-2.5 pt-1">
      <p className="text-[12px] font-bold text-[#7D6A9C] mb-2 px-1">
        Use as setas para organizar na sequência certa:
      </p>

      {items.map((item, index) => {
        let cardBg = 'bg-white border-[#E9D8FF]'
        let badgeBg = 'bg-[#F3E8FF] text-[#7D2BD6]'

        if (isValidated) {
          if (isCorrect) {
            cardBg = 'bg-[#F0FDF4] border-[#86EFAC]'
            badgeBg = 'bg-[#DCFCE7] text-[#15803D]'
          } else {
            const correctIndex = question.correctOrder.indexOf(item)
            if (correctIndex === index) {
              cardBg = 'bg-[#F0FDF4] border-[#86EFAC]'
              badgeBg = 'bg-[#DCFCE7] text-[#15803D]'
            } else {
              cardBg = 'bg-[#FEF2F2] border-[#FECACA]'
              badgeBg = 'bg-[#FEE2E2] text-[#DC2626]'
            }
          }
        }

        return (
          <div
            key={item}
            className={`flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all shadow-xs ${cardBg}`}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center font-nunito font-black text-xs shrink-0 ${badgeBg}`}
              >
                {index + 1}
              </span>
              <span className="font-nunito font-bold text-[14px] text-[#432171] leading-snug break-words">
                {item}
              </span>
            </div>

            {!disabled && !isValidated && (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => moveItem(index, 'up')}
                  aria-label="Mover para cima"
                  className="w-8 h-8 rounded-xl bg-[#F6EEFF] hover:bg-[#EEDEFB] active:scale-90 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center text-[#7D2BD6] transition-all cursor-pointer"
                >
                  <ArrowUp className="w-4 h-4" strokeWidth={2.5} />
                </button>
                <button
                  type="button"
                  disabled={index === items.length - 1}
                  onClick={() => moveItem(index, 'down')}
                  aria-label="Mover para baixo"
                  className="w-8 h-8 rounded-xl bg-[#F6EEFF] hover:bg-[#EEDEFB] active:scale-90 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center text-[#7D2BD6] transition-all cursor-pointer"
                >
                  <ArrowDown className="w-4 h-4" strokeWidth={2.5} />
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
