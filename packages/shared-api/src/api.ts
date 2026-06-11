import axios, { AxiosInstance, AxiosError } from 'axios'
import type { ApiConfig } from '@punto-park-u/shared-types'

// ── Module-level API instance ──
// Services import getApiClient() to use the shared Axios instance.
// Call initApiClient(config) once during app startup.

let _apiInstance: AxiosInstance | null = null

/**
 * Initialize the shared API client.
 * Must be called once before any service function.
 */
export function initApiClient(config: ApiConfig): AxiosInstance {
  const api = createApiClient(config)
  _apiInstance = api
  return api
}

/**
 * Get the shared API client instance.
 * Throws if not initialized — ensures services fail fast on misconfiguration.
 */
export function getApiClient(): AxiosInstance {
  if (!_apiInstance) {
    throw new Error(
      '[shared-api] API client not initialized. Call initApiClient(config) before using services.'
    )
  }
  return _apiInstance
}

/**
 * Create a new Axios instance with the given configuration.
 * Accepts a token getter function so both web (localStorage) and mobile
 * (SecureStore) can supply tokens without the API layer knowing the platform.
 */
function createApiClient(config: ApiConfig): AxiosInstance {
  const api = axios.create({
    baseURL: config.baseURL,
    timeout: config.timeout,
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  // ── Dev Logging ──
  if (config.debug) {
    api.interceptors.request.use(
      (req) => {
        console.log(`[API] ${req.method?.toUpperCase()} ${req.baseURL}${req.url}`, {
          data: req.data,
          params: req.params,
          headers: req.headers,
        })
        return req
      },
      (error) => {
        console.error('[API] Request error:', error)
        return Promise.reject(error)
      }
    )

    api.interceptors.response.use(
      (response) => {
        console.log(`[API] ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`, {
          data: response.data,
        })
        return response
      },
      (error) => {
        if (error.response) {
          console.error(`[API] Error ${error.response.status}:`, {
            url: error.config?.url,
            data: error.response.data,
          })
        } else if (error.request) {
          console.error('[API] Network error:', error.message)
        }
        return Promise.reject(error)
      }
    )
  }

  // ── Request Interceptor: Attach JWT token ──
  api.interceptors.request.use(
    async (req) => {
      const token = await config.getToken()
      if (token) {
        req.headers.Authorization = `Bearer ${token}`
      }
      return req
    },
    (error) => Promise.reject(error)
  )

  // ── Token Refresh Queue ──
  let isRefreshing = false
  let failedQueue: Array<{
    resolve: (token: string) => void
    reject: (error: unknown) => void
  }> = []

  const processQueue = (error: unknown, token: string | null = null) => {
    failedQueue.forEach((promise) => {
      if (token) {
        promise.resolve(token)
      } else {
        promise.reject(error)
      }
    })
    failedQueue = []
  }

  // ── Response Interceptor: Handle 401 globally ──
  api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as { _retry?: boolean; url?: string; headers?: Record<string, string> } & typeof error.config
      if (!originalRequest) return Promise.reject(error)

      // Skip retry for login/register requests
      const isAuthRequest =
        originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/admin/login') ||
        originalRequest.url?.includes('/auth/register')

      // Attempt token refresh on 401 (skip for auth requests)
      if (error.response?.status === 401 && !originalRequest._retry && !isAuthRequest) {
        if (isRefreshing) {
          // Queue this request until refresh completes
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject })
          }).then((token) => {
            originalRequest.headers!.Authorization = `Bearer ${token}`
            return api(originalRequest)
          })
        }

        originalRequest._retry = true
        isRefreshing = true

        try {
          const refreshToken = config.getRefreshToken
            ? await config.getRefreshToken()
            : await config.getToken()
          const { data } = await axios.post(`${config.baseURL}/auth/refresh`, {
            refreshToken,
          })
          const newToken = data.token || data.accessToken

          processQueue(null, newToken)

          originalRequest.headers!.Authorization = `Bearer ${newToken}`
          return api(originalRequest)
        } catch (refreshError) {
          processQueue(refreshError, null)

          // Notify consumer that auth failed
          config.onAuthFailure?.()

          return Promise.reject(refreshError)
        } finally {
          isRefreshing = false
        }
      }

      // Normalize error messages
      if (error.response) {
        const { status, data } = error.response
        const respData = data as Record<string, unknown> | undefined

        if (respData?.error) {
          error.message = respData.error as string
        } else if (respData?.message) {
          error.message = respData.message as string
        }

        if (status === 429) {
          error.message = 'Demasiadas solicitudes. Por favor, espera un momento.'
        }
        if (status === 503) {
          error.message = 'El servicio no está disponible en este momento.'
        }
      } else if (error.request) {
        error.message = 'Error de conexión. Verifica tu conexión a internet.'
      }

      return Promise.reject(error)
    }
  )

  return api
}
