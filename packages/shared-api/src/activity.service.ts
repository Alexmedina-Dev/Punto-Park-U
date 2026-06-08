import { getApiClient } from './api.js'
import type { ApiResponse, ActivityLog } from '@punto-park-u/shared-types'

export async function getActivityLogService(): Promise<ActivityLog[]> {
  const api = getApiClient()
  const { data } = await api.get<ApiResponse<ActivityLog[]>>('/admin/activity')
  if (!data.success) {
    throw new Error(data.message || 'Error al obtener historial de actividad')
  }
  return data.data
}
