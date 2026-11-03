// src/features/learn/engine/quizEngineTypes.ts
// Tipos de estado e eventos do Motor de Quiz do Desafio Piggy (Prompt N8)

import type { LearnQuestion, QuestionValidationResult } from '../questions/types'
import type { LessonCompletionResult } from '../services/learnService'

export type QuizStatus =
  | 'idle'
  | 'answering'
  | 'validating'
  | 'correct'
  | 'incorrect'
  | 'game_over'
  | 'completed'

export interface QuizState {
  questions: LearnQuestion[]
  currentIndex: number
  status: QuizStatus
  currentAnswer: unknown | null
  validation: QuestionValidationResult | null
  hearts: number
  maxHearts: number
  correctCount: number
  mistakesCount: number
  earnedXp: number
  earnedCoins: number
  lessonResult: LessonCompletionResult | null
}

export type QuizAction =
  | { type: 'START_QUIZ'; questions: LearnQuestion[]; initialHearts?: number }
  | { type: 'SELECT_ANSWER'; answer: unknown }
  | { type: 'VERIFY_ANSWER' }
  | { type: 'NEXT_QUESTION' }
  | { type: 'RETRY_QUESTION' }
  | { type: 'SET_COMPLETED'; result?: LessonCompletionResult }
  | { type: 'RESTART' }
