// src/features/learn/services/learnService.ts
// Serviço unificado de interação com o banco Supabase e fallback local para o Desafio Piggy

import { supabase } from '../../../lib/supabase'
import {
  getQuestionsByLesson,
  getDailyChallengeQuestion,
  type LearnQuestion,
} from '../questions'

export interface LearnStats {
  user_id?: string
  streak_count: number
  longest_streak: number
  last_activity_date: string | null
  piggy_coins: number
  xp_points: number
  weekly_xp?: number
  hearts: number
  streak_shields: number
  active_track_slug: string
  freeze_used_today?: boolean
}

export interface ReviewExercise {
  exercise_id: string
  concept_tag: string
  mistake_count: number
  last_mistake_at?: string
}

export interface LeaderboardEntry {
  rank: number
  user_id: string
  display_name: string
  avatar_url: string | null
  weekly_xp: number
  is_current_user: boolean
}

export interface LessonCompletionResult {
  success: boolean
  newly_completed: boolean
  coins_earned: number
  xp_earned: number
  current_streak: number
  longest_streak: number
  total_coins: number
  total_xp: number
  hearts: number
}

export interface ChestClaimResult {
  success: boolean
  already_claimed: boolean
  coins_earned: number
  total_coins: number
}

export interface DailyChallengeResult {
  success: boolean
  already_completed: boolean
  coins_earned: number
  xp_earned: number
  current_streak: number
  longest_streak: number
  total_coins: number
  total_xp: number
}

const LOCAL_STORAGE_KEY = 'purplepiggy_learn_stats'

function getLocalStats(): LearnStats {
  const fallback: LearnStats = {
    streak_count: 0,
    longest_streak: 0,
    last_activity_date: null,
    piggy_coins: 0,
    xp_points: 0,
    weekly_xp: 0,
    hearts: 3,
    streak_shields: 0,
    active_track_slug: 'organizacao-financeira',
  }
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as LearnStats
        const today = new Date().toISOString().slice(0, 10)
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

        // Se o usuário tinha ofensiva ativa e perdeu ontem
        if (parsed.streak_count > 0 && parsed.last_activity_date && parsed.last_activity_date < yesterday) {
          if (parsed.streak_shields > 0) {
            parsed.streak_shields -= 1
            parsed.last_activity_date = yesterday
            parsed.freeze_used_today = true
          } else {
            parsed.streak_count = 0
          }
        }
        return parsed
      }
    }
  } catch {
    // ignore
  }
  return fallback
}

function saveLocalStats(stats: LearnStats) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stats))
    }
  } catch {
    // ignore
  }
}

