import { getApiClient } from './api.js'
import type { ApiResponse, Reservation } from '@punto-park-u/shared-types'

function unwrapData<T>(response: unknown): T {
  const resp = response as Record<string, unknown>
  if (resp && typeof resp === 'object' && resp.success && resp.data) {
    return resp.data as T
  }
  return resp as T
}

export async function getReservationsService(params?: {
  status?: string
  vehicleId?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
}): Promise<{ data: Reservation[]; pagination?: ApiResponse<Reservation[]>['pagination'] }> {
  const api = getApiClient()
  const { data } = await api.get('/reservations', { params })
  const resp = data as Record<string, unknown>
  if (resp.success && Array.isArray(resp.data)) {
    return {
      data: resp.data as Reservation[],
      pagination: resp.pagination as ApiResponse<Reservation[]>['pagination'],
    }
  }
  return { data: [] }
}

export async function getReservationService(id: string): Promise<Reservation> {
  const api = getApiClient()
  const { data } = await api.get(`/reservations/${id}`)
  return unwrapData<Reservation>(data)
}

export async function createReservationService(reservationData: {
  vehicle: string
  spot: string
  entryTime: string
  date?: string
  startTime?: string
  endTime?: string
  notes?: string
}): Promise<Reservation> {
  const api = getApiClient()
  const { data } = await api.post('/reservations', reservationData)
  return unwrapData<Reservation>(data)
}

export async function updateReservationService(
  id: string,
  updates: {
    vehicle?: string
    spot?: string
    entryTime?: string
    date?: string
    startTime?: string
    endTime?: string
    notes?: string
    status?: string
  }
): Promise<Reservation> {
  const api = getApiClient()
  const { data } = await api.put(`/reservations/${id}`, updates)
  return unwrapData<Reservation>(data)
}

export async function cancelReservationService(id: string): Promise<void> {
  const api = getApiClient()
  await api.delete(`/reservations/${id}`)
}

export async function getReservationStatsService(): Promise<{
  pending: number
  active: number
  completed: number
  cancelled: number
  total: number
}> {
  const api = getApiClient()
  const { data } = await api.get('/reservations/stats')
  return unwrapData(data)
}
