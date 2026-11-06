import { LocalNotifications } from '@capacitor/local-notifications'
import { Capacitor } from '@capacitor/core'

let isChannelCreated = false

/**
 * Cria canal nativo de notificações no Android (Android 8.0+)
 */
export async function initNotificationsChannel(): Promise<void> {
  if (!Capacitor.isNativePlatform() || isChannelCreated) return
  try {
    await LocalNotifications.createChannel({
      id: 'purplepiggy_alerts',
      name: 'Alertas PurplePiggy',
      description: 'Lembretes de metas, alertas de gastos e ofensiva',
      importance: 4,
      visibility: 1,
      vibration: true,
      sound: 'res_custom_notification',
    })
    isChannelCreated = true
  } catch (err) {
    console.warn('[Notifications] Erro ao criar canal Android:', err)
  }
}

/**
 * Solicita permissão para exibir notificações nativas (Android 13+ / Web)
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    try {
      const status = await LocalNotifications.checkPermissions()
      if (status.display !== 'granted') {
        const req = await LocalNotifications.requestPermissions()
        return req.display === 'granted'
      }
      return true
    } catch (err) {
      console.warn('[Notifications] Falha ao solicitar permissão nativa:', err)
      return false
    }
  }

  // Fallback para Web Notifications API no navegador
  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      if (Notification.permission === 'granted') return true
      if (Notification.permission !== 'denied') {
        const result = await Notification.requestPermission()
        return result === 'granted'
      }
    } catch {
      return false
    }
  }

  return false
}

/**
 * Envia ou agenda notificação local imediatamente
 */
export async function sendLocalNotification(
  title: string,
  body: string,
  id: number = Math.floor(Math.random() * 100000)
): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    try {
      await initNotificationsChannel()
      const granted = await requestNotificationPermissions()
      if (!granted) {
        console.warn('[Notifications] Permissão negada pelo usuário.')
        return false
      }

      await LocalNotifications.schedule({
        notifications: [
          {
            id,
            title,
            body,
            channelId: 'purplepiggy_alerts',
            schedule: { at: new Date(Date.now() + 500) },
            smallIcon: 'ic_launcher',
          },
        ],
      })
      return true
    } catch (err) {
      console.error('[Notifications] Falha ao agendar notificação:', err)
      return false
    }
  }

  // Web Notification fallback
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: '/assets/mascot/pig-head.webp',
      })
      return true
    } catch {
      return false
    }
  }

  return false
}
