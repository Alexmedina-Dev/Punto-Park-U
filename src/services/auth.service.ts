import api from './api'
import type { AuthResponse, LoginCredentials, RegisterData, User } from '@/types'
import { STORAGE_KEYS } from '@/utils/constants'

/**
 * Backend auth responses come in two possible shapes:
 * 1. { user, token, accessToken, refreshToken } — direct response
 * 2. { success: true, data: { user, token, accessToken, refreshToken } } — wrapped in ApiResponse
 *
 * This helper normalizes both formats.
 */
function normalizeAuthResponse(response: unknown): AuthResponse {
  // Handle wrapped ApiResponse format
  if (response && typeof response === 'object' && 'success' in response && (response as Record<string, unknown>).success) {
    const wrapped = response as Record<string, unknown>
    if (wrapped.data) {
      return normalizeAuthResponse(wrapped.data)
    }
  }

  const resp = response as Record<string, unknown>

  const user = resp.user as AuthResponse['user']
  const token = (resp.token as string) || (resp.accessToken as string) || ''
  const accessToken = resp.accessToken as string | undefined
  const refreshToken = resp.refreshToken as string | undefined

  return { user, token, accessToken, refreshToken }
}

/**
 * Authenticate user with username and password.
 * Backend accepts username (or email) + password.
 */
export async function loginService(credentials: LoginCredentials): Promise<AuthResponse> {
  const { data } = await api.post('/auth/login', {
    username: credentials.username,
    password: credentials.password,
  })

  const result = normalizeAuthResponse(data)

  // Store tokens
  if (result.token) {
    localStorage.setItem(STORAGE_KEYS.TOKEN, result.token)
  }
  if (result.refreshToken) {
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, result.refreshToken)
  }
  if (result.user) {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(result.user))
  }

  return result
}

/**
 * Register a new user account.
 * Sends data in frontend format — backend handles mapping.
 */
export async function registerService(registerData: RegisterData): Promise<{ user: User; token?: string; accessToken?: string; refreshToken?: string }> {
  const { data } = await api.post('/auth/register', {
    nombres: registerData.nombres,
    apellidos: registerData.apellidos,
    cedula: registerData.cedula,
    username: registerData.username,
    password: registerData.password,
    email: registerData.email,
  })

  // Handle both { success, data } and direct { user } response
  let responseData = data as Record<string, unknown>

  if (responseData.success && responseData.data) {
    responseData = responseData.data as Record<string, unknown>
  }

  // Store tokens if returned
  const token = (responseData.token as string) || (responseData.accessToken as string)
  const refreshToken = responseData.refreshToken as string | undefined
  if (token) {
    localStorage.setItem(STORAGE_KEYS.TOKEN, token)
  }
  if (refreshToken) {
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken)
  }

  return {
    user: responseData.user as User,
    token: responseData.token as string | undefined,
    accessToken: responseData.accessToken as string | undefined,
    refreshToken: responseData.refreshToken as string | undefined,
  }
}

/**
 * Logout the current user (invalidate token on server).
 */
export async function logoutService(): Promise<void> {
  try {
    await api.post('/auth/logout')
  } catch {
    // Logout is best-effort — always clear local state
  } finally {
    localStorage.removeItem(STORAGE_KEYS.TOKEN)
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.USER)
  }
}

/**
 * Refresh the JWT token.
 */
export async function refreshTokenService(token: string): Promise<AuthResponse> {
  const { data } = await api.post('/auth/refresh', { refreshToken: token })
  const result = normalizeAuthResponse(data)
  return result
}

/**
 * Request a password reset email (simulated — logs token to console).
 */
export async function forgotPasswordService(email: string): Promise<{ message: string }> {
  const { data } = await api.post('/auth/forgot-password', { email })
  const resp = data as Record<string, unknown>
  return { message: (resp.message as string) || 'If an account with that email exists, a reset link has been sent.' }
}

/**
 * Reset password using a reset token.
 */
export async function resetPasswordService(token: string, password: string): Promise<{ message: string }> {
  const { data } = await api.post('/auth/reset-password', { token, password })
  const resp = data as Record<string, unknown>
  return { message: (resp.message as string) || 'Password has been reset successfully' }
}

/**
 * Send a verification email (mock — logs token to console).
 */
export async function sendVerificationService(email: string): Promise<{ message: string }> {
  const { data } = await api.post('/auth/verify/send', { email })
  const resp = data as Record<string, unknown>
  return { message: (resp.message as string) || 'Verification email sent.' }
}

/**
 * Verify email using a token.
 */
export async function verifyEmailService(token: string): Promise<{ message: string }> {
  const { data } = await api.get(`/auth/verify/${token}`)
  const resp = data as Record<string, unknown>
  return { message: (resp.message as string) || 'Email verified successfully.' }
}

/**
 * Resend verification email (mock — logs token to console).
 */
export async function resendVerificationService(email: string): Promise<{ message: string }> {
  const { data } = await api.post('/auth/verify/resend', { email })
  const resp = data as Record<string, unknown>
  return { message: (resp.message as string) || 'Verification email resent.' }
}

/**
 * Get the currently authenticated user's profile.
 */
export async function getProfileService(): Promise<User> {
  const { data } = await api.get('/auth/me')

  // Backend returns { success: true, data: userObject }
  const resp = data as Record<string, unknown>
  if (resp.success && resp.data) {
    return resp.data as User
  }

  // Fallback for direct response { user: ... }
  if (resp.user && typeof resp.user === 'object') {
    return resp.user as User
  }

  // If the response IS the user object
  return resp as unknown as User
}
