import { useEffect, useRef, useCallback } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { sendActivityHeartbeatService } from '@/services/auth.service'
import { ACTIVITY_HEARTBEAT_INTERVAL, SESSION_TIMEOUT } from '@/utils/constants'

/**
 * Hook that tracks user activity and sends periodic heartbeats
 * to the session management system.
 *
 * - Monitors mouse movements and keyboard events
 * - Sends heartbeat every 5 minutes (configurable)
 * - Auto-logout on session expiry / inactivity
 */
export function useSessionActivity() {
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastActivityRef = useRef<number>(Date.now())
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const logout = useAuthStore((s) => s.logout)
  const isActive = useRef<boolean>(false)

  // Track user activity
  const handleUserActivity = useCallback(() => {
    lastActivityRef.current = Date.now()
  }, [])

  // Send heartbeat to server
  const sendHeartbeat = useCallback(async () => {
    if (!isAuthenticated) return

    try {
      await sendActivityHeartbeatService()
    } catch (error) {
      // If session was revoked or expired, the server will return 401
      // The API interceptor handles token refresh and redirect
      console.warn('[session] Heartbeat failed:', error)
    }
  }, [isAuthenticated])

  // Check inactivity timeout
  const checkInactivity = useCallback(() => {
    if (!isAuthenticated || !isActive.current) return

    const inactiveDuration = Date.now() - lastActivityRef.current
    if (inactiveDuration >= SESSION_TIMEOUT) {
      console.warn('[session] Inactivity timeout reached, logging out')
      logout()
    }
  }, [isAuthenticated, logout])

  // Setup and teardown
  useEffect(() => {
    if (!isAuthenticated) {
      isActive.current = false
      return
    }

    isActive.current = true
    lastActivityRef.current = Date.now()

    // Activity event listeners
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click']
    events.forEach((event) => {
      window.addEventListener(event, handleUserActivity, { passive: true })
    })

    // Periodic heartbeat
    heartbeatRef.current = setInterval(() => {
      sendHeartbeat()
      checkInactivity()
    }, ACTIVITY_HEARTBEAT_INTERVAL)

    return () => {
      isActive.current = false
      events.forEach((event) => {
        window.removeEventListener(event, handleUserActivity)
      })
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current)
        heartbeatRef.current = null
      }
    }
  }, [isAuthenticated, handleUserActivity, sendHeartbeat, checkInactivity])
}
