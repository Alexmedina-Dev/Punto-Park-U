import { create } from 'zustand'

interface AuthState {
  user: any | null
  isAuthenticated: boolean
  isAdmin: boolean
  token: string | null
  isLoading: boolean
  error: string | null

  // Actions
  login: (credentials: { username: string; password: string }) => Promise<boolean>
  logout: () => void
  register: (data: any) => Promise<boolean>
  setUser: (user: any) => void
  clearError: () => void
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
      // Mock login for now - will be replaced with API call
      const mockUsers = [
        { username: 'admin', password: 'admin123', rol: 'admin' },
        { username: 'cliente', password: 'cliente1234', rol: 'user' },
        { username: 'juan', password: 'juan1234', rol: 'user' },
      ]

      const user = mockUsers.find(
        (u) => u.username === credentials.username && u.password === credentials.password
      )

      if (!user) {
        set({ error: 'Usuario o contraseña incorrectos', isLoading: false })
        return false
      }

      const userData = {
        id: '1',
        username: user.username,
        email: `${user.username}@example.com`,
        nombres: user.username,
        apellidos: 'Test',
        cedula: '123456789',
        fechaNacimiento: '1990-01-01',
        rol: user.rol as 'user' | 'admin',
      }

      set({
        user: userData,
        isAuthenticated: true,
        isAdmin: user.rol === 'admin',
        token: 'mock-jwt-token',
        isLoading: false,
      })

      return true
    } catch (error) {
      set({ error: 'Error al iniciar sesión', isLoading: false })
      return false
    }
  },

  logout: () => {
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
      // Mock register - will be replaced with API call
      set({ isLoading: false })
      return true
    } catch (error) {
      set({ error: 'Error al registrar usuario', isLoading: false })
      return false
    }
  },

  setUser: (user) => {
    set({ user, isAuthenticated: !!user, isAdmin: user?.rol === 'admin' })
  },

  clearError: () => {
    set({ error: null })
  },
}))
