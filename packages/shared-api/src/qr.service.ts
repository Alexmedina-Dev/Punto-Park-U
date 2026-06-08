import { getApiClient } from './api.js'
import type { Ticket, QRValidationResult } from '@punto-park-u/shared-types'

function unwrapSuccessData<T>(response: unknown): T {
  const resp = response as { success: boolean; data: T }
  if (resp && typeof resp === 'object' && resp.success) {
    return resp.data
  }
  throw new Error('Failed to extract data from response')
}

export async function generateQRService(reservationId: string): Promise<Ticket> {
  const api = getApiClient()
  const { data } = await api.post('/qr/generate', { reservationId })
  return unwrapSuccessData<Ticket>(data)
}

export async function getQRTicketService(reservationId: string): Promise<Ticket> {
  const api = getApiClient()
  const { data } = await api.get(`/qr/ticket/${reservationId}`)
  return unwrapSuccessData<Ticket>(data)
}

export async function validateQRService(qrContent: string): Promise<QRValidationResult> {
  const api = getApiClient()
  const { data } = await api.post('/qr/validate', { qrContent })
  return unwrapSuccessData<QRValidationResult>(data)
}

export async function processExitService(qrContent: string): Promise<QRValidationResult> {
  const api = getApiClient()
  const { data } = await api.post('/qr/exit', { qrContent })
  return unwrapSuccessData<QRValidationResult>(data)
}
