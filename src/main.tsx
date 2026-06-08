import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'

// ── Initialize shared packages ──
// Sets up storage adapter (localStorage for web) before any store is used.
import './stores/setup'
// API client MUST be initialized before any service calls getApiClient()
import './services/api'

import { registerServiceWorker } from './services/notification.service'
import { initNotificationListeners } from './stores/notificationStore'
import wsService from './services/websocket.service'
import './index.css'

// ── Initialize notification system ──────────────────────────────────
// Runs outside React to ensure early setup

async function initNotifications() {
  // Register service worker for push notifications
  const registration = await registerServiceWorker()
  if (registration) {
    console.log('[init] Service worker registered for push notifications')
  }

  // Connect WebSocket for real-time notifications
  wsService.connect()

  // Initialize WebSocket notification listeners
  initNotificationListeners()
}

initNotifications().catch((err) => {
  console.warn('[init] Notification initialization:', err.message)
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
