import React from 'react'
import { BottomNav } from './BottomNav'
import { useAuth } from '../context/AuthContext'
import { Sparkles } from 'lucide-react'

interface AppShellProps {
  children: React.ReactNode
  showNav?: boolean
  className?: string
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  showNav = true,
  className = '',
}) => {
  const { isDemo } = useAuth()

  return (
    <div className="min-h-screen bg-bg flex justify-center selection:bg-lilac selection:text-white">
      {/* Container Mobile Principal */}
      <div className="w-full max-w-[480px] min-h-screen bg-bg flex flex-col relative shadow-2xl overflow-x-hidden border-x border-lilac/10">
        {/* Banner fixo de modo demonstração (quando aplicável) */}
        {isDemo && (
          <div className="sticky top-0 z-50 bg-gradient-to-r from-purple-800 to-primary text-white text-[12px] font-bold py-1.5 px-4 text-center flex items-center justify-center gap-1.5 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-gold animate-spin" style={{ animationDuration: '6s' }} />
            <span>Modo Demonstração · Dados fictícios de Ana Oliveira</span>
          </div>
        )}

        {/* Conteúdo da Tela */}
        <main className={`flex-1 flex flex-col ${showNav ? 'pb-24' : ''} ${className}`}>
          {children}
        </main>

        {/* Barra de Navegação Inferior */}
        {showNav && <BottomNav />}
      </div>
    </div>
  )
}
