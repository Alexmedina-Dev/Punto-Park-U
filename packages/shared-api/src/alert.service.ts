import { getApiClient } from './api.js'
import type { ApiResponse, Alert } from '@punto-park-u/shared-types'

export async function getAlertsService(): Promise<Alert[]> {
  const api = getApiClient()
  const { data } = await api.get<ApiResponse<Alert[]>>('/admin/alerts')
  if (!data.success) {
    throw new Error(data.message || 'Error al obtener alertas')
  }
  return data.data
}

export async function dismissAlertService(alertId: string): Promise<void> {
  const api = getApiClient()
  const { data } = await api.put<ApiResponse<null>>(`/admin/alerts/${alertId}/dismiss`)
  if (!data.success) {
    throw new Error(data.message || 'Error al descartar alerta')
  }
}
