// ╔══════════════════════════════════════════════════════════════════════╗
// ║  Web notification service                                          ║
// ║  API calls from shared-api + browser-specific push helpers          ║
// ╚══════════════════════════════════════════════════════════════════════╝

// Import API functions we need for the browser helpers
import {
  subscribeToPush as apiSubscribeToPush,
  unsubscribeFromPush as apiUnsubscribeFromPush,
  getVapidPublicKey as apiGetVapidPublicKey,
} from '@punto-park-u/shared-api'

// Re-export everything from shared-api
export {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '@punto-park-u/shared-api'
export type { Notification, NotificationsResponse } from '@punto-park-u/shared-api'

// ── Service Worker / Push Helpers (browser-specific) ──

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('[notifications] Service Worker / Push not supported')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/',
    })
    console.log('[notifications] Service Worker registered:', registration.scope)
    return registration
  } catch (err) {
    console.error('[notifications] Service Worker registration failed:', err)
    return null
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('[notifications] Notifications not supported')
    return false
  }

  if (Notification.permission === 'granted') {
    return true
  }

  if (Notification.permission === 'denied') {
    console.log('[notifications] Notification permission denied')
    return false
  }

  try {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  } catch (err) {
    console.error('[notifications] Error requesting permission:', err)
    return false
  }
}

export async function subscribeToPushNotifications(
  registration: ServiceWorkerRegistration
): Promise<boolean> {
  try {
    const publicKey = await apiGetVapidPublicKey()
    if (!publicKey) {
      console.log('[notifications] No VAPID public key available')
      return false
    }

    let subscription = await registration.pushManager.getSubscription()
    if (subscription) {
      await apiSubscribeToPush(subscription)
      return true
    }

    const convertedKey = urlBase64ToUint8Array(publicKey)

    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedKey as BufferSource,
    })

    await apiSubscribeToPush(subscription)
    console.log('[notifications] Push subscription successful')
    return true
  } catch (err) {
    console.error('[notifications] Push subscription failed:', err)
    return false
  }
}

export async function unsubscribeFromPushNotifications(
  registration: ServiceWorkerRegistration
): Promise<boolean> {
  try {
    const subscription = await registration.pushManager.getSubscription()
    if (!subscription) return true

    const endpoint = subscription.endpoint
    await subscription.unsubscribe()
    await apiUnsubscribeFromPush(endpoint)
    console.log('[notifications] Unsubscribed from push')
    return true
  } catch (err) {
    console.error('[notifications] Unsubscribe failed:', err)
    return false
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
