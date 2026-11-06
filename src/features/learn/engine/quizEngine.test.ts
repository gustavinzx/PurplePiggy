// src/features/learn/engine/quizEngine.test.ts
import { describe, it, expect } from 'vitest'
import {
  quizEngineReducer,
  INITIAL_QUIZ_STATE,
  calculateQuizProgress,
  isAnswerSelected,
} from './quizEngineReducer'
import type { LearnQuestion } from '../questions/types'

const mockQuestions: LearnQuestion[] = [
  {
    id: 'mock-1',
    lessonSlug: 'test-lesson',
    trackSlug: 'test-track',
    lote: 1,
    typology: 'multiple_choice',
    orderIndex: 1,
    prompt: 'Qual a resposta certa?',
    options: ['Opção A (Correta)', 'Opção B', 'Opção C'],
    correctIndex: 0,
    explanation: 'A opção A é a correta.',
  },
  {
    id: 'mock-2',
    lessonSlug: 'test-lesson',
    trackSlug: 'test-track',
    lote: 1,
    typology: 'scenario_choice',
    orderIndex: 2,
    prompt: 'Cenário de teste',
    scenarioText: 'Situação de teste prático',
    options: ['Opção 1', 'Opção 2 (Correta)'],
    correctIndex: 1,
    explanation: 'A opção 2 é a melhor escolha.',
  },
]

