import api from './api'
import type { ApiResponse, AuthResponse, LoginCredentials, RegisterData, User } from '@/types'

/**
 * Authenticate user with username and password.
 */
export async function loginService(credentials: LoginCredentials): Promise<AuthResponse> {
  const { data } = await api.post<ApiResponse<AuthResponse>>('/auth/login', credentials)
  if (!data.success) {
    throw new Error(data.message || 'Error al iniciar sesión')
  }
  return data.data
}

/**
 * Register a new user account.
 */
export async function registerService(registerData: RegisterData): Promise<{ user: User }> {
  const { data } = await api.post<ApiResponse<{ user: User }>>('/auth/register', registerData)
  if (!data.success) {
    throw new Error(data.message || 'Error al registrar usuario')
  }
  return data.data
}

/**
 * Logout the current user (invalidate token on server).
 */
export async function logoutService(): Promise<void> {
  try {
    await api.post('/auth/logout')
  } catch {
    // Logout is best-effort — always clear local state
  }
}

/**
 * Refresh the JWT token.
 */
export async function refreshTokenService(token: string): Promise<AuthResponse> {
  const { data } = await api.post<ApiResponse<AuthResponse>>('/auth/refresh', { token })
  if (!data.success) {
    throw new Error(data.message || 'Error al renovar sesión')
  }
  return data.data
}

/**
 * Get the currently authenticated user's profile.
 */
export async function getProfileService(): Promise<User> {
  const { data } = await api.get<ApiResponse<User>>('/auth/profile')
  if (!data.success) {
    throw new Error(data.message || 'Error al obtener perfil')
  }
  return data.data
}
