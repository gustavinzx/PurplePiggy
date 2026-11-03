import React from 'react'
import { Atmosphere, AtmosphereVariant } from './Atmosphere'
import { BottomNav } from './BottomNav'

export interface AppShellProps {
  children: React.ReactNode
  showNav?: boolean
  className?: string
  variant?: AtmosphereVariant
  plainAtmosphere?: boolean
  containerClassName?: string
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  showNav = true,
  className = '',
  variant = 'app',
  plainAtmosphere = false,
  containerClassName = '',
}) => {
  return (
    <div className="relative min-h-[100vh] min-h-[100dvh] w-full flex justify-center selection:bg-lilac selection:text-white">
      {/* Atmosphere de fundo cobrindo todo o viewport desktop */}
      <Atmosphere variant={variant} plain={plainAtmosphere} />

      {/* Container Mobile Principal com largura e alinhamento constantes */}
      <div
        id="app-shell-container"
        className={`w-full max-w-[480px] min-h-[100vh] min-h-[100dvh] flex flex-col relative shadow-2xl overflow-x-hidden border-x border-lilac/10 ${
          variant === 'splash' ? 'bg-transparent' : 'bg-bg'
        } ${containerClassName}`}
      >
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

export default AppShell
