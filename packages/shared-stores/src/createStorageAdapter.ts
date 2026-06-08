import type { StorageAdapter } from '@punto-park-u/shared-types'

/**
 * Create a web-compatible storage adapter backed by `localStorage`.
 * Synchronous — wraps localStorage calls directly.
 */
export function createWebStorageAdapter(storage: Storage = localStorage): StorageAdapter {
  return {
    getItem(key: string): string | null {
      try {
        return storage.getItem(key)
      } catch {
        return null
      }
    },
    setItem(key: string, value: string): void {
      try {
        storage.setItem(key, value)
      } catch {
        // Storage full or unavailable — silently fail
      }
    },
    removeItem(key: string): void {
      try {
        storage.removeItem(key)
      } catch {
        // Silently fail
      }
    },
  }
}

/**
 * Create a mobile-compatible storage adapter backed by AsyncStorage
 * (or any similar async store like Expo SecureStore).
 * Returns the same interface but with async methods.
 */
export function createMobileStorageAdapter(storage: {
  getItem(key: string): Promise<string | null>
  setItem(key: string, value: string): Promise<void>
  removeItem(key: string): Promise<void>
}): StorageAdapter {
  return {
    getItem(key: string): Promise<string | null> {
      return storage.getItem(key)
    },
    setItem(key: string, value: string): Promise<void> {
      return storage.setItem(key, value)
    },
    removeItem(key: string): Promise<void> {
      return storage.removeItem(key)
    },
  }
}

/**
 * In-memory storage adapter (useful for testing).
 * Stores data in a Map — no persistence between sessions.
 */
export function createMemoryStorageAdapter(): StorageAdapter {
  const store = new Map<string, string>()

  return {
    getItem(key: string): string | null {
      return store.get(key) ?? null
    },
    setItem(key: string, value: string): void {
      store.set(key, value)
    },
    removeItem(key: string): void {
      store.delete(key)
    },
  }
}
