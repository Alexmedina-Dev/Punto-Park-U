// ╔══════════════════════════════════════════════════════════════════════╗
// ║  Re-export wrapper — web app                                       ║
// ║  Notification store now comes from @punto-park-u/shared-stores      ║
// ║  WebSocket listeners keep web-specific behavior                     ║
// ╚══════════════════════════════════════════════════════════════════════╝

export { useNotificationStore } from '@punto-park-u/shared-stores'
export type { NotificationsState, Notification } from '@punto-park-u/shared-stores'

// ── WebSocket listener (web-specific) ──

import { useNotificationStore as sharedStore } from '@punto-park-u/shared-stores'
import type { Notification as NotifType } from '@punto-park-u/shared-stores'
import wsService from '@/services/websocket.service'

export function initNotificationListeners(): () => void {
  const store = sharedStore.getState()

  const unsubNew = wsService.on('notification:new', (notification: NotifType) => {
    store.addNotification(notification)
  })

  const unsubRead = wsService.on('notification:read', (data: { id: string }) => {
    store.updateNotificationRead(data.id)
  })

  const unsubAllRead = wsService.on('notification:all-read', () => {
    store.clearAllRead()
  })

  const unsubDeleted = wsService.on('notification:deleted', (data: { id: string }) => {
    store.removeNotification(data.id)
  })

  return () => {
    unsubNew()
    unsubRead()
    unsubAllRead()
    unsubDeleted()
  }
}
