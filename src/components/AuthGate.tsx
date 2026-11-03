import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { AppShell } from './AppShell'
import { Mascot } from './Mascot'

export type AuthGateMode = 'protected' | 'publicOnly' | 'splash' | 'diagnostic' | 'neutral'

export interface AuthGateProps {
  children: React.ReactNode
  mode?: AuthGateMode
}

/**
 * Gate de rotas unificado (AuthGate).
 * Só renderiza a rota alvo depois que a sessão E o perfil (incluindo diagnostic_done)
 * estiverem totalmente resolvidos.
 * Enquanto resolve, renderiza uma tela neutra de carregamento (<AppShell> + <Mascot pose="loading">).
 * Redirecionamentos são atômicos via <Navigate replace /> ANTES da tela alvo montar,
 * eliminando qualquer flash de tela indevida.
 */
export const AuthGate: React.FC<AuthGateProps> = ({ children, mode = 'protected' }) => {
  const { user, profile, isLoading } = useAuth()
  const location = useLocation()

  // Enquanto a sessão ou o perfil do usuário logado estiverem carregando, renderiza estado neutro
  const isResolving = isLoading || (Boolean(user) && profile === null)

  if (isResolving) {
    return (
      <AppShell showNav={false} variant="app">
        <div className="flex-1 flex flex-col items-center justify-center gap-4 z-10 select-none">
          <Mascot size="lg" pose="loading" float priority alt="Carregando" />
          <p className="text-sm font-bold text-deep/70 tracking-wide animate-pulse">
            Carregando...
          </p>
        </div>
      </AppShell>
    )
  }

  // 1. Modo Neutro: acessível sempre (ex: telas de dev/design system, redefinição de senha)
  if (mode === 'neutral') {
    return <>{children}</>
  }

  // 2. Modo Splash (/): se autenticada, vai direto para o destino correto sem piscar a tela inicial
  if (mode === 'splash') {
    if (user) {
      if (profile && !profile.diagnostic_done) {
        return <Navigate to="/diagnostico" replace />
      }
      return <Navigate to="/inicio" replace />
    }
    return <>{children}</>
  }

  // 3. Modo Somente Público (ex: /boas-vindas, /cadastrar, /entrar)
  if (mode === 'publicOnly') {
    if (user) {
      if (profile && !profile.diagnostic_done) {
        return <Navigate to="/diagnostico" replace />
      }
      return <Navigate to="/inicio" replace />
    }
    return <>{children}</>
  }

  // 4. Modo Diagnóstico (/diagnostico)
  if (mode === 'diagnostic') {
    if (!user) {
      return <Navigate to="/entrar" state={{ from: location }} replace />
    }
    // Se o diagnóstico já foi concluído, não deve ficar no diagnóstico
    if (profile?.diagnostic_done) {
      return <Navigate to="/inicio" replace />
    }
    return <>{children}</>
  }

  // 5. Modo Protegido (padrão: /inicio, /gastos, /orcamento, /metas, /aprender, /perfil, etc.)
  if (!user) {
    return <Navigate to="/entrar" state={{ from: location }} replace />
  }

  // Se logada mas não concluiu o diagnóstico: força direcionamento para /diagnostico
  if (profile && !profile.diagnostic_done) {
    return <Navigate to="/diagnostico" replace />
  }

  return <>{children}</>
}

export default AuthGate
