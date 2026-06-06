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
 * Returns the raw response so callers can detect 2FA challenge.
 */
export async function loginService(
  credentials: LoginCredentials
): Promise<AuthResponse | { user: User; requiresTwoFactor: true; tempToken: string }> {
  const { data } = await api.post('/auth/login', {
    username: credentials.username,
    password: credentials.password,
  })

  // Check for 2FA challenge response
  const raw = data as Record<string, unknown>
  if (raw.requiresTwoFactor && raw.tempToken) {
    return {
      user: raw.user as User,
      requiresTwoFactor: true as const,
      tempToken: raw.tempToken as string,
    }
  }

  const result = normalizeAuthResponse(data)

  // Store tokens for normal login
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

// ── 2FA Services ─────────────────────────────────────────────────────

/**
 * Get 2FA status for the current user.
 */
export async function get2FAStatusService(): Promise<import('@/types').TwoFactorStatus> {
  const { data } = await api.get('/auth/2fa/status')
  const resp = data as Record<string, unknown>
  if (resp.success && resp.data) {
    return resp.data as import('@/types').TwoFactorStatus
  }
  throw new Error('Failed to get 2FA status')
}

/**
 * Setup 2FA: generate secret and QR code.
 */
export async function setup2FAService(): Promise<import('@/types').TwoFactorSetupData> {
  const { data } = await api.post('/auth/2fa/setup')
  const resp = data as Record<string, unknown>
  if (resp.success && resp.data) {
    return resp.data as import('@/types').TwoFactorSetupData
  }
  throw new Error('Failed to setup 2FA')
}

/**
 * Verify 2FA setup: confirm TOTP code to enable 2FA.
 */
export async function verifySetup2FAService(token: string): Promise<import('@/types').TwoFactorVerifySetupResponse> {
  const { data } = await api.post('/auth/2fa/verify-setup', { token })
  const resp = data as Record<string, unknown>
  if (resp.success && resp.data) {
    return resp.data as import('@/types').TwoFactorVerifySetupResponse
  }
  throw new Error('Failed to verify 2FA setup')
}

/**
 * Verify 2FA code during login challenge.
 */
export async function verify2FAService(tempToken: string, token: string): Promise<import('@/types').TwoFactorVerifyResponse> {
  const { data } = await api.post('/auth/2fa/verify', { tempToken, token })
  const resp = data as Record<string, unknown>
  if (resp.success && resp.data) {
    const result = resp.data as import('@/types').TwoFactorVerifyResponse
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
  throw new Error('Failed to verify 2FA code')
}

/**
 * Verify a backup code during login challenge.
 */
export async function verifyBackupCodeService(tempToken: string, backupCode: string): Promise<import('@/types').TwoFactorVerifyResponse> {
  const { data } = await api.post('/auth/2fa/verify-backup', { tempToken, backupCode })
  const resp = data as Record<string, unknown>
  if (resp.success && resp.data) {
    const result = resp.data as import('@/types').TwoFactorVerifyResponse
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
  throw new Error('Invalid backup code')
}

/**
 * Disable 2FA (requires password).
 */
export async function disable2FAService(password: string): Promise<void> {
  const { data } = await api.post('/auth/2fa/disable', { password })
  const resp = data as Record<string, unknown>
  if (!resp.success) {
    throw new Error((resp.error as string) || 'Failed to disable 2FA')
  }
}

/**
 * Generate new backup codes.
 */
export async function generateBackupCodesService(): Promise<import('@/types').TwoFactorBackupCodesResponse> {
  const { data } = await api.post('/auth/2fa/backup-codes')
  const resp = data as Record<string, unknown>
  if (resp.success && resp.data) {
    return resp.data as import('@/types').TwoFactorBackupCodesResponse
  }
  throw new Error('Failed to generate backup codes')
}

// ── Session Services ──────────────────────────────────────────────────

/**
 * Get all active sessions for the current user.
 */
export async function getSessionsService(): Promise<import('@/types').SessionData[]> {
  const { data } = await api.get('/sessions')
  const resp = data as Record<string, unknown>
  if (resp.success && Array.isArray(resp.data)) {
    return resp.data as import('@/types').SessionData[]
  }
  if (Array.isArray(resp.data)) {
    return resp.data as import('@/types').SessionData[]
  }
  return []
}

/**
 * Revoke a specific session by ID.
 */
export async function revokeSessionService(sessionId: string): Promise<void> {
  await api.delete(`/sessions/${sessionId}`)
}

/**
 * Revoke all sessions except the current one.
 */
export async function revokeAllSessionsService(): Promise<{ modifiedCount: number }> {
  const { data } = await api.delete('/sessions')
  const resp = data as Record<string, unknown>
  return { modifiedCount: (resp.modifiedCount as number) || 0 }
}

/**
 * Send activity heartbeat for the current session.
 */
export async function sendActivityHeartbeatService(): Promise<void> {
  await api.post('/sessions/activity')
}

/**
 * Get session stats (admin only).
 */
export async function getSessionStatsService(): Promise<import('@/types').SessionStats> {
  const { data } = await api.get('/sessions/stats')
  const resp = data as Record<string, unknown>
  if (resp.success && resp.data) {
    return resp.data as import('@/types').SessionStats
  }
  throw new Error('Failed to get session stats')
}
