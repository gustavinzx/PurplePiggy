// src/features/learn/engine/quizEngineReducer.ts
// Reducer puro para o Motor de Quiz do Desafio Piggy

import type { QuizState, QuizAction } from './quizEngineTypes'
import { validateAnswer } from '../questions/questionGenerator'

export const INITIAL_QUIZ_STATE: QuizState = {
  questions: [],
  currentIndex: 0,
  status: 'idle',
  currentAnswer: null,
  validation: null,
  hearts: 3,
  maxHearts: 3,
  correctCount: 0,
  mistakesCount: 0,
  earnedXp: 0,
  earnedCoins: 0,
  lessonResult: null,
}

export function quizEngineReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case 'START_QUIZ': {
      const qs = action.questions || []
      const hearts = action.initialHearts ?? 3
      return {
        ...INITIAL_QUIZ_STATE,
        questions: qs,
        hearts,
        maxHearts: hearts,
        status: qs.length > 0 ? 'answering' : 'idle',
      }
    }

    case 'SELECT_ANSWER': {
      // Só permite selecionar enquanto estiver no estado 'answering'
      if (state.status !== 'answering') return state
      return {
        ...state,
        currentAnswer: action.answer,
      }
    }

    case 'VERIFY_ANSWER': {
      if (state.status !== 'answering' || state.currentAnswer === null) return state
      const currentQ = state.questions[state.currentIndex]
      if (!currentQ) return state

      const validation = validateAnswer(currentQ, state.currentAnswer)

      if (validation.isCorrect) {
        return {
          ...state,
          status: 'correct',
          validation,
          correctCount: state.correctCount + 1,
          earnedXp: state.earnedXp + 20,
          earnedCoins: state.earnedCoins + 10,
        }
      } else {
        const nextHearts = Math.max(0, state.hearts - 1)
        
        // Passo 1: Lógica de "Fim da Fila" (Spaced Repetition / Queue Retry)
        // Se a usuária errar, clonamos a questão e colocamos no final do array.
        // A lição só termina quando todas forem acertadas e a fila esvaziar.
        const retryQuestion = {
          ...currentQ,
          id: `${currentQ.id}-retry-${state.mistakesCount + 1}`,
        }
        const updatedQuestions = [...state.questions, retryQuestion]

        // Prompt 5: Sem bloquear em game_over. Os corações são indicadores de foco.
        // A questão volta ao final da fila para ser revisada sem frustração ou paywall.
        return {
          ...state,
          questions: updatedQuestions,
          status: 'incorrect',
          validation,
          hearts: nextHearts,
          mistakesCount: state.mistakesCount + 1,
        }
      }
    }

    case 'NEXT_QUESTION': {
      // Se acertou ou se recuperou e vai para a próxima
      const nextIndex = state.currentIndex + 1
      if (nextIndex >= state.questions.length) {
        return {
          ...state,
          status: 'completed',
          currentIndex: state.questions.length - 1,
          currentAnswer: null,
          validation: null,
        }
      }
      return {
        ...state,
        currentIndex: nextIndex,
        status: 'answering',
        currentAnswer: null,
        validation: null,
      }
    }

    case 'RETRY_QUESTION': {
      // Permite tentar novamente a mesma questão com acolhimento
      return {
        ...state,
        status: 'answering',
        currentAnswer: null,
        validation: null,
      }
    }

    case 'SET_COMPLETED': {
      return {
        ...state,
        status: 'completed',
        lessonResult: action.result ?? null,
      }
    }

    case 'RESTART': {
      return {
        ...INITIAL_QUIZ_STATE,
        questions: state.questions,
        status: state.questions.length > 0 ? 'answering' : 'idle',
      }
    }

    default:
      return state
  }
}

/**
 * Funções puras de cálculo utilitárias
 */
export function calculateQuizProgress(currentIndex: number, totalQuestions: number): number {
  if (totalQuestions <= 0) return 0
  return Math.min(100, Math.round(((currentIndex) / totalQuestions) * 100))
}

export function isAnswerSelected(currentAnswer: unknown): boolean {
  if (currentAnswer === null || currentAnswer === undefined) return false
  if (typeof currentAnswer === 'string' && currentAnswer.trim() === '') return false
  if (Array.isArray(currentAnswer) && currentAnswer.length === 0) return false
  if (typeof currentAnswer === 'object' && Object.keys(currentAnswer).length === 0) return false
  return true
}
