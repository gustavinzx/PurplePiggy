import { describe, it, expect } from 'vitest'
import {
  resolveGoalIconKey,
  getGoalIconMeta,
  calculateGoalCardMetrics,
  GOAL_ICONS,
  GOAL_ICON_LIST,
} from './goals'

describe('goals selector and icon mapper (V2 Metas)', () => {
  it('contém exatamente 8 opções de ícones V2 cadastrados', () => {
    expect(GOAL_ICON_LIST).toHaveLength(8)
    const keys = GOAL_ICON_LIST.map((item) => item.key)
    expect(keys).toEqual(['trip', 'laptop', 'gym', 'home', 'car', 'study', 'star', 'bau'])
  })

  it('mapeia emojis legados corretamente para as chaves oficiais', () => {
    expect(resolveGoalIconKey('✈️')).toBe('trip')
    expect(resolveGoalIconKey('💻')).toBe('laptop')
    expect(resolveGoalIconKey('💪')).toBe('gym')
    expect(resolveGoalIconKey('🏋️')).toBe('gym')
    expect(resolveGoalIconKey('🏠')).toBe('home')
    expect(resolveGoalIconKey('🚗')).toBe('car')
    expect(resolveGoalIconKey('🎓')).toBe('study')
    expect(resolveGoalIconKey('⭐')).toBe('star')
  })

  it('mapeia chaves em texto e categorias legadas', () => {
    expect(resolveGoalIconKey('trip')).toBe('trip')
    expect(resolveGoalIconKey('travel')).toBe('trip')
    expect(resolveGoalIconKey('notebook')).toBe('laptop')
    expect(resolveGoalIconKey('academia')).toBe('gym')
    expect(resolveGoalIconKey('casa')).toBe('home')
    expect(resolveGoalIconKey('carro')).toBe('car')
    expect(resolveGoalIconKey('course')).toBe('study')
    expect(resolveGoalIconKey('emergency')).toBe('bau')
    expect(resolveGoalIconKey('reserva')).toBe('bau')
  })

  it('usa o nome da meta como fallback inteligente se o ícone for nulo ou star', () => {
    expect(resolveGoalIconKey(null, 'Viagem dos sonhos')).toBe('trip')
    expect(resolveGoalIconKey('', 'Novo notebook')).toBe('laptop')
    expect(resolveGoalIconKey(undefined, 'Academia anual')).toBe('gym')
    expect(resolveGoalIconKey(null, 'Entrada da casa própria')).toBe('home')
    expect(resolveGoalIconKey(null, 'Comprar carro')).toBe('car')
    expect(resolveGoalIconKey(null, 'Curso de React')).toBe('study')
    expect(resolveGoalIconKey(null, 'Reserva de emergência')).toBe('bau')
  })

  it('retorna fallback star para metas genéricas sem match', () => {
    expect(resolveGoalIconKey(null, 'Qualquer coisa')).toBe('star')
    expect(resolveGoalIconKey('desconhecido', 'Meta surpresa')).toBe('star')
  })

  it('getGoalIconMeta retorna os metadados corretos de asset e tile', () => {
    const tripMeta = getGoalIconMeta('trip')
    expect(tripMeta.key).toBe('trip')
    expect(tripMeta.src).toBe('/assets/icons/icon-goal-trip.webp')
    expect(tripMeta.bg).toBe('bg-[#DEEEFC]')

    const bauMeta = getGoalIconMeta('emergency')
    expect(bauMeta.key).toBe('bau')
    expect(bauMeta.src).toBe('/assets/icons/icon-bau.png')
  })

  it('calculateGoalCardMetrics calcula métricas, porcentagem e textos monetários', () => {
    const metrics = calculateGoalCardMetrics({
      saved_amount: 1750,
      target_amount: 5000,
    })

    expect(metrics.saved).toBe(1750)
    expect(metrics.target).toBe(5000)
    expect(metrics.remaining).toBe(3250)
    expect(metrics.progressPct).toBe(35)
    expect(metrics.isCompleted).toBe(false)
    expect(metrics.formattedRemaining).toContain('3.250,00')
  })

  it('calculateGoalCardMetrics lida com meta 100% atingida ou superada', () => {
    const metrics = calculateGoalCardMetrics({
      saved_amount: 6000,
      target_amount: 5000,
    })

    expect(metrics.remaining).toBe(0)
    expect(metrics.progressPct).toBe(100)
    expect(metrics.isCompleted).toBe(true)
  })
})
