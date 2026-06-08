import { create } from 'zustand'

// ── Types ──

export interface Notification {
  id: string
  type: 'reservation_reminder' | 'payment_confirmed' | 'entry_alert' | 'exit_alert' | 'system_alert'
  title: string
  message: string
  data: Record<string, unknown>
  read: boolean
  readAt: string | null
  createdAt: string
  updatedAt: string
}

import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '@punto-park-u/shared-api'

// ── State ──

export interface NotificationsState {
  notifications: Notification[]
  unreadCount: number
  total: number
  isLoading: boolean
  isOpen: boolean

  // Actions
  fetchNotifications: (params?: { limit?: number; offset?: number; unread?: boolean }) => Promise<void>
  fetchUnreadCount: () => Promise<void>
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (notificationId: string) => Promise<void>
  setIsOpen: (isOpen: boolean) => void
  addNotification: (notification: Notification) => void
  updateNotificationRead: (notificationId: string) => void
  clearAllRead: () => void
  removeNotification: (notificationId: string) => void
}

// ── Store ──

export const useNotificationStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  total: 0,
  isLoading: false,
  isOpen: false,

  fetchNotifications: async (params) => {
    set({ isLoading: true })
    try {
      const result = await getNotifications(params)
      set({
        notifications: result.notifications,
        total: result.total,
        unreadCount: result.unreadCount,
        isLoading: false,
      })
    } catch {
      set({ isLoading: false })
    }
  },

  fetchUnreadCount: async () => {
    try {
      const count = await getUnreadCount()
      set({ unreadCount: count })
    } catch {
      console.warn('[notifications] Failed to fetch unread count')
    }
  },

  markAsRead: async (notificationId) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === notificationId ? { ...n, read: true, readAt: new Date().toISOString() } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }))

    try {
      await markAsRead(notificationId)
    } catch {
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === notificationId ? { ...n, read: false, readAt: null } : n
        ),
        unreadCount: state.unreadCount + 1,
      }))
    }
  },

  markAllAsRead: async () => {
    const previousUnread = get().unreadCount

    set((state) => ({
      notifications: state.notifications.map((n) => ({
        ...n,
        read: true,
        readAt: n.readAt || new Date().toISOString(),
      })),
      unreadCount: 0,
    }))

    try {
      await markAllAsRead()
    } catch {
      set((state) => ({
        notifications: state.notifications.map((n) => ({
          ...n,
          read: false,
          readAt: null,
        })),
        unreadCount: previousUnread,
      }))
    }
  },

  deleteNotification: async (notificationId) => {
    const previous = get().notifications
    const removed = previous.find((n) => n.id === notificationId)

    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== notificationId),
      total: Math.max(0, state.total - 1),
      unreadCount: removed && !removed.read ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
    }))

    try {
      await deleteNotification(notificationId)
    } catch {
      set(() => ({
        notifications: [...previous],
        unreadCount: removed && !removed.read ? previous.length : 0,
      }))
    }
  },

  setIsOpen: (isOpen) => {
    set({ isOpen })
  },

  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      total: state.total + 1,
      unreadCount: state.unreadCount + 1,
    }))
  },

  updateNotificationRead: (notificationId) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === notificationId ? { ...n, read: true, readAt: new Date().toISOString() } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }))
  },

  clearAllRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({
        ...n,
        read: true,
        readAt: n.readAt || new Date().toISOString(),
      })),
      unreadCount: 0,
    }))
  },

  removeNotification: (notificationId) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== notificationId),
    }))
  },
}))
