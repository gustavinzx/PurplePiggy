export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      bank_connections: {
        Row: {
          account_label: string | null
          created_at: string
          id: string
          institution_name: string
          is_demo: boolean
          provider: string
          provider_ref: string | null
          status: 'pending' | 'active' | 'revoked' | 'expired' | 'error'
          updated_at: string
          user_id: string
        }
        Insert: {
          account_label?: string | null
          created_at?: string
          id?: string
          institution_name: string
          is_demo?: boolean
          provider?: string
          provider_ref?: string | null
          status: 'pending' | 'active' | 'revoked' | 'expired' | 'error'
          updated_at?: string
          user_id: string
        }
        Update: {
          account_label?: string | null
          created_at?: string
          id?: string
          institution_name?: string
          is_demo?: boolean
          provider?: string
          provider_ref?: string | null
          status?: 'pending' | 'active' | 'revoked' | 'expired' | 'error'
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      budgets: {
        Row: {
          category_id: string | null
          created_at: string
          id: string
          limit_amount: number
          month: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          id?: string
          limit_amount: number
          month: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          id?: string
          limit_amount?: number
          month?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budgets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string
          created_at: string
          icon: string
          id: string
          is_essential: boolean
          name: string
          slug: string
          sort_order: number
          user_id: string | null
        }
        Insert: {
          color: string
          created_at?: string
          icon: string
          id?: string
          is_essential?: boolean
          name: string
          slug: string
          sort_order?: number
          user_id?: string | null
        }
        Update: {
          color?: string
          created_at?: string
          icon?: string
          id?: string
          is_essential?: boolean
          name?: string
          slug?: string
          sort_order?: number
          user_id?: string | null
        }
        Relationships: []
      }
      educational_contents: {
        Row: {
          body_md: string
          example_md: string | null
          icon: string | null
          id: string
          lesson_order: number
          lesson_slug: string
          lesson_title: string
          minutes: number
          summary: string
          tip: string | null
          track_description: string
          track_order: number
          track_slug: string
          track_title: string
        }
        Insert: {
          body_md: string
          example_md?: string | null
          icon?: string | null
          id?: string
          lesson_order: number
          lesson_slug: string
          lesson_title: string
          minutes: number
          summary: string
          tip?: string | null
          track_description: string
          track_order: number
          track_slug: string
          track_title: string
        }
        Update: {
          body_md?: string
          example_md?: string | null
          icon?: string | null
          id?: string
          lesson_order?: number
          lesson_slug?: string
          lesson_title?: string
          minutes?: number
          summary?: string
          tip?: string | null
          track_description?: string
          track_order?: number
          track_slug?: string
          track_title?: string
        }
        Relationships: []
      }
      educational_progress: {
        Row: {
          completed_at: string
          content_id: string
          id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          content_id: string
          id?: string
          user_id: string
        }
        Update: {
          completed_at?: string
          content_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "educational_progress_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "educational_contents"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_diagnosis: {
        Row: {
          created_at: string
          essential_expenses: number
          feeling: 'start_organizing' | 'partial_control' | 'improve_planning' | 'in_debt'
          has_emergency_fund: 'no' | 'small' | 'three_months_plus'
          id: string
          main_goal: string
          monthly_income: number
          spending_habit: 'plans' | 'impulse_sometimes' | 'uses_credit_a_lot' | 'no_tracking'
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          essential_expenses: number
          feeling: 'start_organizing' | 'partial_control' | 'improve_planning' | 'in_debt'
          has_emergency_fund: 'no' | 'small' | 'three_months_plus'
          id?: string
          main_goal: string
          monthly_income: number
          spending_habit: 'plans' | 'impulse_sometimes' | 'uses_credit_a_lot' | 'no_tracking'
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          essential_expenses?: number
          feeling?: 'start_organizing' | 'partial_control' | 'improve_planning' | 'in_debt'
          has_emergency_fund?: 'no' | 'small' | 'three_months_plus'
          id?: string
          main_goal?: string
          monthly_income?: number
          spending_habit?: 'plans' | 'impulse_sometimes' | 'uses_credit_a_lot' | 'no_tracking'
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      financial_goals: {
        Row: {
          category: 'emergency' | 'travel' | 'purchase' | 'debt' | 'course' | 'personal'
          completed_at: string | null
          created_at: string
          deadline: string | null
          icon: string | null
          id: string
          name: string
          saved_amount: number
          target_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          category: 'emergency' | 'travel' | 'purchase' | 'debt' | 'course' | 'personal'
          completed_at?: string | null
          created_at?: string
          deadline?: string | null
          icon?: string | null
          id?: string
          name: string
          saved_amount?: number
          target_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: 'emergency' | 'travel' | 'purchase' | 'debt' | 'course' | 'personal'
          completed_at?: string | null
          created_at?: string
          deadline?: string | null
          icon?: string | null
          id?: string
          name?: string
          saved_amount?: number
          target_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      goal_contributions: {
        Row: {
          amount: number
          created_at: string
          goal_id: string
          id: string
          kind: 'deposit' | 'withdrawal'
          occurred_on: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          goal_id: string
          id?: string
          kind: 'deposit' | 'withdrawal'
          occurred_on?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          goal_id?: string
          id?: string
          kind?: 'deposit' | 'withdrawal'
          occurred_on?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_contributions_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "financial_goals"
            referencedColumns: ["id"]
          },
        ]
      }
      open_finance_consents: {
        Row: {
          authorized_at: string
          connection_id: string
          created_at: string
          expires_at: string
          id: string
          revoked_at: string | null
          scopes: string[]
          status: 'authorized' | 'revoked' | 'expired'
          user_id: string
        }
        Insert: {
          authorized_at?: string
          connection_id: string
          created_at?: string
          expires_at: string
          id?: string
          revoked_at?: string | null
          scopes: string[]
          status: 'authorized' | 'revoked' | 'expired'
          user_id: string
        }
        Update: {
          authorized_at?: string
          connection_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          revoked_at?: string | null
          scopes?: string[]
          status?: 'authorized' | 'revoked' | 'expired'
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "open_finance_consents_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "bank_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          birth_date: string | null
          card_alert_limit: number | null
          created_at: string
          diagnostic_done: boolean
          email: string | null
          full_name: string
          hide_balance: boolean
          id: string
          initial_balance: number
          is_demo: boolean
          notify_budget: boolean
          notify_goals: boolean
          notify_learning: boolean
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          birth_date?: string | null
          card_alert_limit?: number | null
          created_at?: string
          diagnostic_done?: boolean
          email?: string | null
          full_name: string
          hide_balance?: boolean
          id: string
          initial_balance?: number
          is_demo?: boolean
          notify_budget?: boolean
          notify_goals?: boolean
          notify_learning?: boolean
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          birth_date?: string | null
          card_alert_limit?: number | null
          created_at?: string
          diagnostic_done?: boolean
          email?: string | null
          full_name?: string
          hide_balance?: boolean
          id?: string
          initial_balance?: number
          is_demo?: boolean
          notify_budget?: boolean
          notify_goals?: boolean
          notify_learning?: boolean
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          category_id: string
          created_at: string
          description: string
          id: string
          notes: string | null
          occurred_on: string
          payment_method: 'pix' | 'credit_card' | 'debit_card' | 'cash' | 'boleto' | 'transfer' | 'other'
          source: 'manual' | 'open_finance' | 'demo'
          type: 'income' | 'expense'
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category_id: string
          created_at?: string
          description: string
          id?: string
          notes?: string | null
          occurred_on: string
          payment_method: 'pix' | 'credit_card' | 'debit_card' | 'cash' | 'boleto' | 'transfer' | 'other'
          source?: 'manual' | 'open_finance' | 'demo'
          type: 'income' | 'expense'
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category_id?: string
          created_at?: string
          description?: string
          id?: string
          notes?: string | null
          occurred_on?: string
          payment_method?: 'pix' | 'credit_card' | 'debit_card' | 'cash' | 'boleto' | 'transfer' | 'other'
          source?: 'manual' | 'open_finance' | 'demo'
          type?: 'income' | 'expense'
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      learn_user_stats: {
        Row: {
          active_track_slug: string
          created_at: string
          hearts: number
          last_activity_date: string | null
          longest_streak: number
          piggy_coins: number
          streak_count: number
          streak_shields: number
          updated_at: string
          user_id: string
          xp_points: number
        }
        Insert: {
          active_track_slug?: string
          created_at?: string
          hearts?: number
          last_activity_date?: string | null
          longest_streak?: number
          piggy_coins?: number
          streak_count?: number
          streak_shields?: number
          updated_at?: string
          user_id: string
          xp_points?: number
        }
        Update: {
          active_track_slug?: string
          created_at?: string
          hearts?: number
          last_activity_date?: string | null
          longest_streak?: number
          piggy_coins?: number
          streak_count?: number
          streak_shields?: number
          updated_at?: string
          user_id?: string
          xp_points?: number
        }
        Relationships: []
      }
      learn_chest_claims: {
        Row: {
          chest_index: number
          claimed_at: string
          id: string
          track_slug: string
          user_id: string
        }
        Insert: {
          chest_index: number
          claimed_at?: string
          id?: string
          track_slug: string
          user_id: string
        }
        Update: {
          chest_index?: number
          claimed_at?: string
          id?: string
          track_slug?: string
          user_id?: string
        }
        Relationships: []
      }
      learn_daily_challenges: {
        Row: {
          challenge_date: string
          created_at: string
          id: string
          question_id: string
          reward_coins: number
          reward_xp: number
          title: string
        }
        Insert: {
          challenge_date: string
          created_at?: string
          id?: string
          question_id: string
          reward_coins?: number
          reward_xp?: number
          title: string
        }
        Update: {
          challenge_date?: string
          created_at?: string
          id?: string
          question_id?: string
          reward_coins?: number
          reward_xp?: number
          title?: string
        }
        Relationships: []
      }
      learn_daily_completions: {
        Row: {
          challenge_date: string
          completed_at: string
          id: string
          user_id: string
        }
        Insert: {
          challenge_date: string
          completed_at?: string
          id?: string
          user_id: string
        }
        Update: {
          challenge_date?: string
          completed_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      learn_questions: {
        Row: {
          context_text: string | null
          correct_answer: Json
          created_at: string
          explanation: string
          id: string
          lesson_slug: string
          lote_number: number
          options: Json
          order_index: number
          prompt: string
          tip: string | null
          track_slug: string
          typology: string
        }
        Insert: {
          context_text?: string | null
          correct_answer: Json
          created_at?: string
          explanation: string
          id?: string
          lesson_slug: string
          lote_number: number
          options: Json
          order_index?: number
          prompt: string
          tip?: string | null
          track_slug: string
          typology: string
        }
        Update: {
          context_text?: string | null
          correct_answer?: Json
          created_at?: string
          explanation?: string
          id?: string
          lesson_slug?: string
          lote_number?: number
          options?: Json
          order_index?: number
          prompt?: string
          tip?: string | null
          track_slug?: string
          typology?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      reset_demo_data: { Args: Record<string, never>; Returns: void }
      seed_demo_data: { Args: Record<string, never>; Returns: void }
      get_learn_user_stats: { Args: Record<string, never>; Returns: Json }
      complete_learn_lesson: { Args: { p_lesson_slug: string }; Returns: Json }
      claim_learn_chest: { Args: { p_track_slug: string; p_chest_index: number }; Returns: Json }
      complete_daily_learn_challenge: { Args: { p_challenge_date?: string }; Returns: Json }
      buy_streak_shield: { Args: Record<string, never>; Returns: Json }
    }
  }
}
