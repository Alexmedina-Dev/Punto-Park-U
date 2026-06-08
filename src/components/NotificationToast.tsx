import { useEffect } from 'react'
import { toast } from 'sonner'
import { useNotificationStore } from '@/stores/notificationStore'
import type { Notification as AppNotification } from '@/services/notification.service'

// ── Icon map ──────────────────────────────────────────────────────────

const NOTIFICATION_ICONS: Record<string, string> = {
  reservation_reminder: '⏰',
  payment_confirmed: '✅',
  entry_alert: '🚗',
  exit_alert: '👋',
  system_alert: 'ℹ️',
}

/**
 * NotificationToast is a background component that subscribes to WebSocket
 * notification events and shows a sonner toast for each new notification.
 *
 * This provides fallback toasts when push notifications are not available
 * or when the user has denied notification permission.
 */
export function NotificationToast() {
  const addNotification = useNotificationStore((state) => state.addNotification)

  useEffect(() => {
    // Listen for new notifications dispatched via a custom event
    // (used when push notification is received while app is focused)
    const handleNewNotification = (e: CustomEvent<AppNotification>) => {
      const notification = e.detail

      // Only show toast if push is not supported or permission denied
      if (!('Notification' in window) || window.Notification.permission === 'denied') {
        showNotificationToast(notification)
      }
    }

    window.addEventListener(
      'notification:incoming' as string,
      handleNewNotification as EventListener
    )

    return () => {
      window.removeEventListener(
        'notification:incoming' as string,
        handleNewNotification as EventListener
      )
    }
  }, [addNotification])

  return null // This component doesn't render anything visible
}

/**
 * Show a sonner toast for a notification.
 * Used as fallback when push notifications are denied/unavailable.
 */
export function showNotificationToast(notification: AppNotification) {
  const icon = NOTIFICATION_ICONS[notification.type] || '🔔'

  toast(
    <div className="flex gap-3 min-w-0">
      <span className="text-lg flex-shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-on-bg truncate">{notification.title}</p>
        <p className="text-xs text-on-surface-var mt-0.5 line-clamp-2">{notification.message}</p>
      </div>
    </div>,
    {
      duration: 5000,
      style: {
        background: '#272a32',
        color: '#e1e2ec',
        border: '1px solid rgba(167, 200, 255, 0.1)',
      },
    }
  )
}

export default NotificationToast
