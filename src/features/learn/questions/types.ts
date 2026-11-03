// src/features/learn/questions/types.ts
// Tipos estritos para o Banco de Questões do Desafio Piggy (5 Tipologias nos 4 Lotes)

export type ExerciseTypology =
  | 'multiple_choice'
  | 'scenario_choice'
  | 'order_priorities'
  | 'concept_matching'
  | 'fill_in_the_blank'

export type LoteNumber = 1 | 2 | 3 | 4

export interface BaseQuestion {
  id: string
  lessonSlug: string
  trackSlug: string
  lote: LoteNumber
  typology: ExerciseTypology
  prompt: string
  contextText?: string
  explanation: string
  tip?: string
  orderIndex: number
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  typology: 'multiple_choice'
  options: string[]
  correctIndex: number
}

export interface ScenarioChoiceQuestion extends BaseQuestion {
  typology: 'scenario_choice'
  scenarioText: string
  options: [string, string]
  correctIndex: number
}

export interface OrderPrioritiesQuestion extends BaseQuestion {
  typology: 'order_priorities'
  items: string[]
  correctOrder: string[]
}

export interface ConceptMatchingQuestion extends BaseQuestion {
  typology: 'concept_matching'
  pairs: Array<{
    id: string
    left: string
    right: string
  }>
}

export interface FillInTheBlankQuestion extends BaseQuestion {
  typology: 'fill_in_the_blank'
  sentence: string // contém "___" para representar a lacuna
  options: string[]
  correctAnswer: string
}

export type LearnQuestion =
  | MultipleChoiceQuestion
  | ScenarioChoiceQuestion
  | OrderPrioritiesQuestion
  | ConceptMatchingQuestion
  | FillInTheBlankQuestion

export interface QuestionValidationResult {
  isCorrect: boolean
  feedbackTitle: string
  explanation: string
  mascotPose: 'pig-success' | 'pig-retry'
}
