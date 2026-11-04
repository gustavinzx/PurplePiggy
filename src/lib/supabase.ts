import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database.types'

const defaultUrl = 'https://viugrfwxkjzntqgrlony.supabase.co'
const defaultAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpdWdyZnd4a2p6bnRxZ3Jsb255Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM2NDg4ODIsImV4cCI6MjEwOTIyNDg4Mn0.zlzghbTP0vJAtq7rhsG0Upe2sVvkf6pcqUsCasAx0sU'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || defaultUrl
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || defaultAnonKey

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})
