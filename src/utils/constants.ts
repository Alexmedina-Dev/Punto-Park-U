// ── API ──
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
export const API_TIMEOUT = 10000

// ── Routes ──
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  ADMIN: '/admin',
  VERIFY_EMAIL: '/verify-email',
  TWO_FACTOR_SETUP: '/2fa/setup',
  TWO_FACTOR_VERIFY: '/2fa/verify',
  SESSIONS: '/sessions',
} as const

// ── Storage Keys ──
export const STORAGE_KEYS = {
  TOKEN: 'token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
  THEME: 'theme',
} as const

// ── Pagination ──
export const DEFAULT_PAGE_SIZE = 10

// ── Retry ──
export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  BASE_DELAY: 1000,
  MAX_DELAY: 5000,
} as const

// ── Parking ──
export const VEHICLE_TYPES = ['car', 'moto', 'bike'] as const
export const PARKING_ZONES = ['A', 'B', 'C'] as const

// ── Session ──
export const SESSION_TIMEOUT = parseInt(import.meta.env.VITE_SESSION_TIMEOUT || '30', 10) * 60 * 1000
export const ACTIVITY_HEARTBEAT_INTERVAL = parseInt(import.meta.env.VITE_ACTIVITY_HEARTBEAT_INTERVAL || '5', 10) * 60 * 1000

// ── Brands ──
export const APP_NAME = 'PUNTO PARK U'
export const APP_DESCRIPTION =
  'Aplicativo Web creado para la visualización de Información de los usuarios de "Punto Park U"'
export const APP_AUTHORS = 'Alexander Medina & Miguel Palacio'
