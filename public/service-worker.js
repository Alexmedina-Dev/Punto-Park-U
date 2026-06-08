// ── Punto Park U — Service Worker ─────────────────────────────────────
// Handles push notifications and background sync for the PWA.

const CACHE_NAME = 'punto-park-u-v1'

// ── Install event ─────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...')
  // Force activate immediately — don't wait for existing tabs
  self.skipWaiting()
})

// ── Activate event ────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...')
  // Clean up old caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    })
  )
  // Take control of all clients immediately
  self.clients.claim()
})

// ── Push event ────────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received')

  let data
  try {
    data = event.data?.json() || { title: 'Punto Park U', message: 'Nueva notificación' }
  } catch {
    data = { title: 'Punto Park U', message: event.data?.text() || 'Nueva notificación' }
  }

  const title = data.title || 'Punto Park U'
  const options = {
    body: data.message || 'Tienes una nueva notificación',
    icon: '/images/Logo.png',
    badge: '/images/Logo.png',
    tag: `notification-${data.timestamp || Date.now()}`,
    data: data.data || {},
    vibrate: [200, 100, 200],
    requireInteraction: false,
    // Actions for different notification types
    actions: data.data?.type === 'reservation_reminder'
      ? [
          { action: 'view', title: 'Ver reserva' },
          { action: 'dismiss', title: 'Ignorar' },
        ]
      : data.data?.type === 'payment_confirmed'
        ? [
            { action: 'view', title: 'Ver pago' },
          ]
        : undefined,
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  )
})

// ── Notification click event ──────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action)

  // Close the notification
  event.notification.close()

  // Determine URL based on notification data or action
  const notificationData = event.notification.data || {}
  let url = '/'

  if (notificationData.type) {
    switch (notificationData.type) {
      case 'reservation_reminder':
        url = '/dashboard'
        break
      case 'payment_confirmed':
        url = '/dashboard'
        break
      case 'entry_alert':
      case 'exit_alert':
        url = '/dashboard'
        break
      default:
        url = '/'
    }
  }

  // Handle action clicks
  if (event.action === 'dismiss') {
    return
  }

  // Focus or open the app
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // If we have a focused client, use it
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.postMessage({
              type: 'NOTIFICATION_CLICKED',
              data: notificationData,
            })
            return client.focus()
          }
        }
        // Otherwise open a new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(url)
        }
      })
  )
})

// ── Message event (from app) ──────────────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
