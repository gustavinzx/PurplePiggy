import React, { useEffect, Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from './context/AuthContext'
import { AuthGate } from './components/AuthGate'
import { AppShell } from './components/AppShell'
import { Mascot } from './components/Mascot'
import { initNotificationsChannel } from './lib/nativeNotifications'
import { isSupabaseConfigured } from './lib/supabase'
import { AlertTriangle } from 'lucide-react'
import { useAndroidBackButton, useDeepLinks } from './lib/capacitor'
import { OfflineBanner } from './components/OfflineBanner'
import { InAppUpdateModal } from './components/InAppUpdateModal'

// Code-splitting via React.lazy
const SplashPage = lazy(() => import('./pages/SplashPage').then(m => ({ default: m.SplashPage })))
const WelcomePage = lazy(() => import('./pages/WelcomePage').then(m => ({ default: m.WelcomePage })))
const RegisterPage = lazy(() => import('./pages/RegisterPage').then(m => ({ default: m.RegisterPage })))
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })))
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })))
const DiagnosticPage = lazy(() => import('./pages/DiagnosticPage').then(m => ({ default: m.DiagnosticPage })))
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })))
const TransactionsPage = lazy(() => import('./pages/TransactionsPage').then(m => ({ default: m.TransactionsPage })))
const TransactionDetailPage = lazy(() => import('./pages/TransactionDetailPage').then(m => ({ default: m.TransactionDetailPage })))
const BudgetPage = lazy(() => import('./pages/BudgetPage').then(m => ({ default: m.BudgetPage })))
const GoalsPage = lazy(() => import('./pages/GoalsPage').then(m => ({ default: m.GoalsPage })))
const LearnPage = lazy(() => import('./pages/LearnPage').then(m => ({ default: m.LearnPage })))
const LessonPage = lazy(() => import('./pages/LessonPage').then(m => ({ default: m.LessonPage })))
const GuidePage = lazy(() => import('./pages/GuidePage').then(m => ({ default: m.GuidePage })))
const StudyGuidesPage = lazy(() => import('./pages/StudyGuidesPage').then(m => ({ default: m.StudyGuidesPage })))
const SimulatorPage = lazy(() => import('./pages/SimulatorPage').then(m => ({ default: m.SimulatorPage })))
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })))
const OpenFinancePage = lazy(() => import('./pages/OpenFinancePage').then(m => ({ default: m.OpenFinancePage })))
const DesignSystemPage = lazy(() => import('./pages/DesignSystemPage').then(m => ({ default: m.DesignSystemPage })))
const DesignSystemMascotPage = lazy(() => import('./pages/DesignSystemMascotPage').then(m => ({ default: m.DesignSystemMascotPage })))
const DesignSystemAtmospherePage = lazy(() => import('./pages/DesignSystemAtmospherePage').then(m => ({ default: m.DesignSystemAtmospherePage })))
const DesignSystemLearnPage = lazy(() => import('./pages/DesignSystemLearnPage').then(m => ({ default: m.DesignSystemLearnPage })))

const PageLoadingFallback: React.FC = () => (
  <AppShell showNav={false} variant="app">
    <div className="flex-1 flex flex-col items-center justify-center gap-4 z-10 select-none">
      <Mascot size="lg" pose="loading" float priority alt="Carregando" />
      <p className="text-sm font-bold text-deep/70 tracking-wide animate-pulse">
        Carregando...
      </p>
    </div>
  </AppShell>
)

const AndroidShellHandler: React.FC = () => {
  useAndroidBackButton()
  useDeepLinks()
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
      <OfflineBanner />
      <AuthProvider>
        <Toaster position="top-center" richColors />
        <InAppUpdateModal />
        <Suspense fallback={<PageLoadingFallback />}>
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
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
