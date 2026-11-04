import React from 'react'
import { Atmosphere, AtmosphereVariant } from './Atmosphere'
import { BottomNav } from './BottomNav'

export interface AppShellProps {
  children: React.ReactNode
  header?: React.ReactNode
  showNav?: boolean
  className?: string
  variant?: AtmosphereVariant
  plainAtmosphere?: boolean
  containerClassName?: string
  contentClassName?: string
  contentStyle?: React.CSSProperties
}

/**
 * AppShell unificado para todas as telas do app:
 * - Cabeçalho opcional fixo com respeito ao safe-area-inset-top
 * - Área de conteúdo rolável isolada (só ela rola, mantendo topo e navegação perfeitamente ancorados)
 * - Bottom nav fixa com altura (--nav-h = 64px) + safe-area-inset-bottom
 * - Altura estrita de 100dvh que se adapta dinamicamente a diferentes alturas de tela Android
 * - Publica paddingBottom: calc(var(--nav-h) + env(safe-area-inset-bottom, 0px) + 24px)
 *   garantindo que nenhum card ou botão fique coberto pela navegação.
 */
export const AppShell: React.FC<AppShellProps> = ({
  children,
  header,
  showNav = true,
  className = '',
  variant = 'app',
  plainAtmosphere = false,
  containerClassName = '',
  contentClassName = '',
  contentStyle = {},
}) => {
  return (
    <div className="relative h-[100dvh] w-full flex justify-center selection:bg-lilac selection:text-white overflow-hidden bg-bg">
      {/* Atmosphere de fundo cobrindo todo o viewport desktop */}
      <Atmosphere variant={variant} plain={plainAtmosphere} />

      {/* Container Mobile Principal: coluna centralizada com altura 100dvh estrita */}
      <div
        id="app-shell-container"
        className={`w-full max-w-full sm:max-w-[var(--app-max-width)] h-[100dvh] flex flex-col relative shadow-none sm:shadow-2xl overflow-hidden border-0 sm:border-x sm:border-lilac/10 mx-auto ${
          variant === 'splash' ? 'bg-transparent' : 'bg-bg'
        } ${containerClassName}`}
        style={{
          width: '100%',
          paddingTop: 'env(safe-area-inset-top, 0px)',
        }}
      >
        {/* Cabeçalho opcional fixo */}
        {header && (
          <header className="w-full shrink-0 z-30 bg-bg/95 backdrop-blur-md">
            {header}
          </header>
        )}

        {/* Área de conteúdo rolável (só ela rola) */}
        <main
          className={`flex-1 flex flex-col w-full min-w-0 overflow-y-auto overflow-x-hidden ${className} ${contentClassName}`}
          style={{
            width: '100%',
            minWidth: 0,
            paddingInline: 'var(--screen-x)',
            paddingBottom: showNav
              ? 'calc(var(--nav-h) + env(safe-area-inset-bottom, 0px) + 24px)'
              : 'calc(env(safe-area-inset-bottom, 0px) + 24px)',
            ...contentStyle,
          }}
        >
          {children}
        </main>

        {/* Barra de Navegação Inferior Fixa */}
        {showNav && <BottomNav />}
      </div>
    </div>
  )
}

export default AppShell
