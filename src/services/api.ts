import axios from 'axios'
import { API_BASE_URL, API_TIMEOUT, STORAGE_KEYS } from '@/utils/constants'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ── Dev Logging ──
// Log all requests and responses in development mode
if (import.meta.env.DEV) {
  api.interceptors.request.use(
    (config) => {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, {
        data: config.data,
        params: config.params,
        headers: config.headers,
      })
      return config
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

// ── Request Interceptor ──
// Attach JWT token from localStorage to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
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

// ── Response Interceptor ──
// Handle 401 (unauthorized) globally — try token refresh, then clear and redirect
// Handle other errors and normalize them
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Skip retry for login/register requests
    const isAuthRequest =
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/register')

    // Attempt token refresh on 401 (skip for auth requests)
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRequest) {
      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
        if (!refreshToken) {
          throw new Error('No refresh token available')
        }

        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken })
        const newToken = data.token || data.accessToken

        localStorage.setItem(STORAGE_KEYS.TOKEN, newToken)
        processQueue(null, newToken)

        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)

        // Clear auth state on refresh failure
        localStorage.removeItem(STORAGE_KEYS.TOKEN)
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
        localStorage.removeItem(STORAGE_KEYS.USER)

        const currentPath = window.location.pathname
        if (currentPath !== '/login' && currentPath !== '/register') {
          window.location.href = '/login'
        }

        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    // Normalize error messages
    if (error.response) {
      const { status, data } = error.response

      // Server returned a structured error
      if (data?.error) {
        error.message = data.error
      } else if (data?.message) {
        error.message = data.message
      }

      // 429 Too Many Requests — rate limiting
      if (status === 429) {
        error.message = 'Demasiadas solicitudes. Por favor, espera un momento.'
      }

      // 503 Service Unavailable
      if (status === 503) {
        error.message = 'El servicio no está disponible en este momento.'
      }
    } else if (error.request) {
      // Network error (no response received)
      error.message = 'Error de conexión. Verifica tu conexión a internet.'
    }

    return Promise.reject(error)
  }
)

export default api
