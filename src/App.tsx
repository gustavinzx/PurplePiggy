import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from './context/AuthContext'
import { AuthGate } from './components/AuthGate'
import { initCapacitor, useAndroidBackButton } from './lib/capacitor'

import { SplashPage } from './pages/SplashPage'
import { WelcomePage } from './pages/WelcomePage'
import { RegisterPage } from './pages/RegisterPage'
import { LoginPage } from './pages/LoginPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { DiagnosticPage } from './pages/DiagnosticPage'
import { DashboardPage } from './pages/DashboardPage'
import { TransactionsPage } from './pages/TransactionsPage'
import { TransactionDetailPage } from './pages/TransactionDetailPage'
import { BudgetPage } from './pages/BudgetPage'
import { GoalsPage } from './pages/GoalsPage'
import { LearnPage } from './pages/LearnPage'
import { LessonPage } from './pages/LessonPage'
import { GuidePage } from './pages/GuidePage'
import { StudyGuidesPage } from './pages/StudyGuidesPage'
import { SimulatorPage } from './pages/SimulatorPage'
import { ProfilePage } from './pages/ProfilePage'
import { OpenFinancePage } from './pages/OpenFinancePage'
import { DesignSystemPage } from './pages/DesignSystemPage'
import { DesignSystemMascotPage } from './pages/DesignSystemMascotPage'
import { DesignSystemAtmospherePage } from './pages/DesignSystemAtmospherePage'
import { DesignSystemLearnPage } from './pages/DesignSystemLearnPage'

const AndroidShellHandler: React.FC = () => {
  useAndroidBackButton()
  return null
}

export const App: React.FC = () => {
  useEffect(() => {
    initCapacitor()
  }, [])
  return (
    <BrowserRouter>
      <AndroidShellHandler />
      <AuthProvider>
        <Toaster position="top-center" richColors />
        <Routes>
          {/* Páginas do Design System */}
          <Route
            path="/design-system"
            element={
              <AuthGate mode="neutral">
                <DesignSystemPage />
              </AuthGate>
            }
          />
          <Route
            path="/design-system/mascot"
            element={
              <AuthGate mode="neutral">
                <DesignSystemMascotPage />
              </AuthGate>
            }
          />
          <Route
            path="/design-system/atmosphere"
            element={
              <AuthGate mode="neutral">
                <DesignSystemAtmospherePage />
              </AuthGate>
            }
          />
          <Route
            path="/design-system/learn"
            element={
              <AuthGate mode="neutral">
                <DesignSystemLearnPage />
              </AuthGate>
            }
          />

          {/* Rota Raiz (Splash) */}
          <Route
            path="/"
            element={
              <AuthGate mode="splash">
                <SplashPage />
              </AuthGate>
            }
          />

          {/* Rotas Públicas */}
          <Route
            path="/boas-vindas"
            element={
              <AuthGate mode="publicOnly">
                <WelcomePage />
              </AuthGate>
            }
          />
          <Route
            path="/cadastrar"
            element={
              <AuthGate mode="publicOnly">
                <RegisterPage />
              </AuthGate>
            }
          />
          <Route
            path="/entrar"
            element={
              <AuthGate mode="publicOnly">
                <LoginPage />
              </AuthGate>
            }
          />
          <Route
            path="/redefinir-senha"
            element={
              <AuthGate mode="neutral">
                <ResetPasswordPage />
              </AuthGate>
            }
          />

          {/* Rota de Diagnóstico */}
          <Route
            path="/diagnostico"
            element={
              <AuthGate mode="diagnostic">
                <DiagnosticPage />
              </AuthGate>
            }
          />

          {/* Rotas Protegidas */}
          <Route
            path="/inicio"
            element={
              <AuthGate mode="protected">
                <DashboardPage />
              </AuthGate>
            }
          />
          <Route
            path="/gastos"
            element={
              <AuthGate mode="protected">
                <TransactionsPage />
              </AuthGate>
            }
          />
          <Route
            path="/gastos/:id"
            element={
              <AuthGate mode="protected">
                <TransactionDetailPage />
              </AuthGate>
            }
          />
          <Route
            path="/orcamento"
            element={
              <AuthGate mode="protected">
                <BudgetPage />
              </AuthGate>
            }
          />
          <Route
            path="/metas"
            element={
              <AuthGate mode="protected">
                <GoalsPage />
              </AuthGate>
            }
          />
          <Route
            path="/aprender"
            element={
              <AuthGate mode="protected">
                <LearnPage />
              </AuthGate>
            }
          />
          <Route
            path="/aprender/:trackSlug/:lessonSlug"
            element={
              <AuthGate mode="protected">
                <LessonPage />
              </AuthGate>
            }
          />
          <Route
            path="/aprender/trilha/:slug"
            element={
              <AuthGate mode="protected">
                <LearnPage />
              </AuthGate>
            }
          />
          <Route
            path="/aprender/trilha/:slug/nivel/:n"
            element={
              <AuthGate mode="protected">
                <LessonPage />
              </AuthGate>
            }
          />
          <Route
            path="/aprender/trilha/:slug/nivel/:n/guia"
            element={
              <AuthGate mode="protected">
                <GuidePage />
              </AuthGate>
            }
          />
          <Route
            path="/aprender/guias"
            element={
              <AuthGate mode="protected">
                <StudyGuidesPage />
              </AuthGate>
            }
          />
          <Route
            path="/aprender/guias/:slug"
            element={
              <AuthGate mode="protected">
                <GuidePage />
              </AuthGate>
            }
          />
          <Route
            path="/simulador"
            element={
              <AuthGate mode="protected">
                <SimulatorPage />
              </AuthGate>
            }
          />
          <Route
            path="/perfil"
            element={
              <AuthGate mode="protected">
                <ProfilePage />
              </AuthGate>
            }
          />
          <Route
            path="/open-finance"
            element={
              <AuthGate mode="protected">
                <OpenFinancePage />
              </AuthGate>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
