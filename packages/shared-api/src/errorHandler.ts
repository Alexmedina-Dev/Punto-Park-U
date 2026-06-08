import axios, { AxiosError } from 'axios'
import type { AppError, RetryConfig } from '@punto-park-u/shared-types'

// ── Default Retry Config ──

const DEFAULT_RETRY: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 5000,
}

// ── Error Parsing ──

/**
 * Parse an error into a structured AppError.
 * Handles Axios errors, network errors, and generic errors.
 */
export function parseError(error: unknown): AppError {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string; errors?: Record<string, string[]> }>

    // Network error (no response received)
    if (!axiosError.response) {
      return {
        message: 'Error de conexión. Verifica tu conexión a internet.',
        code: 'NETWORK_ERROR',
        status: 0,
      }
    }

    const { status, data } = axiosError.response
    const serverMessage = data?.message || getDefaultErrorMessage(status)
    const details = data?.errors ? Object.values(data.errors).flat() : undefined

    return {
      message: serverMessage,
      code: `HTTP_${status}`,
      status,
      details,
    }
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      code: 'UNKNOWN_ERROR',
    }
  }

  return {
    message: 'Ha ocurrido un error inesperado',
    code: 'UNKNOWN_ERROR',
  }
}

/**
 * Get a default user-friendly message for HTTP status codes.
 */
function getDefaultErrorMessage(status: number): string {
  const messages: Record<number, string> = {
    400: 'Solicitud inválida. Verifica los datos ingresados.',
    401: 'Sesión expirada. Inicia sesión nuevamente.',
    403: 'No tienes permisos para realizar esta acción.',
    404: 'El recurso solicitado no fue encontrado.',
    409: 'Conflicto. El recurso ya existe.',
    422: 'Los datos ingresados no son válidos.',
    429: 'Demasiadas solicitudes. Intenta de nuevo más tarde.',
    500: 'Error interno del servidor. Intenta de nuevo más tarde.',
    502: 'El servidor no está disponible. Intenta de nuevo más tarde.',
    503: 'Servicio temporalmente fuera de servicio.',
  }
  return messages[status] || 'Ha ocurrido un error inesperado.'
}

// ── Retry Logic ──

/**
 * Wait for a given number of milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Calculate delay with exponential backoff + jitter.
 */
function getBackoffDelay(attempt: number, baseDelay: number, maxDelay: number): number {
  const exponentialDelay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay)
  const jitter = Math.random() * 1000
  return Math.min(exponentialDelay + jitter, maxDelay)
}

/**
 * Execute an async function with retry logic.
 * Retries on network errors and 5xx server errors.
 * Does NOT retry on 4xx client errors (unless overridden).
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const maxRetries = config.maxRetries ?? DEFAULT_RETRY.maxRetries
  const baseDelay = config.baseDelay ?? DEFAULT_RETRY.baseDelay
  const maxDelay = config.maxDelay ?? DEFAULT_RETRY.maxDelay

  let lastError: unknown

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      // Don't retry on 4xx client errors
      if (axios.isAxiosError(error) && error.response) {
        const status = error.response.status
        if (status >= 400 && status < 500) {
          throw error
        }
      }

      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        throw error
      }

      // Wait with exponential backoff
      const delay = getBackoffDelay(attempt, baseDelay, maxDelay)
      await sleep(delay)
    }
  }

  throw lastError
}
