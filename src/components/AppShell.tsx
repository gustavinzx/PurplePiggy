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
 * AppShell unificado:
 * Garante largura constante (100% até var(--app-max-width)), alinhamento centralizado,
 * rolagem vertical fluida nas telas e espaçamento horizontal padronizado (var(--screen-x)).
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
  const hasCustomOverflow =
    contentClassName.includes('overflow-hidden') || className.includes('overflow-hidden')

  return (
    <div className="relative min-h-[100vh] min-h-[100dvh] h-[100dvh] w-full flex justify-center selection:bg-lilac selection:text-white overflow-hidden bg-bg">
      {/* Atmosphere de fundo cobrindo todo o viewport desktop */}
      <Atmosphere variant={variant} plain={plainAtmosphere} />

      {/* Container Mobile Principal: coluna centralizada com altura 100dvh estrita */}
      <div
        id="app-shell-container"
        className={`w-full max-w-[var(--app-max-width)] h-[100dvh] flex flex-col relative shadow-2xl overflow-hidden border-x border-lilac/15 mx-auto ${
          variant === 'splash'
            ? 'bg-transparent'
            : 'bg-gradient-to-b from-[#F6EEFF] via-[#F8F5FC] to-[#E9D8FF]'
        } ${containerClassName}`}
        style={{
          width: '100%',
          maxWidth: 'var(--app-max-width)',
          marginInline: 'auto',
          paddingTop: 'env(safe-area-inset-top, 0px)',
        }}
      >
        {/* Manchas orgânicas da identidade visual interna (blobs suaves nos cantos) */}
        {variant !== 'splash' && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden -z-0 select-none" aria-hidden="true">
            <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-[#EEDEFB]/70 blur-3xl" />
            <div className="absolute -top-12 -right-12 w-60 h-60 rounded-full bg-[#DEEEFC]/70 blur-3xl" />
            <div className="absolute top-1/2 -right-24 w-72 h-72 rounded-full bg-[#F5E6FC]/50 blur-3xl" />
            <div className="absolute -bottom-16 -left-12 w-64 h-64 rounded-full bg-[#E9D8FF]/60 blur-3xl" />
          </div>
        )}

        {/* Cabeçalho opcional fixo */}
        {header && (
          <header className="w-full shrink-0 z-30 bg-[#F6EEFF]/90 backdrop-blur-md border-b border-lilac/10">
            {header}
          </header>
        )}

        {/* Conteúdo da Tela com rolagem vertical nativa suave */}
        <main
          className={`flex-1 flex flex-col w-full min-w-0 relative ${
            hasCustomOverflow ? '' : 'overflow-y-auto overflow-x-hidden'
          } ${className} ${contentClassName}`}
          style={{
            width: '100%',
            minWidth: 0,
            paddingInline: 'var(--screen-x)',
            paddingBottom: showNav
              ? 'calc(var(--nav-height) + env(safe-area-inset-bottom, 0px) + 24px)'
              : undefined,
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