export const learnService = {
  /**
   * Obtém as estatísticas do usuário (via RPC Supabase ou fallback offline)
   */
  async getStats(): Promise<LearnStats> {
    try {
      const { data, error } = await supabase.rpc('get_learn_user_stats')
      if (!error && data) {
        const stats = data as unknown as LearnStats
        saveLocalStats(stats)
        return stats
      }
    } catch {
      // fallback
    }
    return getLocalStats()
  },

  /**
   * Conclui uma lição com registro de streak e recompensas
   */
  async completeLesson(lessonSlug: string): Promise<LessonCompletionResult> {
    try {
      const { data, error } = await supabase.rpc('complete_learn_lesson', {
        p_lesson_slug: lessonSlug,
      })
      if (!error && data) {
        const res = data as unknown as LessonCompletionResult
        const local = getLocalStats()
        local.piggy_coins = res.total_coins
        local.xp_points = res.total_xp
        local.streak_count = res.current_streak
        local.longest_streak = res.longest_streak
        local.hearts = res.hearts
        saveLocalStats(local)
        return res
      }
    } catch {
      // fallback
    }

    // Fallback offline resiliente
    const local = getLocalStats()
    const today = new Date().toISOString().slice(0, 10)
    let streak = local.streak_count
    if (local.last_activity_date !== today) {
      streak += 1
      local.last_activity_date = today
    }
    local.streak_count = streak
    local.longest_streak = Math.max(local.longest_streak, streak)
    local.piggy_coins += 10
    local.xp_points += 20
    saveLocalStats(local)

    return {
      success: true,
      newly_completed: true,
      coins_earned: 10,
      xp_earned: 20,
      current_streak: local.streak_count,
      longest_streak: local.longest_streak,
      total_coins: local.piggy_coins,
      total_xp: local.xp_points,
      hearts: local.hearts,
    }
  },

  /**
   * Resgata um baú de tesouro (+50 moedas)
   */
  async claimChest(trackSlug: string, chestIndex: number): Promise<ChestClaimResult> {
    try {
      const { data, error } = await supabase.rpc('claim_learn_chest', {
        p_track_slug: trackSlug,
        p_chest_index: chestIndex,
      })
      if (!error && data) {
        return data as unknown as ChestClaimResult
      }
    } catch {
      // fallback
    }

    const local = getLocalStats()
    local.piggy_coins += 50
    saveLocalStats(local)
    return {
      success: true,
      already_claimed: false,
      coins_earned: 50,
      total_coins: local.piggy_coins,
    }
  },

  /**
   * Conclui o Desafio Rápido Diário
   */
  async completeDailyChallenge(): Promise<DailyChallengeResult> {
    try {
      const { data, error } = await supabase.rpc('complete_daily_learn_challenge')
      if (!error && data) {
        return data as unknown as DailyChallengeResult
      }
    } catch {
      // fallback
    }

    const local = getLocalStats()
    local.piggy_coins += 15
    local.xp_points += 25
    saveLocalStats(local)
    return {
      success: true,
      already_completed: false,
      coins_earned: 15,
      xp_earned: 25,
      current_streak: local.streak_count,
      longest_streak: local.longest_streak,
      total_coins: local.piggy_coins,
      total_xp: local.xp_points,
    }
  },

  /**
   * Adquire um escudo de ofensiva (custa 50 moedas)
   */
  async buyShield(): Promise<{ success: boolean; message?: string }> {
    try {
      const { data, error } = await supabase.rpc('buy_streak_shield')
      if (!error && data) {
        return data as { success: boolean; message?: string }
      }
    } catch {
      // fallback
    }

    const local = getLocalStats()
    if (local.piggy_coins >= 50 && local.streak_shields < 2) {
      local.piggy_coins -= 50
      local.streak_shields += 1
      saveLocalStats(local)
      return { success: true }
    }
    return { success: false, message: 'Moedas insuficientes ou limite atingido' }
  },

  /**
   * Recarrega as vidas do usuário ao máximo (3 vidas por 30 moedas)
   */
  async rechargeHearts(): Promise<{ success: boolean; message?: string; hearts?: number; piggy_coins?: number }> {
    try {
      const current = await this.getStats()
      if (current.piggy_coins < 30) {
        return { success: false, message: 'Você precisa de 30 moedas para recarregar' }
      }
      if (current.hearts >= 3) {
        return { success: false, message: 'Suas vidas já estão cheias!' }
      }

      const { data, error } = await supabase
        .from('learn_user_stats')
        .update({
          hearts: 3,
          piggy_coins: current.piggy_coins - 30,
          updated_at: new Date().toISOString(),
        })
        .select('*')
        .single()

      if (!error && data) {
        const stats = data as unknown as LearnStats
        saveLocalStats(stats)
        return { success: true, hearts: 3, piggy_coins: stats.piggy_coins }
      }
    } catch {
      // fallback
    }

    const local = getLocalStats()
    if (local.hearts >= 3) {
      return { success: false, message: 'Suas vidas já estão cheias!' }
    }
    if (local.piggy_coins >= 30) {
      local.piggy_coins -= 30
      local.hearts = 3
      saveLocalStats(local)
      return { success: true, hearts: 3, piggy_coins: local.piggy_coins }
    }
    return { success: false, message: 'Moedas insuficientes' }
  },

  /**
   * Subtrai 1 vida do usuário quando ele comete um erro
   */
  async deductHeart(): Promise<number> {
    try {
      const current = await this.getStats()
      const nextHearts = Math.max(0, (current.hearts ?? 3) - 1)
      const { data, error } = await supabase
        .from('learn_user_stats')
        .update({
          hearts: nextHearts,
          updated_at: new Date().toISOString(),
        })
        .select('hearts')
        .single()

      if (!error && data) {
        current.hearts = data.hearts
        saveLocalStats(current)
        return data.hearts
      }
    } catch {
      // fallback
    }

    const local = getLocalStats()
    local.hearts = Math.max(0, (local.hearts ?? 3) - 1)
    saveLocalStats(local)
    return local.hearts
  },

  /**
   * Retorna as questões para uma lição
   */
  getQuestionsForLesson(lessonSlug: string): LearnQuestion[] {
    return getQuestionsByLesson(lessonSlug)
  },

  /**
   * Retorna o desafio rápido diário
   */
  getDailyChallenge(dateStr?: string): LearnQuestion {
    return getDailyChallengeQuestion(dateStr)
  },

  /**
   * Passo 3: Registra um erro de questão no motor de prática personalizada
   */
  async recordMistake(exerciseId: string, conceptTag: string = 'geral'): Promise<{ success: boolean; mistake_count?: number }> {
    try {
      const { data, error } = await supabase.rpc('record_user_mistake', {
        p_exercise_id: exerciseId,
        p_concept_tag: conceptTag,
      })
      if (!error && data && (data as any).success) {
        return data as { success: boolean; mistake_count?: number }
      }
    } catch {
      // fallback
    }

    // Fallback local
    try {
      if (typeof localStorage !== 'undefined') {
        const key = 'purplepiggy_mistakes'
        const raw = localStorage.getItem(key)
        const mistakes: Record<string, { count: number; tag: string }> = raw ? JSON.parse(raw) : {}
        const current = mistakes[exerciseId] || { count: 0, tag: conceptTag }
        mistakes[exerciseId] = { count: current.count + 1, tag: conceptTag }
        localStorage.setItem(key, JSON.stringify(mistakes))
        return { success: true, mistake_count: current.count + 1 }
      }
    } catch {
      // ignore
    }
    return { success: true, mistake_count: 1 }
  },

  /**
   * Passo 3: Busca os exercícios com maior índice de erros para as Ilhas de Revisão
   */
  async getReviewExercises(limit: number = 5): Promise<ReviewExercise[]> {
    try {
      const { data, error } = await supabase.rpc('get_user_review_exercises', {
        p_limit: limit,
      })
      if (!error && Array.isArray(data) && data.length > 0) {
        return data as unknown as ReviewExercise[]
      }
    } catch {
      // fallback
    }

    // Fallback local
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem('purplepiggy_mistakes')
        if (raw) {
          const mistakes: Record<string, { count: number; tag: string }> = JSON.parse(raw)
          return Object.entries(mistakes)
            .map(([exercise_id, val]) => ({
              exercise_id,
              concept_tag: val.tag,
              mistake_count: val.count,
            }))
            .sort((a, b) => b.mistake_count - a.mistake_count)
            .slice(0, limit)
        }
      }
    } catch {
      // ignore
    }
    return []
  },

  /**
   * Passo 4: Obtém a tabela de classificação semanal (Leaderboard) em chaves de 30 usuárias
   */
  async getWeeklyLeaderboard(limit: number = 30): Promise<LeaderboardEntry[]> {
    try {
      const { data, error } = await supabase.rpc('get_weekly_leaderboard', {
        p_limit: limit,
      })
      if (!error && Array.isArray(data)) {
        return data as unknown as LeaderboardEntry[]
      }
    } catch {
      // fallback
    }
    return []
  },
}
