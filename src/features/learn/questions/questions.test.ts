// src/features/learn/questions/questions.test.ts
import { describe, it, expect } from 'vitest'
import {
  getAllQuestions,
  getQuestionsByLote,
  getQuestionsByLesson,
  getQuestionsByTrack,
  getDailyChallengeQuestion,
  validateAnswer,
} from './index'
import type {
  MultipleChoiceQuestion,
  ScenarioChoiceQuestion,
  OrderPrioritiesQuestion,
  ConceptMatchingQuestion,
  FillInTheBlankQuestion,
} from './types'

describe('Banco de Questões do Desafio Piggy (Prompt N7)', () => {
  const all = getAllQuestions()

  it('deve possuir questões cadastradas em todos os 4 lotes', () => {
    expect(all.length).toBeGreaterThanOrEqual(16)

    const lote1 = getQuestionsByLote(1)
    const lote2 = getQuestionsByLote(2)
    const lote3 = getQuestionsByLote(3)
    const lote4 = getQuestionsByLote(4)

    expect(lote1.length).toBeGreaterThan(0)
    expect(lote2.length).toBeGreaterThan(0)
    expect(lote3.length).toBeGreaterThan(0)
    expect(lote4.length).toBeGreaterThan(0)

    expect(lote1.length + lote2.length + lote3.length + lote4.length).toBe(all.length)
  })

  it('deve cobrir todas as 8 trilhas oficiais do PurplePiggy', () => {
    const tracks = [
      'organizacao-financeira',
      'juros-sem-misterio',
      'cartao-de-credito',
      'reserva-de-emergencia',
      'planejamento-financeiro',
      'consumo-consciente',
      'golpes-financeiros',
      'economia-domestica',
    ]

    for (const track of tracks) {
      const q = getQuestionsByTrack(track)
      expect(q.length).toBeGreaterThan(0)
    }
  })

  it('deve garantir que cada questão possui campos pedagógicos obrigatórios preenchidos', () => {
    for (const q of all) {
      expect(q.id).toBeTruthy()
      expect(q.lessonSlug).toBeTruthy()
      expect(q.trackSlug).toBeTruthy()
      expect(q.prompt).toBeTruthy()
      expect(q.explanation).toBeTruthy()
      expect([1, 2, 3, 4]).toContain(q.lote)
      expect([
        'multiple_choice',
        'scenario_choice',
        'order_priorities',
        'concept_matching',
        'fill_in_the_blank',
      ]).toContain(q.typology)
    }
  })

  it('não deve ter todas as respostas corretas na primeira posição (correctIndex variado e embaralhamento ativo)', () => {
    const choiceQuestions = all.filter(
      (q) => q.typology === 'multiple_choice' || q.typology === 'scenario_choice'
    ) as Array<MultipleChoiceQuestion | ScenarioChoiceQuestion>

    const nonZeroCount = choiceQuestions.filter((q) => q.correctIndex !== 0).length
    expect(nonZeroCount).toBe(choiceQuestions.length)

    // Verifica que getQuestionsByLesson mantém a validação exata após embaralhar
    const lessonQuestions = getQuestionsByLesson('para-onde-vai-meu-dinheiro')
    for (const q of lessonQuestions) {
      if (q.typology === 'multiple_choice' || q.typology === 'scenario_choice') {
        expect(validateAnswer(q, q.correctIndex).isCorrect).toBe(true)
      }
    }
  })

  it('deve validar corretamente questões de Múltipla Escolha Rápida (multiple_choice)', () => {
    const mc = all.find((q) => q.typology === 'multiple_choice') as MultipleChoiceQuestion
    expect(mc).toBeDefined()

    const correctRes = validateAnswer(mc, mc.correctIndex)
    expect(correctRes.isCorrect).toBe(true)
    expect(correctRes.mascotPose).toBe('pig-success')
    expect(correctRes.feedbackTitle).toContain('Excelente')

    const wrongIndex = (mc.correctIndex + 1) % mc.options.length
    const wrongRes = validateAnswer(mc, wrongIndex)
    expect(wrongRes.isCorrect).toBe(false)
    expect(wrongRes.mascotPose).toBe('pig-retry')
    expect(wrongRes.feedbackTitle).toContain('Quase lá')
  })

  it('deve validar corretamente Cenários do Cotidiano (scenario_choice)', () => {
    const sc = all.find((q) => q.typology === 'scenario_choice') as ScenarioChoiceQuestion
    expect(sc).toBeDefined()
    expect(sc.options.length).toBe(2)
    expect(sc.scenarioText).toBeTruthy()

    const correctRes = validateAnswer(sc, sc.correctIndex)
    expect(correctRes.isCorrect).toBe(true)

    const wrongRes = validateAnswer(sc, 1 - sc.correctIndex)
    expect(wrongRes.isCorrect).toBe(false)
  })

  it('deve validar Ordenação de Prioridades (order_priorities)', () => {
    const op = all.find((q) => q.typology === 'order_priorities') as OrderPrioritiesQuestion
    expect(op).toBeDefined()

    const correctRes = validateAnswer(op, op.correctOrder)
    expect(correctRes.isCorrect).toBe(true)

    const wrongOrder = [...op.correctOrder].reverse()
    const wrongRes = validateAnswer(op, wrongOrder)
    expect(wrongRes.isCorrect).toBe(false)
  })

  it('deve validar Pareamento de Conceitos (concept_matching)', () => {
    const cm = all.find((q) => q.typology === 'concept_matching') as ConceptMatchingQuestion
    expect(cm).toBeDefined()
    expect(cm.pairs.length).toBeGreaterThan(1)

    const correctPairs: Record<string, string> = {}
    for (const p of cm.pairs) {
      correctPairs[p.left] = p.right
    }

    const correctRes = validateAnswer(cm, correctPairs)
    expect(correctRes.isCorrect).toBe(true)

    const wrongPairs = { ...correctPairs, [cm.pairs[0].left]: 'Incorreto' }
    const wrongRes = validateAnswer(cm, wrongPairs)
    expect(wrongRes.isCorrect).toBe(false)
  })

  it('deve validar Preenchimento de Lacunas (fill_in_the_blank)', () => {
    const fb = all.find((q) => q.typology === 'fill_in_the_blank') as FillInTheBlankQuestion
    expect(fb).toBeDefined()
    expect(fb.sentence).toContain('___')

    const correctRes = validateAnswer(fb, fb.correctAnswer)
    expect(correctRes.isCorrect).toBe(true)

    const wrongRes = validateAnswer(fb, 'palavra-aleatoria-errada')
    expect(wrongRes.isCorrect).toBe(false)
  })

  it('deve retornar questões ordenadas para uma lição via getQuestionsByLesson', () => {
    const questions = getQuestionsByLesson('para-onde-vai-meu-dinheiro')
    expect(questions.length).toBeGreaterThanOrEqual(2)
    for (let i = 1; i < questions.length; i++) {
      expect(questions[i].orderIndex).toBeGreaterThanOrEqual(questions[i - 1].orderIndex)
    }
  })

  it('deve retornar determinística e rotativamente a questão do Desafio Diário', () => {
    const q1 = getDailyChallengeQuestion('2026-11-03')
    const q2 = getDailyChallengeQuestion('2026-11-03')
    expect(q1.id).toBe(q2.id)

    const qNextDay = getDailyChallengeQuestion('2026-11-04')
    expect(qNextDay).toBeDefined()
  })
})
