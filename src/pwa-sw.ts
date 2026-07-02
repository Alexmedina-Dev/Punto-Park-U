/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope

import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'

// ── Precache (injected by vite-plugin-pwa) ──
precacheAndRoute(self.__WB_MANIFEST)

// ── Navigation fallback ──
const handler = createHandlerBoundToURL('/index.html')
registerRoute(
  ({ request }) => request.mode === 'navigate',
  handler,
)

// ── API GET: NetworkFirst with cache fallback ──
registerRoute(
  ({ url, request }) =>
    request.method === 'GET' &&
    /\/api\/(tariffs|schedule|availability|reservations|vehicles)/.test(url.pathname),
  new NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 5,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 5 * 60 }),
    ],
  }),
)

// ── Static assets: CacheFirst ──
registerRoute(
  ({ request }) =>
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'image' ||
    request.destination === 'font',
  new CacheFirst({
    cacheName: 'static-assets',
    plugins: [
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 }),
    ],
  }),
)

// ── Push notification handlers ──
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received')

  let data: { title?: string; message?: string; data?: Record<string, unknown>; timestamp?: number }
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
    actions: data.data?.type === 'reservation_reminder'
      ? [
          { action: 'view', title: 'Ver reserva' },
          { action: 'dismiss', title: 'Ignorar' },
        ]
      : data.data?.type === 'payment_confirmed'
        ? [{ action: 'view', title: 'Ver pago' }]
        : undefined,
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action)
  event.notification.close()

  const notificationData = (event.notification.data || {}) as Record<string, unknown>
  let url = '/'

  if (notificationData.type) {
    switch (notificationData.type) {
      case 'reservation_reminder':
      case 'payment_confirmed':
      case 'entry_alert':
      case 'exit_alert':
        url = '/dashboard'
        break
    }
  }

  if (event.action === 'dismiss') return

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.postMessage({ type: 'NOTIFICATION_CLICKED', data: notificationData })
            return client.focus()
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(url)
        }
      }),
  )
})

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
