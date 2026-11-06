// src/features/learn/questions/questionGenerator.ts
// Gerador e Validador de Questões do Desafio Piggy (Lotes 1 a 4)

import type {
  LearnQuestion,
  LoteNumber,
  QuestionValidationResult,
  ConceptMatchingQuestion,
  OrderPrioritiesQuestion,
  MultipleChoiceQuestion,
  ScenarioChoiceQuestion,
  FillInTheBlankQuestion,
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
 * Embaralha um array usando Fisher-Yates
 */
function fisherYatesShuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = copy[i]
    copy[i] = copy[j]
    copy[j] = temp
  }
  return copy
}

/**
 * Embaralha dinamicamente as opções de uma questão mantendo a referência exata da resposta correta
 */
export function shuffleQuestionOptions(question: LearnQuestion, preferredIndex?: number): LearnQuestion {
  if (question.typology === 'multiple_choice' || question.typology === 'scenario_choice') {
    const q = question as MultipleChoiceQuestion | ScenarioChoiceQuestion
    const correctOptionText = q.options[q.correctIndex]
    let shuffled = fisherYatesShuffle(q.options)

    // Se preferredIndex for fornecido, garante que a resposta correta fique em posição variada
    if (typeof preferredIndex === 'number' && shuffled.length > 1) {
      const targetPos = preferredIndex % shuffled.length
      const currentPos = shuffled.indexOf(correctOptionText)
      if (currentPos !== -1 && currentPos !== targetPos) {
        const temp = shuffled[targetPos]
        shuffled[targetPos] = shuffled[currentPos]
        shuffled[currentPos] = temp
      }
    }

    const newCorrectIndex = shuffled.indexOf(correctOptionText)
    return {
      ...q,
      options: shuffled,
      correctIndex: newCorrectIndex >= 0 ? newCorrectIndex : q.correctIndex,
    } as LearnQuestion
  }

  if (question.typology === 'fill_in_the_blank') {
    const q = question as FillInTheBlankQuestion
    let shuffled = fisherYatesShuffle(q.options)
    // Evita deixar a resposta certa sempre na posição 0
    if (shuffled.length > 1 && shuffled[0] === q.correctAnswer && Math.random() < 0.75) {
      const swapIdx = 1 + Math.floor(Math.random() * (shuffled.length - 1))
      const temp = shuffled[0]
      shuffled[0] = shuffled[swapIdx]
      shuffled[swapIdx] = temp
    }
    return {
      ...q,
      options: shuffled,
    }
  }

  if (question.typology === 'order_priorities') {
    const q = question as OrderPrioritiesQuestion
    let shuffled = fisherYatesShuffle(q.items)
    // Garante que nunca comece já na ordem correta
    if (shuffled.length > 1 && JSON.stringify(shuffled) === JSON.stringify(q.correctOrder)) {
      shuffled = [...shuffled.slice(1), shuffled[0]]
    }
    return {
      ...q,
      items: shuffled,
    }
  }

  return question
}

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
 * Retorna as questões de uma lição específica ordenadas por orderIndex e com alternativas embaralhadas
 */
export function getQuestionsByLesson(lessonSlug: string): LearnQuestion[] {
  const filtered = ALL_QUESTIONS.filter((q) => q.lessonSlug === lessonSlug)
  const sorted = filtered.sort((a, b) => a.orderIndex - b.orderIndex)
  const sessionOffset = Math.floor(Math.random() * 3) + 1
  return sorted.map((q, idx) => shuffleQuestionOptions(q, idx + sessionOffset))
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
