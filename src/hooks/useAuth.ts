import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { showErrorToast, showSuccessToast } from '@/utils/errorHandler'
import { ROUTES } from '@/utils/constants'

/**
 * Hook for authentication operations.
 * Provides login, register, logout, and session status.
 */
export function useAuth() {
  const navigate = useNavigate()
  const store = useAuthStore()

  const login = useCallback(
    async (username: string, password: string) => {
      const success = await store.login({ username, password })
      if (success) {
        showSuccessToast('¡Bienvenido!')
        navigate(ROUTES.DASHBOARD)
      }
      return success
    },
    [store, navigate]
  )

  const register = useCallback(
    async (data: {
      nombres: string
      apellidos: string
      cedula: string
      fechaNacimiento: string
      username: string
      password: string
      confirmPassword: string
    }) => {
      const success = await store.register(data)
      if (success) {
        showSuccessToast('¡Registro exitoso!')
        navigate(ROUTES.LOGIN)
      }
      return success
    },
    [store, navigate]
  )

  const logout = useCallback(() => {
    store.logout()
    showSuccessToast('Sesión cerrada correctamente')
    navigate(ROUTES.HOME)
  }, [store, navigate])

  return {
    user: store.user,
    isAuthenticated: store.isAuthenticated,
    isAdmin: store.isAdmin,
    isLoading: store.isLoading,
    error: store.error,
    login,
    register,
    logout,
    clearError: store.clearError,
  }
}
