import { toast } from 'sonner'
import axios, { AxiosError } from 'axios'
import { RETRY_CONFIG } from './constants'

// ── Types ──

export interface AppError {
  message: string
  code?: string
  status?: number
  details?: string[]
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

// ── Toast Notifications ──

/**
 * Show an error toast from any error type.
 */
export function showErrorToast(error: unknown): void {
  const parsed = parseError(error)
  toast.error(parsed.message, {
    description: parsed.details?.join(', '),
  })
}

/**
 * Show a success toast.
 */
export function showSuccessToast(message: string): void {
  toast.success(message)
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
 * Does NOT retry on 4xx client errors.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: { maxRetries?: number; baseDelay?: number; maxDelay?: number } = {}
): Promise<T> {
  const maxRetries = config.maxRetries ?? RETRY_CONFIG.MAX_RETRIES
  const baseDelay = config.baseDelay ?? RETRY_CONFIG.BASE_DELAY
  const maxDelay = config.maxDelay ?? RETRY_CONFIG.MAX_DELAY

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
