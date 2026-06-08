import { create } from 'zustand'
import type {
  User,
  LoginCredentials,
  RegisterData,
  AuthResponse,
  LoginResponse2FA,
  SessionData,
  UserRole,
} from '@punto-park-u/shared-types'
import {
  loginService,
  registerService,
  logoutService,
  forgotPasswordService,
  resetPasswordService,
  verify2FAService,
  verifyBackupCodeService,
  getSessionsService,
  revokeSessionService,
  revokeAllSessionsService,
  getProfileService,
  withRetry,
} from '@punto-park-u/shared-api'
import { getStorage, STORAGE_KEYS } from './storage.js'

const ROLE_HIERARCHY: Record<UserRole, number> = {
  guest: 0,
  user: 1,
  operator: 2,
  admin: 3,
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isAdmin: boolean
  isOperator: boolean
  isUser: boolean
  isGuest: boolean
  userRole: UserRole | null
  token: string | null
  isLoading: boolean
  error: string | null

  // 2FA state
  requiresTwoFactor: boolean
  tempToken: string | null

  // Session state
  sessions: SessionData[]
  sessionsLoading: boolean

  // Actions
  login: (credentials: LoginCredentials) => Promise<boolean | LoginResponse2FA>
  logout: () => void
  register: (data: RegisterData) => Promise<boolean | { needsVerification: boolean; email: string }>
  setUser: (user: User | null) => void
  clearError: () => void
  restoreSession: () => Promise<void>
  handleOAuthCallback: (token: string, refreshToken: string, user: User) => void
  forgotPassword: (email: string) => Promise<{ success: boolean; message: string }>
  resetPassword: (token: string, password: string) => Promise<{ success: boolean; message: string }>
  hasRole: (targetRole: UserRole) => boolean

  // 2FA Actions
  complete2FALogin: (user: User, token: string, refreshToken: string) => void
  clearTwoFactorState: () => void
  setTwoFactorTempToken: (tempToken: string) => void

  // Session Actions
  fetchSessions: () => Promise<void>
  revokeSession: (sessionId: string) => Promise<boolean>
  revokeAllOtherSessions: () => Promise<boolean>
}

