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

/**
 * AppShell unificado:
 * Garante largura constante (100% até var(--app-max-width)), alinhamento centralizado
 * e espaçamento horizontal padronizado (var(--screen-x)) em TODOS os estados (carregamento,
 * esqueleto, vazio, erro e dados).
 */
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

      {/* Container Mobile Principal: coluna centralizada com largura fixa nos tokens */}
      <div
        id="app-shell-container"
        className={`w-full max-w-[var(--app-max-width)] min-h-[100vh] min-h-[100dvh] flex flex-col relative shadow-2xl overflow-x-hidden border-x border-lilac/10 mx-auto ${
          variant === 'splash' ? 'bg-transparent' : 'bg-bg'
        } ${containerClassName}`}
        style={{
          width: '100%',
          maxWidth: 'var(--app-max-width)',
          marginInline: 'auto',
        }}
      >
        {/* Conteúdo da Tela: largura 100%, nunca depende do conteúdo */}
        <main
          className={`flex-1 flex flex-col w-full min-w-0 ${className}`}
          style={{
            width: '100%',
            minWidth: 0,
            paddingInline: 'var(--screen-x)',
            paddingBottom: showNav
              ? 'calc(var(--nav-height) + env(safe-area-inset-bottom, 0px) + 16px)'
              : undefined,
          }}
        >
          {children}
        </main>

        {/* Barra de Navegação Inferior */}
        {showNav && <BottomNav />}
      </div>
    </div>
  )
}

export default AppShell
