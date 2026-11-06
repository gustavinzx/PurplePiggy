import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from './context/AuthContext'
import { AuthGate } from './components/AuthGate'
import { initNotificationsChannel } from './lib/nativeNotifications'
import { isSupabaseConfigured } from './lib/supabase'
import { AlertTriangle } from 'lucide-react'
import { useAndroidBackButton } from './lib/capacitor'

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
import { InAppUpdateModal } from './components/InAppUpdateModal'

const AndroidShellHandler: React.FC = () => {
  useAndroidBackButton()
  return null
}

export const App: React.FC = () => {
  useEffect(() => {
    initNotificationsChannel()
  }, [])

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-[#FAF5FF] flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-xl border border-purple-100 flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h1 className="font-nunito font-extrabold text-lg text-[#33105D]">
            Configuração do Supabase Ausente
          </h1>
          <p className="font-nunito text-xs text-[#7D6A9C] leading-relaxed">
            As chaves de conexão não foram detectadas no ambiente. Para conectar o aplicativo, configure as variáveis no seu arquivo <code className="bg-purple-50 text-purple-700 font-mono px-1 py-0.5 rounded font-bold">.env</code>:
          </p>
          <div className="w-full bg-[#FAF5FF] rounded-xl p-3 text-left font-mono text-[11px] text-purple-900 border border-purple-100 flex flex-col gap-1">
            <span>VITE_SUPABASE_URL=...</span>
            <span>VITE_SUPABASE_ANON_KEY=...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <AndroidShellHandler />
      <AuthProvider>
        <Toaster position="top-center" richColors />
        <InAppUpdateModal />
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