describe('Motor do Quiz (Prompt N8 - Funções Puras e Reducer)', () => {
  it('deve inicializar o quiz no estado answering', () => {
    const state = quizEngineReducer(INITIAL_QUIZ_STATE, {
      type: 'START_QUIZ',
      questions: mockQuestions,
      initialHearts: 3,
    })

    expect(state.status).toBe('answering')
    expect(state.currentIndex).toBe(0)
    expect(state.hearts).toBe(3)
    expect(state.currentAnswer).toBeNull()
  })

  it('deve registrar a seleção de resposta pelo usuário', () => {
    let state = quizEngineReducer(INITIAL_QUIZ_STATE, {
      type: 'START_QUIZ',
      questions: mockQuestions,
    })

    state = quizEngineReducer(state, {
      type: 'SELECT_ANSWER',
      answer: 0,
    })

    expect(state.currentAnswer).toBe(0)
  })

  it('deve validar acerto, conceder moedas/XP e mudar status para correct', () => {
    let state = quizEngineReducer(INITIAL_QUIZ_STATE, {
      type: 'START_QUIZ',
      questions: mockQuestions,
    })

    state = quizEngineReducer(state, { type: 'SELECT_ANSWER', answer: 0 })
    state = quizEngineReducer(state, { type: 'VERIFY_ANSWER' })

    expect(state.status).toBe('correct')
    expect(state.validation?.isCorrect).toBe(true)
    expect(state.validation?.mascotPose).toBe('pig-success')
    expect(state.correctCount).toBe(1)
    expect(state.earnedCoins).toBe(10)
    expect(state.earnedXp).toBe(20)
    expect(state.hearts).toBe(3)
  })

  it('deve avançar para a próxima questão via NEXT_QUESTION', () => {
    let state = quizEngineReducer(INITIAL_QUIZ_STATE, {
      type: 'START_QUIZ',
      questions: mockQuestions,
    })

    state = quizEngineReducer(state, { type: 'SELECT_ANSWER', answer: 0 })
    state = quizEngineReducer(state, { type: 'VERIFY_ANSWER' })
    state = quizEngineReducer(state, { type: 'NEXT_QUESTION' })

    expect(state.currentIndex).toBe(1)
    expect(state.status).toBe('answering')
    expect(state.currentAnswer).toBeNull()
    expect(state.validation).toBeNull()
  })

  it('deve deduzir 1 coração no erro e mudar status para incorrect', () => {
    let state = quizEngineReducer(INITIAL_QUIZ_STATE, {
      type: 'START_QUIZ',
      questions: mockQuestions,
    })

    state = quizEngineReducer(state, { type: 'SELECT_ANSWER', answer: 2 }) // Errada
    state = quizEngineReducer(state, { type: 'VERIFY_ANSWER' })

    expect(state.status).toBe('incorrect')
    expect(state.validation?.isCorrect).toBe(false)
    expect(state.validation?.mascotPose).toBe('pig-retry')
    expect(state.hearts).toBe(2)
    expect(state.mistakesCount).toBe(1)
  })

  it('deve acionar game_over quando os corações chegam a zero', () => {
    let state = quizEngineReducer(INITIAL_QUIZ_STATE, {
      type: 'START_QUIZ',
      questions: mockQuestions,
      initialHearts: 1, // apenas 1 coração
    })

    state = quizEngineReducer(state, { type: 'SELECT_ANSWER', answer: 2 })
    state = quizEngineReducer(state, { type: 'VERIFY_ANSWER' })

    expect(state.status).toBe('game_over')
    expect(state.hearts).toBe(0)
  })

  it('deve concluir o quiz com completed na última questão', () => {
    let state = quizEngineReducer(INITIAL_QUIZ_STATE, {
      type: 'START_QUIZ',
      questions: mockQuestions,
    })

    // Questão 1: acerta
    state = quizEngineReducer(state, { type: 'SELECT_ANSWER', answer: 0 })
    state = quizEngineReducer(state, { type: 'VERIFY_ANSWER' })
    state = quizEngineReducer(state, { type: 'NEXT_QUESTION' })

    // Questão 2 (última): acerta
    state = quizEngineReducer(state, { type: 'SELECT_ANSWER', answer: 1 })
    state = quizEngineReducer(state, { type: 'VERIFY_ANSWER' })
    state = quizEngineReducer(state, { type: 'NEXT_QUESTION' })

    expect(state.status).toBe('completed')
    expect(state.correctCount).toBe(2)
  })

  it('Passo 1: deve empurrar questão com erro para o fim da fila e só concluir ao esvaziar', () => {
    let state = quizEngineReducer(INITIAL_QUIZ_STATE, {
      type: 'START_QUIZ',
      questions: mockQuestions, // 2 questões
      initialHearts: 3,
    })

    // 1. Erra a Questão 1
    state = quizEngineReducer(state, { type: 'SELECT_ANSWER', answer: 2 }) // Errada
    state = quizEngineReducer(state, { type: 'VERIFY_ANSWER' })

    expect(state.status).toBe('incorrect')
    expect(state.questions.length).toBe(3) // mock-1 clonada no final (índice 2)
    expect(state.questions[2].id).toContain('retry')

    // Avança para a Questão 2
    state = quizEngineReducer(state, { type: 'NEXT_QUESTION' })
    expect(state.currentIndex).toBe(1)
    expect(state.status).toBe('answering')

    // 2. Acerta a Questão 2
    state = quizEngineReducer(state, { type: 'SELECT_ANSWER', answer: 1 }) // Correta
    state = quizEngineReducer(state, { type: 'VERIFY_ANSWER' })
    expect(state.status).toBe('correct')

    // Avança para a Questão 3 (que é a Questão 1 reaparecendo no fim da fila)
    state = quizEngineReducer(state, { type: 'NEXT_QUESTION' })
    expect(state.currentIndex).toBe(2)
    expect(state.status).toBe('answering')
    expect(state.questions[state.currentIndex].prompt).toBe(mockQuestions[0].prompt)

    // 3. Agora acerta a questão de repetição
    state = quizEngineReducer(state, { type: 'SELECT_ANSWER', answer: 0 }) // Correta
    state = quizEngineReducer(state, { type: 'VERIFY_ANSWER' })
    expect(state.status).toBe('correct')

    // Avança e conclui porque a fila esvaziou!
    state = quizEngineReducer(state, { type: 'NEXT_QUESTION' })
    expect(state.status).toBe('completed')
  })

  it('deve calcular corretamente a barra de progresso elástica', () => {
    expect(calculateQuizProgress(0, 4)).toBe(0)
    expect(calculateQuizProgress(1, 4)).toBe(25)
    expect(calculateQuizProgress(2, 4)).toBe(50)
    expect(calculateQuizProgress(4, 4)).toBe(100)
  })

  it('deve verificar com precisão se uma resposta foi selecionada', () => {
    expect(isAnswerSelected(null)).toBe(false)
    expect(isAnswerSelected(undefined)).toBe(false)
    expect(isAnswerSelected('')).toBe(false)
    expect(isAnswerSelected([])).toBe(false)
    expect(isAnswerSelected({})).toBe(false)

    expect(isAnswerSelected(0)).toBe(true)
    expect(isAnswerSelected('texto')).toBe(true)
    expect(isAnswerSelected(['item1'])).toBe(true)
    expect(isAnswerSelected({ a: 'b' })).toBe(true)
  })
})
