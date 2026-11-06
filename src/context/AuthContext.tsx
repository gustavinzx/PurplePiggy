import React, { createContext, useContext, useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  isLoading: boolean
  isDemo: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>
  signInDemo: () => Promise<{ error: Error | null }>
  resetDemoData: () => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar perfil:', error)
      }
      if (data) {
        setProfile(data)
      }
    } catch (err) {
      console.error('Falha ao obter perfil:', err)
    }
  }

  useEffect(() => {
    // 1. Obter sessão e perfil inicial atomicamente
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user.id)
        }
      } catch (err) {
        console.error('Erro na inicialização de autenticação:', err)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()

    // 2. Ouvir mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
        }
        setIsLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })
      if (error) return { error }
      return { error: null }
    } catch (err) {
      return { error: err as Error }
    }
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const normalizedEmail = email.trim().toLowerCase()

      // 1. Verificar previamente se já existe uma conta com este e-mail
      try {
        const { data: exists } = await (supabase.rpc as any)('check_email_exists', {
          p_email: normalizedEmail,
        })
        if (exists === true) {
          return {
            error: new Error('Este e-mail já está cadastrado no PurplePiggy.'),
          }
        }
      } catch (rpcErr) {
        console.warn('Falha ao checar e-mail via RPC (continuando com signUp):', rpcErr)
      }

      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            is_demo: false,
          },
        },
      })
      if (error) return { error }

      // Quando o Supabase retorna identities vazio, o e-mail já estava cadastrado
      if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        return {
          error: new Error('Este e-mail já está cadastrado no PurplePiggy.'),
        }
      }

      // Garantir que o perfil existe mesmo se o trigger demorar, iniciando com saldo 0.00
      if (data.user) {
        try {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            full_name: fullName.trim(),
            email: normalizedEmail,
            is_demo: false,
            initial_balance: 0,
          })
        } catch (profileErr) {
          console.warn('Perfil será sincronizado pelo trigger do banco:', profileErr)
        }
      }
      return { error: null }
    } catch (err) {
      return { error: err as Error }
    }
  }

  const signInDemo = async () => {
    try {
      setIsLoading(true)
      // Login anônimo do Supabase para garantir ambiente isolado por visitante
      const { data, error } = await supabase.auth.signInAnonymously()

      if (error) {
        console.error('Falha no login demo anônimo:', error)
        return { error }
      }

      if (data.user) {
        try {
          await supabase.rpc('seed_demo_data')
        } catch (seedErr) {
          console.warn('Aviso ao inicializar seed demo:', seedErr)
        }
        await fetchProfile(data.user.id)
      }
      return { error: null }
    } catch (err) {
      console.error('Falha no login demo:', err)
      return { error: err as Error }
    } finally {
      setIsLoading(false)
    }
  }

  const resetDemoData = async () => {
    try {
      const { error } = await supabase.rpc('reset_demo_data')
      if (error) return { error }
      if (user) await fetchProfile(user.id)
      return { error: null }
    } catch (err) {
      return { error: err as Error }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setSession(null)
  }

  const isDemo = Boolean(profile?.is_demo)

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        isLoading,
        isDemo,
        signIn,
        signUp,
        signInDemo,
        resetDemoData,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}
