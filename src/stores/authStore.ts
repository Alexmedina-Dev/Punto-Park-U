import { create } from 'zustand'
import type { User, LoginCredentials, RegisterData } from '@/types'
import { loginService, registerService, logoutService } from '@/services/auth.service'
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

  // Actions
  login: (credentials: LoginCredentials) => Promise<boolean>
  logout: () => void
  register: (data: RegisterData) => Promise<boolean>
  setUser: (user: User | null) => void
  clearError: () => void
  restoreSession: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isAdmin: false,
  token: null,
  isLoading: false,
  error: null,

  login: async (credentials) => {
    set({ isLoading: true, error: null })
    try {
      const response = await withRetry(() => loginService(credentials))
      const { user, token } = response

      // Persist to localStorage
      localStorage.setItem(STORAGE_KEYS.TOKEN, token)
      if (response.refreshToken) {
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.refreshToken)
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

      set({ error: errorMsg, isLoading: false })
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
      await withRetry(() => registerService(data))
      set({ isLoading: false, error: null })
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
}))
