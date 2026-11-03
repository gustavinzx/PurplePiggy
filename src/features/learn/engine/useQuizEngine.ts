// src/features/learn/engine/useQuizEngine.ts
// Hook stateful do Motor de Quiz com integração opcional ao learnService

import { useReducer, useCallback, useEffect } from 'react'
import type { LearnQuestion } from '../questions/types'
import {
  quizEngineReducer,
  INITIAL_QUIZ_STATE,
  calculateQuizProgress,
  isAnswerSelected,
} from './quizEngineReducer'
import { learnService } from '../services/learnService'

export interface UseQuizEngineOptions {
  questions: LearnQuestion[]
  lessonSlug?: string
  initialHearts?: number
  autoSubmitOnCompletion?: boolean
  onComplete?: (state: ReturnType<typeof useQuizEngine>) => void
}

export function useQuizEngine({
  questions,
  lessonSlug,
  initialHearts = 3,
  autoSubmitOnCompletion = true,
  onComplete,
}: UseQuizEngineOptions) {
  const [state, dispatch] = useReducer(quizEngineReducer, {
    ...INITIAL_QUIZ_STATE,
    questions,
    hearts: initialHearts,
    maxHearts: initialHearts,
    status: questions.length > 0 ? 'answering' : 'idle',
  })

  // Iniciar ou atualizar questões se mudarem
  useEffect(() => {
    if (questions && questions.length > 0) {
      dispatch({ type: 'START_QUIZ', questions, initialHearts })
    }
  }, [questions, initialHearts])

  // Submissão assíncrona ao concluir a lição
  useEffect(() => {
    if (state.status === 'completed' && autoSubmitOnCompletion && lessonSlug && !state.lessonResult) {
      learnService
        .completeLesson(lessonSlug)
        .then((res) => {
          dispatch({ type: 'SET_COMPLETED', result: res })
        })
        .catch(() => {
          // Mantém completado local
        })
    }
  }, [state.status, state.lessonResult, autoSubmitOnCompletion, lessonSlug])

  const selectAnswer = useCallback((answer: unknown) => {
    dispatch({ type: 'SELECT_ANSWER', answer })
  }, [])

  const verifyAnswer = useCallback(() => {
    dispatch({ type: 'VERIFY_ANSWER' })
  }, [])

  const nextQuestion = useCallback(() => {
    dispatch({ type: 'NEXT_QUESTION' })
  }, [])

  const retryQuestion = useCallback(() => {
    dispatch({ type: 'RETRY_QUESTION' })
  }, [])

  const restartQuiz = useCallback(() => {
    dispatch({ type: 'RESTART' })
  }, [])

  const currentQuestion: LearnQuestion | undefined = state.questions[state.currentIndex]
  const totalQuestions = state.questions.length
  const progressPercent = calculateQuizProgress(
    state.status === 'completed' ? totalQuestions : state.currentIndex,
    totalQuestions
  )
  const canVerify = state.status === 'answering' && isAnswerSelected(state.currentAnswer)

  return {
    state,
    currentQuestion,
    totalQuestions,
    currentIndex: state.currentIndex,
    status: state.status,
    currentAnswer: state.currentAnswer,
    validation: state.validation,
    hearts: state.hearts,
    maxHearts: state.maxHearts,
    earnedXp: state.earnedXp,
    earnedCoins: state.earnedCoins,
    progressPercent,
    canVerify,
    selectAnswer,
    verifyAnswer,
    nextQuestion,
    retryQuestion,
    restartQuiz,
  }
}
