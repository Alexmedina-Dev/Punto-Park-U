import { useEffect, useCallback } from 'react'
import { useNotificationStore } from '@/stores/notificationStore'
import type { Notification } from '@/services/notification.service'

interface NotificationListProps {
  onClose: () => void
}

// ── Helpers ───────────────────────────────────────────────────────────

const NOTIFICATION_ICONS: Record<string, string> = {
  reservation_reminder: 'alarm',
  payment_confirmed: 'paid',
  entry_alert: 'login',
  exit_alert: 'logout',
  system_alert: 'info',
}

const NOTIFICATION_COLORS: Record<string, string> = {
  reservation_reminder: 'text-yellow-400',
  payment_confirmed: 'text-green-400',
  entry_alert: 'text-blue-400',
  exit_alert: 'text-orange-400',
  system_alert: 'text-purple-400',
}

function getTimeAgo(dateStr: string): string {
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diff = now - date

  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Ahora'
  if (minutes === 1) return 'Hace 1 min'
  if (minutes < 60) return `Hace ${minutes} min`

  const hours = Math.floor(minutes / 60)
  if (hours === 1) return 'Hace 1 hora'
  if (hours < 24) return `Hace ${hours} horas`

  const days = Math.floor(hours / 24)
  if (days === 1) return 'Hace 1 día'
  return `Hace ${days} días`
}

// ── Single notification item ──────────────────────────────────────────

function NotificationItem({
  notification,
  onMarkRead,
  onDelete,
}: {
  notification: Notification
  onMarkRead: (id: string) => void
  onDelete: (id: string) => void
}) {
  const icon = NOTIFICATION_ICONS[notification.type] || 'notifications'
  const color = NOTIFICATION_COLORS[notification.type] || 'text-on-surface-var'

  return (
    <div
      className={`flex gap-3 px-4 py-3 transition-colors hover:bg-surface-high group ${
        !notification.read ? 'bg-primary/[0.03] border-l-2 border-primary' : 'border-l-2 border-transparent'
      }`}
      role="button"
      tabIndex={0}
      onClick={() => {
        if (!notification.read) onMarkRead(notification.id)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !notification.read) onMarkRead(notification.id)
      }}
      data-testid={`notification-item-${notification.id}`}
    >
      {/* Icon */}
      <div className={`flex-shrink-0 w-9 h-9 rounded-full bg-surface-high flex items-center justify-center ${color}`}>
        <span className="material-symbols-outlined text-lg">{icon}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${!notification.read ? 'font-semibold text-on-bg' : 'font-normal text-on-surface-var'}`}>
          {notification.title}
        </p>
        <p className="text-xs text-on-surface-var mt-0.5 line-clamp-2">
          {notification.message}
        </p>
        <p className="text-[10px] text-on-surface-var/60 mt-1">
          {getTimeAgo(notification.createdAt)}
        </p>
      </div>

      {/* Delete button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onDelete(notification.id)
        }}
        className="flex-shrink-0 opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded hover:bg-surface-high transition-all text-on-surface-var/50 hover:text-red-400"
        aria-label="Eliminar notificación"
      >
        <span className="material-symbols-outlined text-sm">close</span>
      </button>
    </div>
  )
}

// ── Notification list (dropdown content) ─────────────────────────────┘

export function NotificationList({ onClose }: NotificationListProps) {
  const {
    notifications,
    isLoading,
    unreadCount,
    fetchNotifications,
    markAsRead: markRead,
    markAllAsRead: markAllRead,
    deleteNotification: deleteNotif,
  } = useNotificationStore()

  useEffect(() => {
    fetchNotifications({ limit: 20 })
  }, [fetchNotifications])

  const handleMarkRead = useCallback(
    (id: string) => {
      markRead(id)
    },
    [markRead]
  )

  const handleDelete = useCallback(
    (id: string) => {
      deleteNotif(id)
    },
    [deleteNotif]
  )

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-outline/10">
        <h3 className="text-sm font-semibold text-on-bg">Notificaciones</h3>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs text-primary hover:text-primary/80 transition-colors font-medium"
            >
              Marcar todas leídas
            </button>
          )}
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-surface-high transition-colors text-on-surface-var"
            aria-label="Cerrar"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      </div>

      {/* List */}
      <div className="max-h-[400px] overflow-y-auto">
        {isLoading && notifications.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-on-surface-var">
            <span className="material-symbols-outlined text-3xl mb-2">notifications_off</span>
            <p className="text-sm">No hay notificaciones</p>
          </div>
        ) : (
          <>
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkRead={handleMarkRead}
                onDelete={handleDelete}
              />
            ))}
          </>
        )}
      </div>
    </div>
  )
}
