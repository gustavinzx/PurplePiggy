import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'
import { App as CapApp } from '@capacitor/app'
import { Keyboard } from '@capacitor/keyboard'
import { SplashScreen } from '@capacitor/splash-screen'
import { toast } from 'sonner'

/**
 * Inicialização global dos plugins Capacitor para Android/iOS:
 * - Status bar com cor do fundo (#F8F5FC) e ícones escuros (Style.Light)
 * - Splash screen auto-hide suave
 * - Ajuste do teclado com rolagem automática para o campo focado
 */
export async function initCapacitor(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return

  try {
    // 1. Status Bar
    await StatusBar.setStyle({ style: Style.Light }).catch(() => {})

    if (Capacitor.getPlatform() === 'android') {
      await StatusBar.setBackgroundColor({ color: '#F8F5FC' }).catch(() => {})
      await StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {})
    }

    // 2. Teclado: rolagem suave para manter o campo focado visível acima do teclado
    Keyboard.addListener('keyboardWillShow', () => {
      setTimeout(() => {
        const active = document.activeElement as HTMLElement | null
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT')) {
          active.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)
    })

    // 3. SplashScreen hide
    SplashScreen.hide().catch(() => {})
  } catch (err) {
    console.warn('Erro ao inicializar Capacitor:', err)
  }
}

/**
 * Hook para gerenciar o botão físico / gesto de voltar do Android:
 * - Em telas de detalhe ou formulários: volta para a tela anterior
 * - Em abas secundárias (/gastos, /metas, /aprender, /perfil): volta para /inicio
 * - Na raiz (/inicio ou login/cadastro): duplo toque para sair com aviso toast
 */
export function useAndroidBackButton(): void {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    let lastBackPress = 0

    const listenerPromise = CapApp.addListener('backButton', ({ canGoBack }) => {
      const pathname = window.location.pathname
      const tabRoots = ['/gastos', '/metas', '/aprender', '/perfil']
      const exitRoots = ['/inicio', '/', '/boas-vindas', '/entrar', '/cadastrar']

      if (exitRoots.includes(pathname)) {
        const now = Date.now()
        if (now - lastBackPress < 2000) {
          CapApp.exitApp()
        } else {
          lastBackPress = now
          toast('Pressione voltar novamente para sair', { duration: 1800 })
        }
      } else if (tabRoots.includes(pathname)) {
        navigate('/inicio')
      } else if (canGoBack) {
        navigate(-1)
      } else {
        navigate('/inicio')
      }
    })

    return () => {
      listenerPromise.then((handle) => handle.remove()).catch(() => {})
    }
  }, [navigate, location])
}
