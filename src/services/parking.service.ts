import api from './api'
import type {
  ApiResponse,
  PricingConfig,
  Schedule,
  ParkingSpot,
  ParkingStats,
  Reservation,
  ParkingEntry,
} from '@/types'

/**
 * Get parking tariffs for all vehicle types.
 */
export async function getTariffsService(): Promise<PricingConfig> {
  const { data } = await api.get<ApiResponse<PricingConfig>>('/parking/tariffs')
  if (!data.success) {
    throw new Error(data.message || 'Error al obtener tarifas')
  }
  return data.data
}

/**
 * Get the parking schedule (weekday and Sunday hours).
 */
export async function getScheduleService(): Promise<Schedule> {
  const { data } = await api.get<ApiResponse<Schedule>>('/parking/schedule')
  if (!data.success) {
    throw new Error(data.message || 'Error al obtener horarios')
  }
  return data.data
}

/**
 * Get real-time parking spot availability with stats.
 */
export async function getAvailabilityService(): Promise<{
  spots: ParkingSpot[]
  stats: ParkingStats
}> {
  const { data } = await api.get<ApiResponse<{ spots: ParkingSpot[]; stats: ParkingStats }>>(
    '/parking/availability'
  )
  if (!data.success) {
    throw new Error(data.message || 'Error al obtener disponibilidad')
  }
  return data.data
}

/**
 * Get all parking spots.
 */
export async function getParkingSpotsService(): Promise<ParkingSpot[]> {
  const { data } = await api.get<ApiResponse<ParkingSpot[]>>('/parking/spots')
  if (!data.success) {
    throw new Error(data.message || 'Error al obtener espacios')
  }
  return data.data
}

/**
 * Get recent parking activity entries.
 */
export async function getRecentEntriesService(): Promise<ParkingEntry[]> {
  const { data } = await api.get<ApiResponse<ParkingEntry[]>>('/parking/entries/recent')
  if (!data.success) {
    throw new Error(data.message || 'Error al obtener actividad reciente')
  }
  return data.data
}

/**
 * Get user's active reservations.
 */
export async function getUserReservationsService(userId: string): Promise<Reservation[]> {
  const { data } = await api.get<ApiResponse<Reservation[]>>(`/parking/reservations/${userId}`)
  if (!data.success) {
    throw new Error(data.message || 'Error al obtener reservas')
  }
  return data.data
}
