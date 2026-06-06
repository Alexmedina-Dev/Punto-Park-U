import axios from 'axios'
import { API_BASE_URL, API_TIMEOUT, STORAGE_KEYS } from '@/utils/constants'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
})

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

// ── Response Interceptor ──
// Handle 401 (unauthorized) globally — clear token and redirect to login
// Handle other errors and normalize them
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response) {
      const { status } = error.response

      // 401 Unauthorized — token expired or invalid
      if (status === 401) {
        localStorage.removeItem(STORAGE_KEYS.TOKEN)
        localStorage.removeItem(STORAGE_KEYS.USER)

        // Only redirect if not already on login/register
        const currentPath = window.location.pathname
        if (currentPath !== '/login' && currentPath !== '/register') {
          window.location.href = '/login'
        }
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
