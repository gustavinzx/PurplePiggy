import React from 'react'
import { BookOpen } from 'lucide-react'
import type { ScenarioChoiceQuestion } from '../../questions/types'
import { OptionCard } from '../OptionCard'

export interface ScenarioChoiceViewProps {
  question: ScenarioChoiceQuestion
  currentAnswer: number | null
  disabled?: boolean
  isValidated?: boolean
  onSelect: (idx: number) => void
}

const OPTION_LETTERS = ['A', 'B']

export const ScenarioChoiceView: React.FC<ScenarioChoiceViewProps> = ({
  question,
  currentAnswer,
  disabled = false,
  isValidated = false,
  onSelect,
}) => {
  return (
    <div className="w-full space-y-3.5 pt-1">
      {/* Cenário contextual em destaque */}
      <div className="p-4 rounded-2xl bg-[#F6EEFF] border border-[#E9D8FF] flex items-start gap-3 shadow-xs">
        <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shrink-0 text-[#7D2BD6] shadow-xs">
          <BookOpen className="w-4 h-4" />
        </div>
        <p className="font-nunito font-semibold text-[13px] text-[#432171] leading-relaxed">
          {question.scenarioText}
        </p>
      </div>

      {/* Opções de decisão */}
      <div className="space-y-2.5">
        {question.options.map((optionText, idx) => {
          let cardState: 'idle' | 'selected' | 'correct' | 'incorrect' = 'idle'
          const isSelected = currentAnswer === idx

          if (isValidated) {
            if (idx === question.correctIndex) {
              cardState = 'correct'
            } else if (isSelected) {
              cardState = 'incorrect'
            }
          } else if (isSelected) {
            cardState = 'selected'
          }

          return (
            <OptionCard
              key={idx}
              label={OPTION_LETTERS[idx] || String(idx + 1)}
              text={optionText}
              state={cardState}
              disabled={disabled || isValidated}
              onClick={() => onSelect(idx)}
            />
          )
        })}
      </div>
    </div>
  )
}
