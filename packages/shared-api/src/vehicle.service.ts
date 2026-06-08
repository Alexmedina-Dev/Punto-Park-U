import { getApiClient } from './api.js'
import type { ApiResponse, Vehicle } from '@punto-park-u/shared-types'

function unwrapData<T>(response: unknown): T {
  const resp = response as Record<string, unknown>
  if (resp && typeof resp === 'object' && resp.success && resp.data) {
    return resp.data as T
  }
  return resp as T
}

export async function getVehiclesService(params?: {
  isActive?: boolean
  type?: string
  search?: string
  page?: number
  limit?: number
}): Promise<{ data: Vehicle[]; pagination?: ApiResponse<Vehicle[]>['pagination'] }> {
  const api = getApiClient()
  const { data } = await api.get('/vehicles', { params })
  const resp = data as Record<string, unknown>
  if (resp.success && Array.isArray(resp.data)) {
    return {
      data: resp.data as Vehicle[],
      pagination: resp.pagination as ApiResponse<Vehicle[]>['pagination'],
    }
  }
  return { data: [] }
}

export async function getVehicleService(id: string): Promise<Vehicle> {
  const api = getApiClient()
  const { data } = await api.get(`/vehicles/${id}`)
  return unwrapData<Vehicle>(data)
}

export async function createVehicleService(vehicleData: {
  plate: string
  type: string
  brand?: string
  model?: string
  color?: string
}): Promise<Vehicle> {
  const api = getApiClient()
  const { data } = await api.post('/vehicles', vehicleData)
  return unwrapData<Vehicle>(data)
}

export async function updateVehicleService(
  id: string,
  updates: {
    plate?: string
    type?: string
    brand?: string
    model?: string
    color?: string
    isActive?: boolean
  }
): Promise<Vehicle> {
  const api = getApiClient()
  const { data } = await api.put(`/vehicles/${id}`, updates)
  return unwrapData<Vehicle>(data)
}

export async function deleteVehicleService(id: string): Promise<void> {
  const api = getApiClient()
  await api.delete(`/vehicles/${id}`)
}
