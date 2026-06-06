import { create } from 'zustand'
import type { User, LoginCredentials, RegisterData, AuthResponse, LoginResponse2FA } from '@/types'
import {
  loginService,
  registerService,
  logoutService,
  forgotPasswordService,
  resetPasswordService,
  verify2FAService,
  verifyBackupCodeService,
} from '@/services/auth.service'
import { STORAGE_KEYS } from '@/utils/constants'
import { withRetry, showErrorToast } from '@/utils/errorHandler'
import axios from 'axios'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isAdmin: boolean
  token: string | null
  isLoading: boolean
  error: string | null

  // 2FA state
  requiresTwoFactor: boolean
  tempToken: string | null

  // Actions
  login: (credentials: LoginCredentials) => Promise<boolean | LoginResponse2FA>
  logout: () => void
  register: (data: RegisterData) => Promise<boolean | { needsVerification: boolean; email: string }>
  setUser: (user: User | null) => void
  clearError: () => void
  restoreSession: () => void
  handleOAuthCallback: (token: string, refreshToken: string, user: User) => void
  forgotPassword: (email: string) => Promise<{ success: boolean; message: string }>
  resetPassword: (token: string, password: string) => Promise<{ success: boolean; message: string }>

  // 2FA Actions
  complete2FALogin: (user: User, token: string, refreshToken: string) => void
  clearTwoFactorState: () => void
  setTwoFactorTempToken: (tempToken: string) => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isAdmin: false,
  token: null,
  isLoading: false,
  error: null,
  requiresTwoFactor: false,
  tempToken: null,

  login: async (credentials) => {
    set({ isLoading: true, error: null, requiresTwoFactor: false, tempToken: null })
    try {
      const response = await withRetry(() => loginService(credentials))

      // Check if 2FA is required
      const twoFactorResponse = response as LoginResponse2FA
      if (twoFactorResponse.requiresTwoFactor && twoFactorResponse.tempToken) {
        // Store tempToken, do NOT authenticate fully
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

      // Persist to localStorage
      if (token) {
        localStorage.setItem(STORAGE_KEYS.TOKEN, token)
      }
      if (authResponse.refreshToken) {
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, authResponse.refreshToken)
      }
      if (user) {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user))
      }

      set({
        user,
        token: token || null,
        isAuthenticated: true,
        isAdmin: user?.rol === 'admin',
        isLoading: false,
        error: null,
        requiresTwoFactor: false,
        tempToken: null,
      })

      return true
    } catch (error) {
      let errorMsg = 'Usuario o contraseña incorrectos'

      if (axios.isAxiosError(error)) {
        const serverError = error.response?.data?.error
        if (serverError) {
          errorMsg = serverError
        }
        // Network errors
        if (!error.response) {
          errorMsg = 'Error de conexión. Verifica tu conexión a internet.'
        }
      } else if (error instanceof Error) {
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

    localStorage.removeItem(STORAGE_KEYS.TOKEN)
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.USER)

    set({
      user: null,
      isAuthenticated: false,
      isAdmin: false,
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

      if (token) {
        localStorage.setItem(STORAGE_KEYS.TOKEN, token)
      }
      if (refreshToken) {
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken)
      }
      if (user) {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user))
      }

      set({
        user,
        token,
        isAuthenticated: true,
        isAdmin: user?.rol === 'admin',
        isLoading: false,
        error: null,
      })

      return true
    } catch (error) {
      let errorMsg = 'Error al registrar usuario'

      if (axios.isAxiosError(error)) {
        const serverError = error.response?.data?.error
        if (serverError) {
          errorMsg = serverError
        }
        if (!error.response) {
          errorMsg = 'Error de conexión. Verifica tu conexión a internet.'
        }
      } else if (error instanceof Error) {
        errorMsg = error.message
      }

      set({ error: errorMsg, isLoading: false })
      return false
    }
  },

  setUser: (user) => {
    set({
      user,
      isAuthenticated: !!user,
      isAdmin: user?.rol === 'admin',
    })
  },

  clearError: () => {
    set({ error: null })
  },

  handleOAuthCallback: (token, refreshToken, user) => {
    // Persist to localStorage
    localStorage.setItem(STORAGE_KEYS.TOKEN, token)
    if (refreshToken) {
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken)
    }
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user))

    set({
      user,
      token,
      isAuthenticated: true,
      isAdmin: user.rol === 'admin',
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

      if (axios.isAxiosError(error)) {
        const serverError = error.response?.data?.error
        if (serverError) {
          message = serverError
        }
        if (!error.response) {
          message = 'Error de conexión. Verifica tu conexión a internet.'
        }
      } else if (error instanceof Error) {
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

      if (axios.isAxiosError(error)) {
        const serverError = error.response?.data?.error
        if (serverError) {
          message = serverError
        }
        if (!error.response) {
          message = 'Error de conexión. Verifica tu conexión a internet.'
        }
      } else if (error instanceof Error) {
        message = error.message
      }

      set({ error: message, isLoading: false })
      return { success: false, message }
    }
  },

  restoreSession: () => {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
      const userJson = localStorage.getItem(STORAGE_KEYS.USER)

      if (token && userJson) {
        const user = JSON.parse(userJson) as User
        set({
          user,
          token,
          isAuthenticated: true,
          isAdmin: user.rol === 'admin',
        })
      }
    } catch {
      localStorage.removeItem(STORAGE_KEYS.TOKEN)
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
      localStorage.removeItem(STORAGE_KEYS.USER)
    }
  },

  // ── 2FA Actions ─────────────────────────────────────────────────

  complete2FALogin: (user, token, refreshToken) => {
    localStorage.setItem(STORAGE_KEYS.TOKEN, token)
    if (refreshToken) {
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken)
    }
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user))

    set({
      user,
      token,
      isAuthenticated: true,
      isAdmin: user.rol === 'admin',
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
}))
