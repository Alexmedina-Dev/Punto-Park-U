import { getApiClient } from './api.js'
import type { ApiResponse } from '@punto-park-u/shared-types'

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

export interface NotificationsResponse {
  notifications: Notification[]
  total: number
  unreadCount: number
  limit: number
  offset: number
}

export interface UnreadCountResponse {
  unreadCount: number
}

export interface VapidPublicKeyResponse {
  publicKey: string | null
}

// ── Service ──

const NOTIFICATION_BASE = '/notifications'

export async function getNotifications(params?: {
  limit?: number
  offset?: number
  unread?: boolean
}): Promise<NotificationsResponse> {
  const api = getApiClient()
  const { data } = await api.get<ApiResponse<Notification[]> & { pagination: { total: number; unreadCount: number; limit: number; offset: number } }>(
    NOTIFICATION_BASE,
    { params }
  )
  return {
    notifications: data.data,
    total: data.pagination.total,
    unreadCount: data.pagination.unreadCount,
    limit: data.pagination.limit,
    offset: data.pagination.offset,
  }
}

export async function getUnreadCount(): Promise<number> {
  const api = getApiClient()
  const { data } = await api.get<ApiResponse<UnreadCountResponse>>(`${NOTIFICATION_BASE}/unread-count`)
  return data.data.unreadCount
}

export async function markAsRead(notificationId: string): Promise<void> {
  const api = getApiClient()
  await api.patch(`${NOTIFICATION_BASE}/${notificationId}/read`)
}

export async function markAllAsRead(): Promise<number> {
  const api = getApiClient()
  const { data } = await api.patch<ApiResponse<{ modifiedCount: number }>>(`${NOTIFICATION_BASE}/read-all`)
  return data.data.modifiedCount
}

export async function deleteNotification(notificationId: string): Promise<void> {
  const api = getApiClient()
  await api.delete(`${NOTIFICATION_BASE}/${notificationId}`)
}

export async function subscribeToPush(subscription: PushSubscription): Promise<void> {
  const sub = subscription.toJSON()
  const api = getApiClient()
  await api.post(`${NOTIFICATION_BASE}/subscribe`, {
    endpoint: sub.endpoint,
    keys: sub.keys,
  })
}

export async function unsubscribeFromPush(endpoint: string): Promise<void> {
  const api = getApiClient()
  await api.delete(`${NOTIFICATION_BASE}/subscribe`, {
    data: { endpoint },
  })
}

export async function getVapidPublicKey(): Promise<string | null> {
  const api = getApiClient()
  const { data } = await api.get<ApiResponse<VapidPublicKeyResponse>>(`${NOTIFICATION_BASE}/vapid-public-key`)
  return data.data.publicKey
}
