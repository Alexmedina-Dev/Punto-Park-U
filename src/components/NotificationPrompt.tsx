import { useEffect, useState } from 'react'
import {
  requestNotificationPermission,
  registerServiceWorker,
  subscribeToPushNotifications,
} from '@/services/notification.service'
import { useAuthStore } from '@/stores/authStore'

const DISMISSED_KEY = 'pushPromptDismissed'

export function NotificationPrompt() {
  const { isAuthenticated } = useAuthStore()
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) return
    if (localStorage.getItem(DISMISSED_KEY)) return
    if (!('Notification' in window)) return
    if (Notification.permission !== 'default') return

    setShow(true)
  }, [isAuthenticated])

  const handleActivate = async () => {
    const granted = await requestNotificationPermission()
    if (granted) {
      const registration = await registerServiceWorker()
      if (registration) {
        await subscribeToPushNotifications(registration)
      }
    }
    localStorage.setItem(DISMISSED_KEY, 'true')
    setShow(false)
  }

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, 'true')
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-6 sm:bottom-6 sm:w-[380px]">
      <div className="bg-surface-container border border-outline/20 rounded-xl shadow-brutal p-4">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-primary mt-0.5">notifications_active</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-on-bg">
              Activa las notificaciones
            </p>
            <p className="text-xs text-on-surface-var mt-1">
              Recibe alertas de tu parqueadero: pagos, ingresos, salidas y más.
            </p>
          </div>
        </div>
        <div className="flex gap-2 mt-3 justify-end">
          <button
            onClick={handleDismiss}
            className="px-3 py-1.5 text-xs font-medium text-on-surface-var hover:text-on-bg rounded-lg hover:bg-surface-high transition-colors"
          >
            Más tarde
          </button>
          <button
            onClick={handleActivate}
            className="px-4 py-1.5 text-xs font-bold text-bg bg-primary hover:bg-primary/90 rounded-lg transition-colors"
          >
            Activar
          </button>
        </div>
      </div>
    </div>
  )
}
