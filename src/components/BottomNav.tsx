import React from 'react'
import { NavLink } from 'react-router-dom'
import { Home, BarChart2, Target, BookOpen, User } from 'lucide-react'

export const BottomNav: React.FC = () => {
  const navItems = [
    { label: 'Início', path: '/inicio', icon: Home },
    { label: 'Gastos', path: '/gastos', icon: BarChart2 },
    { label: 'Metas', path: '/metas', icon: Target },
    { label: 'Aprender', path: '/aprender', icon: BookOpen },
    { label: 'Perfil', path: '/perfil', icon: User },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-lilac/15 shadow-lg max-w-[480px] mx-auto">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 h-full py-1 transition-all duration-200 select-none ${
                  isActive
                    ? 'text-primary font-bold scale-105'
                    : 'text-textSec hover:text-deep font-semibold'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={`p-1 rounded-xl transition-all ${
                      isActive ? 'bg-primary/10' : 'bg-transparent'
                    }`}
                  >
                    <Icon
                      className="w-5 h-5 transition-transform"
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                  </div>
                  <span className="text-[11px] leading-tight mt-0.5">{item.label}</span>
                </>
              )}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
