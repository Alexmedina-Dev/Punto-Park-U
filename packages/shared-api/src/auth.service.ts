import { getApiClient } from './api.js'
import type {
  AuthResponse,
  LoginCredentials,
  RegisterData,
  User,
  TwoFactorStatus,
  TwoFactorSetupData,
  TwoFactorVerifySetupResponse,
  TwoFactorVerifyResponse,
  TwoFactorBackupCodesResponse,
  LoginResponse2FA,
  SessionData,
  SessionStats,
  PaginatedResponse,
  UserRole,
  User as UserType,
} from '@punto-park-u/shared-types'

/**
 * Normalize auth responses that may come as direct or wrapped in ApiResponse.
 */
function normalizeAuthResponse(response: unknown): AuthResponse {
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

export async function loginService(
  credentials: LoginCredentials
): Promise<AuthResponse | { user: User; requiresTwoFactor: true; tempToken: string }> {
  const api = getApiClient()
  const { data } = await api.post('/auth/login', {
    username: credentials.username,
    password: credentials.password,
  })

  const raw = data as Record<string, unknown>
  if (raw.requiresTwoFactor && raw.tempToken) {
    return {
      user: raw.user as User,
      requiresTwoFactor: true as const,
      tempToken: raw.tempToken as string,
    }
  }

  return normalizeAuthResponse(data)
}

export async function registerService(
  registerData: RegisterData
): Promise<{ user: User; token?: string; accessToken?: string; refreshToken?: string }> {
  const api = getApiClient()
  const { data } = await api.post('/auth/register', {
    nombres: registerData.nombres,
    apellidos: registerData.apellidos,
    cedula: registerData.cedula,
    username: registerData.username,
    password: registerData.password,
    email: registerData.email,
  })

  let responseData = data as Record<string, unknown>
  if (responseData.success && responseData.data) {
    responseData = responseData.data as Record<string, unknown>
  }

  return {
    user: responseData.user as User,
    token: responseData.token as string | undefined,
    accessToken: responseData.accessToken as string | undefined,
    refreshToken: responseData.refreshToken as string | undefined,
  }
}

export async function logoutService(): Promise<void> {
  try {
    const api = getApiClient()
    await api.post('/auth/logout')
  } catch {
    // Logout is best-effort
  }
}

export async function refreshTokenService(token: string): Promise<AuthResponse> {
  const api = getApiClient()
  const { data } = await api.post('/auth/refresh', { refreshToken: token })
  return normalizeAuthResponse(data)
}

export async function forgotPasswordService(email: string): Promise<{ message: string }> {
  const api = getApiClient()
  const { data } = await api.post('/auth/forgot-password', { email })
  const resp = data as Record<string, unknown>
  return { message: (resp.message as string) || 'If an account with that email exists, a reset link has been sent.' }
}

export async function resetPasswordService(token: string, password: string): Promise<{ message: string }> {
  const api = getApiClient()
  const { data } = await api.post('/auth/reset-password', { token, password })
  const resp = data as Record<string, unknown>
  return { message: (resp.message as string) || 'Password has been reset successfully' }
}

export async function sendVerificationService(email: string): Promise<{ message: string }> {
  const api = getApiClient()
  const { data } = await api.post('/auth/verify/send', { email })
  const resp = data as Record<string, unknown>
  return { message: (resp.message as string) || 'Verification email sent.' }
}

export async function verifyEmailService(token: string): Promise<{ message: string }> {
  const api = getApiClient()
  const { data } = await api.get(`/auth/verify/${token}`)
  const resp = data as Record<string, unknown>
  return { message: (resp.message as string) || 'Email verified successfully.' }
}

export async function resendVerificationService(email: string): Promise<{ message: string }> {
  const api = getApiClient()
  const { data } = await api.post('/auth/verify/resend', { email })
  const resp = data as Record<string, unknown>
  return { message: (resp.message as string) || 'Verification email resent.' }
}

export async function getProfileService(): Promise<User> {
  const api = getApiClient()
  const { data } = await api.get('/auth/me')
  const resp = data as Record<string, unknown>
  if (resp.success && resp.data) {
    return resp.data as User
  }
  if (resp.user && typeof resp.user === 'object') {
    return resp.user as User
  }
  return resp as unknown as User
}

// ── 2FA Services ──

export async function get2FAStatusService(): Promise<TwoFactorStatus> {
  const api = getApiClient()
  const { data } = await api.get('/auth/2fa/status')
  const resp = data as Record<string, unknown>
  if (resp.success && resp.data) {
    return resp.data as TwoFactorStatus
  }
  throw new Error('Failed to get 2FA status')
}

export async function setup2FAService(): Promise<TwoFactorSetupData> {
  const api = getApiClient()
  const { data } = await api.post('/auth/2fa/setup')
  const resp = data as Record<string, unknown>
  if (resp.success && resp.data) {
    return resp.data as TwoFactorSetupData
  }
  throw new Error('Failed to setup 2FA')
}

export async function verifySetup2FAService(token: string): Promise<TwoFactorVerifySetupResponse> {
  const api = getApiClient()
  const { data } = await api.post('/auth/2fa/verify-setup', { token })
  const resp = data as Record<string, unknown>
  if (resp.success && resp.data) {
    return resp.data as TwoFactorVerifySetupResponse
  }
  throw new Error('Failed to verify 2FA setup')
}

export async function verify2FAService(tempToken: string, token: string): Promise<TwoFactorVerifyResponse> {
  const api = getApiClient()
  const { data } = await api.post('/auth/2fa/verify', { tempToken, token })
  const resp = data as Record<string, unknown>
  if (resp.success && resp.data) {
    return resp.data as TwoFactorVerifyResponse
  }
  throw new Error('Failed to verify 2FA code')
}

export async function verifyBackupCodeService(tempToken: string, backupCode: string): Promise<TwoFactorVerifyResponse> {
  const api = getApiClient()
  const { data } = await api.post('/auth/2fa/verify-backup', { tempToken, backupCode })
  const resp = data as Record<string, unknown>
  if (resp.success && resp.data) {
    return resp.data as TwoFactorVerifyResponse
  }
  throw new Error('Invalid backup code')
}

export async function disable2FAService(password: string): Promise<void> {
  const api = getApiClient()
  const { data } = await api.post('/auth/2fa/disable', { password })
  const resp = data as Record<string, unknown>
  if (!resp.success) {
    throw new Error((resp.error as string) || 'Failed to disable 2FA')
  }
}

export async function generateBackupCodesService(): Promise<TwoFactorBackupCodesResponse> {
  const api = getApiClient()
  const { data } = await api.post('/auth/2fa/backup-codes')
  const resp = data as Record<string, unknown>
  if (resp.success && resp.data) {
    return resp.data as TwoFactorBackupCodesResponse
  }
  throw new Error('Failed to generate backup codes')
}

// ── Session Services ──

export async function getSessionsService(): Promise<SessionData[]> {
  const api = getApiClient()
  const { data } = await api.get('/sessions')
  const resp = data as Record<string, unknown>
  if (resp.success && Array.isArray(resp.data)) {
    return resp.data as SessionData[]
  }
  if (Array.isArray(resp.data)) {
    return resp.data as SessionData[]
  }
  return []
}

export async function revokeSessionService(sessionId: string): Promise<void> {
  const api = getApiClient()
  await api.delete(`/sessions/${sessionId}`)
}

export async function revokeAllSessionsService(): Promise<{ modifiedCount: number }> {
  const api = getApiClient()
  const { data } = await api.delete('/sessions')
  const resp = data as Record<string, unknown>
  return { modifiedCount: (resp.modifiedCount as number) || 0 }
}

export async function sendActivityHeartbeatService(): Promise<void> {
  const api = getApiClient()
  await api.post('/sessions/activity')
}

export async function getSessionStatsService(): Promise<SessionStats> {
  const api = getApiClient()
  const { data } = await api.get('/sessions/stats')
  const resp = data as Record<string, unknown>
  if (resp.success && resp.data) {
    return resp.data as SessionStats
  }
  throw new Error('Failed to get session stats')
}

// ── User Management Services ──

export async function getUsersService(params?: {
  role?: string
  search?: string
  page?: number
  limit?: number
}): Promise<PaginatedResponse<UserType>> {
  const api = getApiClient()
  const { data } = await api.get('/users', { params })
  return data as PaginatedResponse<UserType>
}

export async function getUserService(id: string): Promise<UserType> {
  const api = getApiClient()
  const { data } = await api.get(`/users/${id}`)
  const resp = data as Record<string, unknown>
  if (resp.success && resp.data) {
    return resp.data as UserType
  }
  throw new Error('Failed to get user')
}

export async function updateUserService(id: string, updates: Record<string, unknown>): Promise<UserType> {
  const api = getApiClient()
  const { data } = await api.put(`/users/${id}`, updates)
  const resp = data as Record<string, unknown>
  if (resp.success && resp.data) {
    return resp.data as UserType
  }
  throw new Error('Failed to update user')
}

export async function updateUserRoleService(id: string, role: UserRole): Promise<{ id: string; role: UserRole }> {
  const api = getApiClient()
  const { data } = await api.put(`/users/${id}/role`, { role })
  const resp = data as Record<string, unknown>
  if (resp.success && resp.data) {
    return resp.data as { id: string; role: UserRole }
  }
  throw new Error('Failed to update role')
}

export async function deleteUserService(id: string): Promise<void> {
  const api = getApiClient()
  await api.delete(`/users/${id}`)
}

export async function getUserStatsService(): Promise<{ admin: number; operator: number; user: number; guest: number; total: number }> {
  const api = getApiClient()
  const { data } = await api.get('/users/stats')
  const resp = data as Record<string, unknown>
  if (resp.success && resp.data) {
    return resp.data as { admin: number; operator: number; user: number; guest: number; total: number }
  }
  throw new Error('Failed to get user stats')
}
