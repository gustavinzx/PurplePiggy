import React from 'react'
import { NavLink } from 'react-router-dom'

export interface BottomNavProps {
  className?: string
  isFixed?: boolean
}

// 1. Ícone Início (Casinha com linhas e telhado arredondados)
const NavIconHome: React.FC<{ active: boolean }> = ({ active }) => (
  <svg
    className="w-5 h-5 transition-transform"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={active ? 2.5 : 2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 10.5L12 3l9 7.5v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <path d="M9 21v-7a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v7" />
  </svg>
)

// 2. Ícone Gastos (Gráfico de barras arredondadas)
const NavIconGastos: React.FC<{ active: boolean }> = ({ active }) => (
  <svg
    className="w-5 h-5 transition-transform"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={active ? 2.5 : 2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
)

// 3. Ícone Metas (Alvo circular com ponto central)
const NavIconMetas: React.FC<{ active: boolean }> = ({ active }) => (
  <svg
    className="w-5 h-5 transition-transform"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={active ? 2.5 : 2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1" fill="currentColor" />
  </svg>
)

// 4. Ícone Aprender (Livro aberto com páginas curvadas)
const NavIconAprender: React.FC<{ active: boolean }> = ({ active }) => (
  <svg
    className="w-5 h-5 transition-transform"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={active ? 2.5 : 2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    <path d="M8 7h8" />
    <path d="M8 11h6" />
  </svg>
)

// 5. Ícone Perfil (Busto com contorno arredondado)
const NavIconPerfil: React.FC<{ active: boolean }> = ({ active }) => (
  <svg
    className="w-5 h-5 transition-transform"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={active ? 2.5 : 2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

export const BottomNav: React.FC<BottomNavProps> = ({ className = '', isFixed = true }) => {
  const navItems = [
    { label: 'Início', path: '/inicio', Icon: NavIconHome },
    { label: 'Gastos', path: '/gastos', Icon: NavIconGastos },
    { label: 'Metas', path: '/metas', Icon: NavIconMetas },
    { label: 'Aprender', path: '/aprender', Icon: NavIconAprender },
    { label: 'Perfil', path: '/perfil', Icon: NavIconPerfil },
  ]

  const positionClass = isFixed
    ? 'fixed bottom-0 left-0 right-0 z-40 max-w-[480px] mx-auto'
    : 'relative w-full'

  return (
    <nav
      className={`${positionClass} bg-white/95 backdrop-blur-lg border-t border-lilac/15 shadow-nav rounded-t-nav ${className}`}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const ItemIcon = item.Icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 h-full py-1 transition-all duration-150 select-none ${
                  isActive
                    ? 'text-primary-dark font-extrabold'
                    : 'text-textSec hover:text-deep font-semibold opacity-75 hover:opacity-100'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center justify-center w-6 h-6">
                    <ItemIcon active={isActive} />
                  </div>
                  <span className={`text-[10px] leading-tight mt-1 font-sans ${isActive ? 'font-extrabold' : 'font-semibold'}`}>
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}

export interface FloatingActionButtonProps {
  children: React.ReactNode
  icon?: React.ReactNode
  onClick?: () => void
  isFixed?: boolean
  className?: string
}

/**
 * Botão flutuante de ação rápida ("+ Adicionar gasto", "+ Criar nova meta", "+ Ajustar orçamento"):
 * Fixado logo acima da barra inferior de navegação (bottom-[74px]) com largura total confortável e sombra de destaque.
 */
export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  children,
  icon,
  onClick,
  isFixed = true,
  className = '',
}) => {
  const containerClass = isFixed
    ? 'fixed bottom-[74px] left-0 right-0 max-w-[480px] mx-auto px-5 z-30 pointer-events-auto'
    : 'w-full'

  return (
    <div className={containerClass}>
      <button
        onClick={onClick}
        className={`w-full h-12 bg-gradient-to-r from-btn-primary-start to-btn-primary-end text-white font-extrabold rounded-pill shadow-button border-t border-white/25 flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.98] hover:brightness-105 select-none ${className}`}
      >
        {icon && <span className="inline-flex shrink-0">{icon}</span>}
        <span className="text-[15px] font-sans">{children}</span>
      </button>
    </div>
  )
}

export default BottomNav
