// ╔══════════════════════════════════════════════════════════════════════╗
// ║  Web API Client — initializes @punto-park-u/shared-api              ║
// ║  with browser-specific config (localStorage, window redirect)       ║
// ╚══════════════════════════════════════════════════════════════════════╝

import { initApiClient, getApiClient } from '@punto-park-u/shared-api'
import { API_BASE_URL, API_TIMEOUT, STORAGE_KEYS } from '@/utils/constants'

/**
 * Initialize the shared API client with web-specific token storage
 * and auth failure redirect (browser navigation).
 *
 * Callers (services) use `getApiClient()` or the default export `api`.
 */
export const api = initApiClient({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  getToken: () => localStorage.getItem(STORAGE_KEYS.TOKEN),
  getRefreshToken: () => localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
  onAuthFailure: () => {
    // If token is already gone, user logged out intentionally — skip redirect
    if (!localStorage.getItem(STORAGE_KEYS.TOKEN)) return

    // Clear auth state on token refresh failure
    localStorage.removeItem(STORAGE_KEYS.TOKEN)
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.USER)

    const currentPath = window.location.pathname
    if (currentPath !== '/login' && currentPath !== '/register') {
      window.location.href = '/'
    }
  },
  debug: import.meta.env.DEV,
})

export default api
export { getApiClient }
