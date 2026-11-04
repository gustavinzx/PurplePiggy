// src/features/learn/questions/questionGenerator.ts
// Gerador e Validador de Questões do Desafio Piggy (Lotes 1 a 4)

import type {
  LearnQuestion,
  LoteNumber,
  QuestionValidationResult,
  ConceptMatchingQuestion,
  OrderPrioritiesQuestion,
} from './types'
import { LOTE_1_QUESTIONS } from './lote1'
import { LOTE_2_QUESTIONS } from './lote2'
import { LOTE_3_QUESTIONS } from './lote3'
import { LOTE_4_QUESTIONS } from './lote4'

export const ALL_QUESTIONS: LearnQuestion[] = [
  ...LOTE_1_QUESTIONS,
  ...LOTE_2_QUESTIONS,
  ...LOTE_3_QUESTIONS,
  ...LOTE_4_QUESTIONS,
]

/**
 * Retorna todas as questões cadastradas nos 4 lotes
 */
export function getAllQuestions(): LearnQuestion[] {
  return ALL_QUESTIONS
}

/**
 * Filtra questões por Lote (1 a 4)
 */
export function getQuestionsByLote(lote: LoteNumber): LearnQuestion[] {
  return ALL_QUESTIONS.filter((q) => q.lote === lote)
}

/**
 * Retorna as questões de uma lição específica ordenadas por orderIndex
 */
export function getQuestionsByLesson(lessonSlug: string): LearnQuestion[] {
  const filtered = ALL_QUESTIONS.filter((q) => q.lessonSlug === lessonSlug)
  return filtered.sort((a, b) => a.orderIndex - b.orderIndex)
}

/**
 * Retorna as questões de uma trilha completa
 */
export function getQuestionsByTrack(trackSlug: string): LearnQuestion[] {
  return ALL_QUESTIONS.filter((q) => q.trackSlug === trackSlug)
}

/**
 * Seleciona determinística e rotativamente uma questão para o Desafio Rápido Diário
 */
export function getDailyChallengeQuestion(dateStr?: string): LearnQuestion {
  const dateKey = dateStr || new Date().toISOString().slice(0, 10)
  // Hash simples da string de data para índice fixo no dia
  let hash = 0
  for (let i = 0; i < dateKey.length; i++) {
    hash = (hash * 31 + dateKey.charCodeAt(i)) >>> 0
  }
  const index = hash % ALL_QUESTIONS.length
  return ALL_QUESTIONS[index]
}

/**
 * Validação tátil de respostas com base na tipologia pedagógica
 */
export function validateAnswer(
  question: LearnQuestion,
  userAnswer: unknown
): QuestionValidationResult {
  let isCorrect = false

  switch (question.typology) {
    case 'multiple_choice':
    case 'scenario_choice': {
      isCorrect = typeof userAnswer === 'number' && userAnswer === question.correctIndex
      break
    }

    case 'order_priorities': {
      const q = question as OrderPrioritiesQuestion
      if (Array.isArray(userAnswer)) {
        isCorrect =
          userAnswer.length === q.correctOrder.length &&
          userAnswer.every((item, idx) => String(item).trim() === String(q.correctOrder[idx]).trim())
      }
      break
    }

    case 'concept_matching': {
      const q = question as ConceptMatchingQuestion
      // userAnswer deve ser um array ou record de pares resolvidos { [left]: right }
      if (typeof userAnswer === 'object' && userAnswer !== null) {
        const answers = userAnswer as Record<string, string>
        isCorrect = q.pairs.every((pair) => answers[pair.left]?.trim() === pair.right.trim())
      }
      break
    }

    case 'fill_in_the_blank': {
      if (typeof userAnswer === 'string') {
        isCorrect =
          userAnswer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase()
      } else if (typeof userAnswer === 'number' && (question as any).options) {
        const opt = (question as any).options[userAnswer]
        isCorrect =
          typeof opt === 'string' &&
          opt.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase()
      }
      break
    }

    default:
      isCorrect = false
  }

  const feedbackTitle = isCorrect
    ? 'Excelente! Mandou muito bem!'
    : 'Quase lá! Veja a explicação:'

  return {
    isCorrect,
    feedbackTitle,
    explanation: question.explanation,
    mascotPose: isCorrect ? 'pig-success' : 'pig-retry',
  }
}
