import { getApiClient } from './api.js'
import type {
  ApiResponse,
  PricingConfig,
  Schedule,
  ParkingSpot,
  SpotType,
  ParkingStats,
  Reservation,
  ParkingEntry,
} from '@punto-park-u/shared-types'

// ── Simple in-memory cache ──

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

const cache = new Map<string, CacheEntry<unknown>>()

function getCached<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined
  if (!entry) return null
  if (Date.now() - entry.timestamp > entry.ttl) {
    cache.delete(key)
    return null
  }
  return entry.data
}

function setCache<T>(key: string, data: T, ttlMs: number): void {
  cache.set(key, { data, timestamp: Date.now(), ttl: ttlMs })
}

const TTL = {
  TARIFFS: 2 * 60 * 1000,
  SCHEDULE: 5 * 60 * 1000,
  AVAILABILITY: 30 * 1000,
  SPOTS: 30 * 1000,
}

const DEFAULT_TARIFFS: PricingConfig = {
  car: { hour: 3000, day: 25000, month: 300000 },
  moto: { hour: 1500, day: 12000, month: 150000 },
  camioneta: { hour: 4000, day: 30000, month: 400000 },
  bike: { hour: 1000, day: 8000, month: 100000 },
}

const DEFAULT_SCHEDULE: Schedule = {
  weekday: { open: '07:00', close: '19:00' },
  sunday: { open: '09:00', close: '17:00' },
}

const SPOT_TYPES: SpotType[] = ['car', 'moto', 'camioneta', 'bike']

const DEFAULT_AVAILABILITY = {
  spots: Array.from({ length: 30 }, (_, i) => ({
    id: `${String.fromCharCode(65 + (i % 3))}${i + 1}`,
    code: `${String.fromCharCode(65 + (i % 3))}${i + 1}`,
    zone: String.fromCharCode(65 + (i % 3)) as 'A' | 'B' | 'C',
    type: SPOT_TYPES[i % 3] as SpotType,
    status: (i % 3 === 0 ? 'ocupado' : 'libre') as 'libre' | 'ocupado',
  })),
  stats: {
    cars: { used: 8, total: 15 },
    motos: { used: 3, total: 10 },
    bikes: { used: 2, total: 5 },
  },
}

function unwrapResponse<T>(responseData: ApiResponse<T> | { success: boolean; data: T } | T): T {
  if (responseData && typeof responseData === 'object' && 'success' in responseData && (responseData as ApiResponse<T>).data) {
    return (responseData as ApiResponse<T>).data
  }
  return responseData as T
}

export async function getTariffsService(): Promise<PricingConfig> {
  const cacheKey = 'tariffs'
  const cached = getCached<PricingConfig>(cacheKey)
  if (cached) return cached

  try {
    const api = getApiClient()
    const { data } = await api.get<ApiResponse<PricingConfig> | PricingConfig>('/tariffs')
    const tariffs = unwrapResponse<PricingConfig>(data)
    setCache(cacheKey, tariffs, TTL.TARIFFS)
    return tariffs
  } catch {
    return DEFAULT_TARIFFS
  }
}

export async function getScheduleService(): Promise<Schedule> {
  const cacheKey = 'schedule'
  const cached = getCached<Schedule>(cacheKey)
  if (cached) return cached

  try {
    const api = getApiClient()
    const { data } = await api.get<ApiResponse<Schedule> | Schedule>('/schedule')
    const schedule = unwrapResponse<Schedule>(data)
    setCache(cacheKey, schedule, TTL.SCHEDULE)
    return schedule
  } catch {
    return DEFAULT_SCHEDULE
  }
}

export async function getAvailabilityService(): Promise<{
  spots: ParkingSpot[]
  stats: ParkingStats
} | null> {
  const cacheKey = 'availability'
  const cached = getCached<{ spots: ParkingSpot[]; stats: ParkingStats }>(cacheKey)
  if (cached) return cached

  try {
    const api = getApiClient()
    const { data } = await api.get<ApiResponse<{ spots: ParkingSpot[]; stats: ParkingStats }> | { spots: ParkingSpot[]; stats: ParkingStats }>(
      '/parking/availability'
    )
    const availability = unwrapResponse<{ spots: ParkingSpot[]; stats: ParkingStats }>(data)
    setCache(cacheKey, availability, TTL.AVAILABILITY)
    return availability
  } catch {
    return null
  }
}

export async function getParkingSpotsService(filters?: {
  type?: string
  date?: string
  startTime?: string
  endTime?: string
}): Promise<ParkingSpot[]> {
  const cacheKey = filters ? `parking-spots-${JSON.stringify(filters)}` : 'parking-spots'
  const cached = getCached<ParkingSpot[]>(cacheKey)
  if (cached) return cached

  try {
    const api = getApiClient()
    const params: Record<string, string> = {}
    if (filters?.type) params.type = filters.type
    if (filters?.date) params.date = filters.date
    if (filters?.startTime) params.startTime = filters.startTime
    if (filters?.endTime) params.endTime = filters.endTime

    const { data } = await api.get<ApiResponse<ParkingSpot[]> | ParkingSpot[]>('/parking/spots', { params })
    const spots = unwrapResponse<ParkingSpot[]>(data)
    setCache(cacheKey, spots, TTL.SPOTS)
    return spots
  } catch {
    return DEFAULT_AVAILABILITY.spots
  }
}

export async function getRecentEntriesService(): Promise<ParkingEntry[]> {
  try {
    const api = getApiClient()
    const { data } = await api.get<ApiResponse<ParkingEntry[]> | ParkingEntry[]>('/parking/entries/recent')
    return unwrapResponse<ParkingEntry[]>(data)
  } catch {
    return []
  }
}

export async function getUserReservationsService(_userId: string): Promise<Reservation[]> {
  try {
    const api = getApiClient()
    const { data } = await api.get<ApiResponse<Reservation[]> | Reservation[]>(`/parking/reservations/${_userId}`)
    return unwrapResponse<Reservation[]>(data)
  } catch {
    return []
  }
}
