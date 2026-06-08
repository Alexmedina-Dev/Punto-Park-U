import { getApiClient } from './api.js'
import type { ApiResponse, HardwareSensor, HardwareStatus, BarrierStatus } from '@punto-park-u/shared-types'

export async function getSensorsService(): Promise<HardwareSensor[]> {
  const api = getApiClient()
  const { data } = await api.get<ApiResponse<HardwareSensor[]>>('/hardware/sensors')
  if (!data.success) {
    throw new Error(data.message || 'Error al obtener sensores')
  }
  return data.data
}

export async function getSensorByIdService(id: string): Promise<HardwareSensor> {
  const api = getApiClient()
  const { data } = await api.get<ApiResponse<HardwareSensor>>(`/hardware/sensors/${id}`)
  if (!data.success) {
    throw new Error(data.message || 'Error al obtener sensor')
  }
  return data.data
}

export async function getHardwareStatusService(): Promise<HardwareStatus> {
  const api = getApiClient()
  const { data } = await api.get<ApiResponse<HardwareStatus>>('/hardware/status')
  if (!data.success) {
    throw new Error(data.message || 'Error al obtener estado del hardware')
  }
  return data.data
}

export async function getBarriersService(): Promise<BarrierStatus[]> {
  const api = getApiClient()
  const { data } = await api.get<ApiResponse<BarrierStatus[]>>('/hardware/barriers')
  if (!data.success) {
    throw new Error(data.message || 'Error al obtener barreras')
  }
  return data.data
}

export async function openBarrierService(id: string, simulated = false): Promise<any> {
  const api = getApiClient()
  const { data } = await api.post<ApiResponse<any>>(`/hardware/barriers/${id}/open`, { simulated })
  if (!data.success) {
    throw new Error(data.message || 'Error al abrir barrera')
  }
  return data.data
}

export async function closeBarrierService(id: string, simulated = false): Promise<any> {
  const api = getApiClient()
  const { data } = await api.post<ApiResponse<any>>(`/hardware/barriers/${id}/close`, { simulated })
  if (!data.success) {
    throw new Error(data.message || 'Error al cerrar barrera')
  }
  return data.data
}

export async function overrideBarrierService(id: string, action: 'open' | 'close'): Promise<any> {
  const api = getApiClient()
  const { data } = await api.post<ApiResponse<any>>(`/hardware/barriers/${id}/override`, { action })
  if (!data.success) {
    throw new Error(data.message || 'Error al sobreescribir barrera')
  }
  return data.data
}
