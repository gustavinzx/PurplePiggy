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
  hearts: number
  streak_shields: number
  active_track_slug: string
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
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (raw) return JSON.parse(raw)
    }
  } catch {
    // ignore
  }
  return {
    streak_count: 0,
    longest_streak: 0,
    last_activity_date: null,
    piggy_coins: 0,
    xp_points: 0,
    hearts: 3,
    streak_shields: 0,
    active_track_slug: 'organizacao-financeira',
  }
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
}
