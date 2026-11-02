import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Mascot } from './Mascot'

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-bg gap-4">
        <Mascot size="md" accessory="floating" />
        <p className="text-sm font-bold text-deep animate-pulse">Carregando com carinho...</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/entrar" state={{ from: location }} replace />
  }

  // Se a usuária ainda não concluiu o diagnóstico e não está na rota de diagnóstico, redirecionar
  if (profile && !profile.diagnostic_done && location.pathname !== '/diagnostico') {
    return <Navigate to="/diagnostico" replace />
  }

  return <>{children}</>
}

export const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-bg gap-4">
        <Mascot size="md" accessory="floating" />
        <p className="text-sm font-bold text-deep animate-pulse">Carregando...</p>
      </div>
    )
  }

  if (user) {
    if (profile && !profile.diagnostic_done) {
      return <Navigate to="/diagnostico" replace />
    }
    return <Navigate to="/inicio" replace />
  }

  return <>{children}</>
}
