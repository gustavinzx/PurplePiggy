import React from 'react'
import { AuthGate } from './AuthGate'

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <AuthGate mode="protected">{children}</AuthGate>
}

export const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <AuthGate mode="publicOnly">{children}</AuthGate>
}
