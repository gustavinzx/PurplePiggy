import React from 'react'
import { BottomNav } from './BottomNav'

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
  return (
    <div className="min-h-screen bg-bg flex justify-center selection:bg-lilac selection:text-white">
      {/* Container Mobile Principal */}
      <div className="w-full max-w-[480px] min-h-screen bg-bg flex flex-col relative shadow-2xl overflow-x-hidden border-x border-lilac/10">
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
