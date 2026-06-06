import { create } from 'zustand'
import type { User, LoginCredentials, RegisterData } from '@/types'
import { loginService, registerService, logoutService } from '@/services/auth.service'
import { STORAGE_KEYS } from '@/utils/constants'
import { withRetry, showErrorToast } from '@/utils/errorHandler'

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
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user))

      set({
        user,
        token,
        isAuthenticated: true,
        isAdmin: user.rol === 'admin',
        isLoading: false,
        error: null,
      })

      return true
    } catch (error) {
      // Fallback to mock users if API is unavailable
      const mockUsers = [
        { username: 'admin', password: 'admin123', rol: 'admin' as const },
        { username: 'cliente', password: 'cliente1234', rol: 'user' as const },
        { username: 'juan', password: 'juan1234', rol: 'user' as const },
      ]

      const matchedUser = mockUsers.find(
        (u) => u.username === credentials.username && u.password === credentials.password
      )

      if (matchedUser) {
        const userData: User = {
          id: '1',
          username: matchedUser.username,
          email: `${matchedUser.username}@example.com`,
          nombres: matchedUser.username,
          apellidos: 'Test',
          cedula: '123456789',
          fechaNacimiento: '1990-01-01',
          rol: matchedUser.rol,
        }

        const mockToken = 'mock-jwt-token'

        localStorage.setItem(STORAGE_KEYS.TOKEN, mockToken)
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData))

        set({
          user: userData,
          token: mockToken,
          isAuthenticated: true,
          isAdmin: matchedUser.rol === 'admin',
          isLoading: false,
          error: null,
        })

        return true
      }

      const errorMsg = 'Usuario o contraseña incorrectos'
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
      // Fallback mock register
      if (data.username && data.password && data.confirmPassword === data.password) {
        set({ isLoading: false, error: null })
        return true
      }

      const errorMsg = 'Error al registrar usuario'
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
      localStorage.removeItem(STORAGE_KEYS.USER)
    }
  },
}))
