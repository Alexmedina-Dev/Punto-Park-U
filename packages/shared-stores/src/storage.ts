import type { StorageAdapter } from '@punto-park-u/shared-types'
import { createWebStorageAdapter } from './createStorageAdapter.js'

// ── Module-level Storage ──
// Set during app initialization. Defaults to web (localStorage) adapter.

let _adapter: StorageAdapter = createWebStorageAdapter()

/**
 * Set the global storage adapter.
 * Call once during app startup:
 *   - Web:  setStorageAdapter(createWebStorageAdapter(localStorage))
 *   - Mobile: setStorageAdapter(createMobileStorageAdapter(AsyncStorage))
 */
export function setStorageAdapter(adapter: StorageAdapter): void {
  _adapter = adapter
}

/**
 * Get the current storage adapter.
 */
export function getStorage(): StorageAdapter {
  return _adapter
}

// ── Storage Key Constants ──

export const STORAGE_KEYS = {
  TOKEN: 'token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
  THEME: 'theme',
} as const

export const DEFAULT_RETRY = {
  MAX_RETRIES: 3,
  BASE_DELAY: 1000,
  MAX_DELAY: 5000,
} as const

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  ADMIN: '/admin',
  VERIFY_EMAIL: '/verify-email',
  TWO_FACTOR_SETUP: '/2fa/setup',
  TWO_FACTOR_VERIFY: '/2fa/verify',
  SESSIONS: '/sessions',
} as const
