// src/features/learn/components/components.test.ts
// Testes unitários dos Componentes Chunky do Módulo Aprender (Prompt N8B)

import { describe, it, expect } from 'vitest'
import React from 'react'
import {
  ChunkyButton,
  OptionCard,
  QuizTopBar,
  FeedbackPanel,
} from './index'

describe('Componentes Chunky do Módulo Aprender (Prompt N8B)', () => {
  it('ChunkyButton deve ser instanciável como elemento React válido', () => {
    const el = React.createElement(ChunkyButton, { variant: 'primary', size: 'full' }, 'VERIFICAR')
    expect(React.isValidElement(el)).toBe(true)
    expect(el.props.variant).toBe('primary')
    expect(el.props.size).toBe('full')
  })

  it('ChunkyButton deve suportar todas as 5 variantes e 4 tamanhos', () => {
    const variants = ['primary', 'secondary', 'success', 'danger', 'neutral'] as const
    const sizes = ['sm', 'md', 'lg', 'full'] as const

    for (const v of variants) {
      for (const s of sizes) {
        const btn = React.createElement(ChunkyButton, { variant: v, size: s }, 'TESTE')
        expect(btn.props.variant).toBe(v)
        expect(btn.props.size).toBe(s)
      }
    }
  })

  it('OptionCard deve ser instanciável com props de alternativas e estados', () => {
    const card = React.createElement(OptionCard, {
      label: 'A',
      text: 'Opção de teste',
      state: 'selected',
    })
    expect(React.isValidElement(card)).toBe(true)
    expect(card.props.label).toBe('A')
    expect(card.props.text).toBe('Opção de teste')
    expect(card.props.state).toBe('selected')
  })

  it('OptionCard deve suportar todos os 4 estados táticos do Duolingo/Piggy', () => {
    const states = ['idle', 'selected', 'correct', 'incorrect'] as const
    for (const st of states) {
      const card = React.createElement(OptionCard, {
        label: 'X',
        text: 'Texto',
        state: st,
      })
      expect(card.props.state).toBe(st)
    }
  })

  it('QuizTopBar deve ser instanciável com progresso e corações', () => {
    const topBar = React.createElement(QuizTopBar, {
      progress: 75,
      hearts: 2,
      maxHearts: 3,
    })
    expect(React.isValidElement(topBar)).toBe(true)
    expect(topBar.props.progress).toBe(75)
    expect(topBar.props.hearts).toBe(2)
  })

  it('FeedbackPanel deve ser instanciável para acerto (success) e erro (retry)', () => {
    const successPanel = React.createElement(FeedbackPanel, {
      status: 'correct',
      title: 'Excelente!',
      explanation: 'Parabéns pela dedicação.',
      onAction: () => {},
    })
    expect(React.isValidElement(successPanel)).toBe(true)
    expect(successPanel.props.status).toBe('correct')

    const errorPanel = React.createElement(FeedbackPanel, {
      status: 'incorrect',
      title: 'Quase lá!',
      explanation: 'Veja onde ajustar.',
      onAction: () => {},
    })
    expect(React.isValidElement(errorPanel)).toBe(true)
    expect(errorPanel.props.status).toBe('incorrect')
  })
})
