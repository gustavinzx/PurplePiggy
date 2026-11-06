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

  it('deve consumir Streak Freeze e proteger a ofensiva caso o usuário tenha faltado', async () => {
    // Configura usuário com streak de 5 e 1 escudo, mas cuja última atividade foi há 2 dias
    const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10)
    mockLocalStorage.setItem(
      'purplepiggy_learn_stats',
      JSON.stringify({
        streak_count: 5,
        longest_streak: 5,
        last_activity_date: twoDaysAgo,
        piggy_coins: 100,
        xp_points: 200,
        hearts: 3,
        streak_shields: 1,
        active_track_slug: 'organizacao-financeira',
      })
    )

    const stats = await learnService.getStats()
    expect(stats.streak_count).toBe(5) // Ofensiva preservada!
    expect(stats.streak_shields).toBe(0) // 1 escudo consumido!
    expect(stats.freeze_used_today).toBe(true)
  })

  it('deve registrar erros e retornar os exercícios mais errados no Motor de Prática (Passo 3)', async () => {
    await learnService.recordMistake('ex-1', 'orcamento')
    await learnService.recordMistake('ex-1', 'orcamento')
    await learnService.recordMistake('ex-2', 'juros')

    const topMistakes = await learnService.getReviewExercises(5)
    expect(topMistakes.length).toBeGreaterThanOrEqual(2)
    expect(topMistakes[0].exercise_id).toBe('ex-1')
    expect(topMistakes[0].mistake_count).toBe(2)
    expect(topMistakes[1].exercise_id).toBe('ex-2')
    expect(topMistakes[1].mistake_count).toBe(1)
  })
  it('deve debitar vida e recarregar vidas via RPC ou fallback sem update direto', async () => {
    const remaining = await learnService.deductHeart()
    expect(remaining).toBe(2)

    await learnService.claimChest('organizacao-financeira', 1)
    const recharge = await learnService.rechargeHearts()
    expect(recharge.success).toBe(true)
    expect(recharge.hearts).toBe(3)
  })

  it('deve proteger dados do ranking e devolver campos seguros (LGPD)', async () => {
    const leaderboard = await learnService.getWeeklyLeaderboard(10)
    expect(Array.isArray(leaderboard)).toBe(true)
    for (const entry of leaderboard) {
      expect(entry).toHaveProperty('rank')
      expect(entry).toHaveProperty('nickname')
      expect(entry).toHaveProperty('weekly_xp')
      expect(entry).toHaveProperty('is_current_user')
      expect(entry.nickname).not.toContain('@')
    }
  })
});