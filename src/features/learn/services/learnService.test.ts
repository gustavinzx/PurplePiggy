// src/features/learn/services/learnService.test.ts
import { describe, it, expect, beforeEach, beforeAll } from 'vitest'
import { learnService } from './learnService'

// In-memory mock para localStorage no ambiente Node do Vitest
const storage = new Map<string, string>()
const mockLocalStorage = {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, value),
  removeItem: (key: string) => storage.delete(key),
  clear: () => storage.clear(),
}

beforeAll(() => {
  globalThis.localStorage = mockLocalStorage as unknown as Storage
})

describe('Serviço do Módulo Aprender (learnService - Prompt N5)', () => {
  beforeEach(() => {
    mockLocalStorage.clear()
  })

  it('deve obter estatísticas iniciais com valores padrão', async () => {
    const stats = await learnService.getStats()
    expect(stats.streak_count).toBe(0)
    expect(stats.piggy_coins).toBe(0)
    expect(stats.xp_points).toBe(0)
    expect(stats.hearts).toBe(3)
    expect(stats.active_track_slug).toBe('organizacao-financeira')
  })

  it('deve concluir lição, incrementar streak e creditar moedas/XP', async () => {
    const res = await learnService.completeLesson('para-onde-vai-meu-dinheiro')
    expect(res.success).toBe(true)
    expect(res.coins_earned).toBeGreaterThan(0)
    expect(res.xp_earned).toBeGreaterThan(0)
    expect(res.current_streak).toBe(1)
    expect(res.total_coins).toBeGreaterThanOrEqual(10)

    const updated = await learnService.getStats()
    expect(updated.piggy_coins).toBe(res.total_coins)
    expect(updated.streak_count).toBe(1)
  })

  it('deve resgatar baú de tesouro e somar +50 moedas', async () => {
    const res = await learnService.claimChest('organizacao-financeira', 1)
    expect(res.success).toBe(true)
    expect(res.coins_earned).toBe(50)
    expect(res.total_coins).toBe(50)

    const updated = await learnService.getStats()
    expect(updated.piggy_coins).toBe(50)
  })

  it('deve comprar escudo de ofensiva quando tiver moedas suficientes', async () => {
    // Primeiro ganha moedas com um baú
    await learnService.claimChest('organizacao-financeira', 1) // +50 moedas

    const buyRes = await learnService.buyShield()
    expect(buyRes.success).toBe(true)

    const updated = await learnService.getStats()
    expect(updated.piggy_coins).toBe(0)
    expect(updated.streak_shields).toBe(1)
  })

  it('deve rejeitar compra de escudo se moedas forem insuficientes', async () => {
    const buyRes = await learnService.buyShield()
    expect(buyRes.success).toBe(false)
  })
})