function getRole(user: User | null): UserRole {
  return (user?.rol || user?.role || 'guest') as UserRole
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isAdmin: false,
  isOperator: false,
  isUser: false,
  isGuest: false,
  userRole: null,
  token: null,
  isLoading: false,
  error: null,
  requiresTwoFactor: false,
  tempToken: null,
  sessions: [],
  sessionsLoading: false,

  login: async (credentials) => {
    set({ isLoading: true, error: null, requiresTwoFactor: false, tempToken: null })
    try {
      const response = await withRetry(() => loginService(credentials))

      // Check if 2FA is required
      const twoFactorResponse = response as LoginResponse2FA
      if (twoFactorResponse.requiresTwoFactor && twoFactorResponse.tempToken) {
        set({
          user: twoFactorResponse.user,
          tempToken: twoFactorResponse.tempToken,
          requiresTwoFactor: true,
          isLoading: false,
          error: null,
          isAuthenticated: false,
        })
        return twoFactorResponse
      }

      // Normal login (no 2FA)
      const authResponse = response as AuthResponse
      const { user, token } = authResponse

      // Persist via storage adapter
      const storage = getStorage()
      if (token) {
        await Promise.resolve(storage.setItem(STORAGE_KEYS.TOKEN, token))
      }
      if (authResponse.refreshToken) {
        await Promise.resolve(storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, authResponse.refreshToken))
      }
      if (user) {
        await Promise.resolve(storage.setItem(STORAGE_KEYS.USER, JSON.stringify(user)))
      }

      const role = getRole(user)
      set({
        user,
        token: token || null,
        isAuthenticated: true,
        isAdmin: role === 'admin',
        isOperator: role === 'admin' || role === 'operator',
        isUser: role !== 'guest',
        isGuest: role === 'guest',
        userRole: role,
        isLoading: false,
        error: null,
        requiresTwoFactor: false,
        tempToken: null,
      })

      return true
    } catch (error) {
      let errorMsg = 'Usuario o contraseña incorrectos'
      if (error instanceof Error) {
        errorMsg = error.message
      }
      set({ error: errorMsg, isLoading: false, requiresTwoFactor: false, tempToken: null })
      return false
    }
  },

  logout: () => {
    const token = get().token
    if (token) {
      logoutService().catch(() => {
        // Best-effort server logout
      })
    }

    const storage = getStorage()
    Promise.resolve(storage.removeItem(STORAGE_KEYS.TOKEN))
    Promise.resolve(storage.removeItem(STORAGE_KEYS.REFRESH_TOKEN))
    Promise.resolve(storage.removeItem(STORAGE_KEYS.USER))

    set({
      user: null,
      isAuthenticated: false,
      isAdmin: false,
      isOperator: false,
      isUser: false,
      isGuest: false,
      userRole: null,
      token: null,
      error: null,
    })
  },

  register: async (data) => {
    set({ isLoading: true, error: null })
    try {
      const response = await withRetry(() => registerService(data))

      // If strict mode, response has user but no tokens — needs verification
      if (response && !response.token && !response.accessToken) {
        set({ isLoading: false, error: null })
        return { needsVerification: true, email: response.user?.email || data.username || '' }
      }

      // Normal flow: store tokens and user
      const token = response.token || response.accessToken || ''
      const refreshToken = response.refreshToken
      const user = response.user

      const storage = getStorage()
      if (token) {
        await Promise.resolve(storage.setItem(STORAGE_KEYS.TOKEN, token))
      }
      if (refreshToken) {
        await Promise.resolve(storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken))
      }
      if (user) {
        await Promise.resolve(storage.setItem(STORAGE_KEYS.USER, JSON.stringify(user)))
      }

      const role = getRole(user)
      set({
        user,
        token,
        isAuthenticated: true,
        isAdmin: role === 'admin',
        isOperator: role === 'admin' || role === 'operator',
        isUser: role !== 'guest',
        isGuest: role === 'guest',
        userRole: role,
        isLoading: false,
        error: null,
      })

      return true
    } catch (error) {
      let errorMsg = 'Error al registrar usuario'
      if (error instanceof Error) {
        errorMsg = error.message
      }
      set({ error: errorMsg, isLoading: false })
      return false
    }
  },

  setUser: (user) => {
    const role = getRole(user)
    set({
      user,
      isAuthenticated: !!user,
      isAdmin: role === 'admin',
      isOperator: role === 'admin' || role === 'operator',
      isUser: role !== 'guest',
      isGuest: role === 'guest',
      userRole: role,
    })
  },

  clearError: () => {
    set({ error: null })
  },

  handleOAuthCallback: (token, refreshToken, user) => {
    const storage = getStorage()
    Promise.resolve(storage.setItem(STORAGE_KEYS.TOKEN, token))
    if (refreshToken) {
      Promise.resolve(storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken))
    }
    Promise.resolve(storage.setItem(STORAGE_KEYS.USER, JSON.stringify(user)))

    const role = getRole(user)
    set({
      user,
      token,
      isAuthenticated: true,
      isAdmin: role === 'admin',
      isOperator: role === 'admin' || role === 'operator',
      isUser: role !== 'guest',
      isGuest: role === 'guest',
      userRole: role,
      isLoading: false,
      error: null,
    })
  },

  forgotPassword: async (email) => {
    set({ isLoading: true, error: null })
    try {
      const response = await forgotPasswordService(email)
      set({ isLoading: false })
      return { success: true, message: response.message }
    } catch (error) {
      let message = 'Error al solicitar restablecimiento de contraseña'
      if (error instanceof Error) {
        message = error.message
      }
      set({ error: message, isLoading: false })
      return { success: false, message }
    }
  },

  resetPassword: async (token, password) => {
    set({ isLoading: true, error: null })
    try {
      const response = await resetPasswordService(token, password)
      set({ isLoading: false })
      return { success: true, message: response.message }
    } catch (error) {
      let message = 'Error al restablecer la contraseña'
      if (error instanceof Error) {
        message = error.message
      }
      set({ error: message, isLoading: false })
      return { success: false, message }
    }
  },

  restoreSession: async () => {
    try {
      const storage = getStorage()
      const token = await Promise.resolve(storage.getItem(STORAGE_KEYS.TOKEN))
      const userJson = await Promise.resolve(storage.getItem(STORAGE_KEYS.USER))

      if (token && userJson) {
        const user = JSON.parse(userJson) as User
        const role = getRole(user)
        set({
          user,
          token,
          isAuthenticated: true,
          isAdmin: role === 'admin',
          isOperator: role === 'admin' || role === 'operator',
          isUser: role !== 'guest',
          isGuest: role === 'guest',
          userRole: role,
        })
      }
    } catch {
      const storage = getStorage()
      await Promise.resolve(storage.removeItem(STORAGE_KEYS.TOKEN))
      await Promise.resolve(storage.removeItem(STORAGE_KEYS.REFRESH_TOKEN))
      await Promise.resolve(storage.removeItem(STORAGE_KEYS.USER))
    }
  },

  // ── 2FA Actions ──

  complete2FALogin: (user, token, refreshToken) => {
    const storage = getStorage()
    Promise.resolve(storage.setItem(STORAGE_KEYS.TOKEN, token))
    if (refreshToken) {
      Promise.resolve(storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken))
    }
    Promise.resolve(storage.setItem(STORAGE_KEYS.USER, JSON.stringify(user)))

    const role = getRole(user)
    set({
      user,
      token,
      isAuthenticated: true,
      isAdmin: role === 'admin',
      isOperator: role === 'admin' || role === 'operator',
      isUser: role !== 'guest',
      isGuest: role === 'guest',
      userRole: role,
      isLoading: false,
      error: null,
      requiresTwoFactor: false,
      tempToken: null,
    })
  },

  clearTwoFactorState: () => {
    set({
      requiresTwoFactor: false,
      tempToken: null,
    })
  },

  setTwoFactorTempToken: (tempToken) => {
    set({ tempToken })
  },

  hasRole: (targetRole) => {
    const role = getRole(get().user)
    return (ROLE_HIERARCHY[role] || 0) >= (ROLE_HIERARCHY[targetRole] || 0)
  },

  // ── Session Actions ──

  fetchSessions: async () => {
    set({ sessionsLoading: true })
    try {
      const sessions = await getSessionsService()
      set({ sessions, sessionsLoading: false })
    } catch (error) {
      set({ sessionsLoading: false })
      console.warn('[session] Failed to fetch sessions:', error)
    }
  },

  revokeSession: async (sessionId) => {
    try {
      await revokeSessionService(sessionId)
      set((state) => ({
        sessions: state.sessions.filter((s) => s.id !== sessionId),
      }))
      return true
    } catch {
      return false
    }
  },

  revokeAllOtherSessions: async () => {
    try {
      const result = await revokeAllSessionsService()
      const sessions = await getSessionsService()
      set({ sessions })
      return true
    } catch {
      return false
    }
  },
}))
