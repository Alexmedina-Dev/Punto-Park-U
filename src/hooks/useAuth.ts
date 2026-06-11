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
      const result = await store.login({ username, password })

      // If result is an object with requiresTwoFactor, it's a 2FA challenge
      if (result && typeof result === 'object' && 'requiresTwoFactor' in result) {
        navigate('/2fa/verify')
        return result
      }

      if (result) {
        showSuccessToast('¡Bienvenido!')
        // Read fresh state directly from store (closure snapshot is stale after login)
        const freshState = useAuthStore.getState()
        const isAdmin = freshState.isAdmin || freshState.userRole === 'admin'
        navigate(isAdmin ? ROUTES.ADMIN : ROUTES.DASHBOARD)
      }
      return result
    },
    [store, navigate]
  )

  const adminLogin = useCallback(
    async (username: string, password: string) => {
      const result = await store.adminLogin({ username, password })
      if (result) {
        showSuccessToast('¡Bienvenido, Admin!')
        navigate(ROUTES.ADMIN)
      }
      return result
    },
    [store, navigate]
  )

  const register = useCallback(
    async (data: {
      nombres: string
      apellidos: string
      cedula: string
      fechaNacimiento: string
      email: string
      username: string
      password: string
      confirmPassword: string
    }) => {
      const result = await store.register(data)
      if (result) {
        // Check if registration returned needsVerification (strict mode)
        const needsVerification = typeof result === 'object' && 'needsVerification' in result
        if (!needsVerification) {
          showSuccessToast('¡Registro exitoso!')
          navigate(ROUTES.DASHBOARD)
        }
      }
      return result as boolean | { needsVerification: boolean; email: string }
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
    requiresTwoFactor: store.requiresTwoFactor,
    tempToken: store.tempToken,
    login,
    adminLogin,
    register,
    logout,
    clearError: store.clearError,
    complete2FALogin: store.complete2FALogin,
    clearTwoFactorState: store.clearTwoFactorState,
  }
}
