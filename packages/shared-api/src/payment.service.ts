import { getApiClient } from './api.js'
import type { ApiResponse, Payment } from '@punto-park-u/shared-types'

function unwrapData<T>(response: unknown): T {
  const resp = response as Record<string, unknown>
  if (resp && typeof resp === 'object' && resp.success && resp.data) {
    return resp.data as T
  }
  return resp as T
}

export async function getPaymentsService(params?: {
  status?: string
  method?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
}): Promise<{ data: Payment[]; pagination?: ApiResponse<Payment[]>['pagination'] }> {
  const api = getApiClient()
  const { data } = await api.get('/payments', { params })
  const resp = data as Record<string, unknown>
  if (resp.success && Array.isArray(resp.data)) {
    return {
      data: resp.data as Payment[],
      pagination: resp.pagination as ApiResponse<Payment[]>['pagination'],
    }
  }
  return { data: [] }
}

export async function getPaymentService(id: string): Promise<Payment> {
  const api = getApiClient()
  const { data } = await api.get(`/payments/${id}`)
  return unwrapData<Payment>(data)
}

export async function createPaymentService(paymentData: {
  vehicle: string
  reservation?: string
  amount: number
  method: string
  manualPaymentProof?: string
}): Promise<Payment> {
  const api = getApiClient()
  const { data } = await api.post('/payments', paymentData)
  return unwrapData<Payment>(data)
}

export async function getPaymentStatsService(): Promise<{
  totals: { count: number; totalAmount: number; avgAmount: number; maxAmount: number; minAmount: number }
  byStatus: Record<string, { count: number; total: number }>
  byMethod: Record<string, { count: number; total: number }>
}> {
  const api = getApiClient()
  const { data } = await api.get('/payments/stats')
  return unwrapData(data)
}

// ── ePayco-specific API calls ──

export async function createEpaycoCheckoutService(params: {
  vehicle: string
  reservation?: string
  amount?: number
  email?: string
}): Promise<{
  payment: Payment
  checkoutUrl: string
  ref: string
}> {
  const api = getApiClient()
  const { data } = await api.post('/payments/epayco/checkout', params)
  return unwrapData(data)
}

export async function getEpaycoPaymentStatusService(
  paymentId: string
): Promise<{
  id: string
  status: Payment['status']
  amount: number
  epaycoRef: string | null
}> {
  const api = getApiClient()
  const { data } = await api.get(`/payments/epayco/${paymentId}/status`)
  return unwrapData(data)
}

export async function refundEpaycoPaymentService(
  paymentId: string
): Promise<{
  id: string
  status: string
  refundId: string
}> {
  const api = getApiClient()
  const { data } = await api.post(`/payments/epayco/${paymentId}/refund`)
  return unwrapData(data)
}

// ── Manual payment confirmation ──

export async function confirmManualPaymentService(
  paymentId: string
): Promise<Payment> {
  const api = getApiClient()
  const { data } = await api.post(`/payments/${paymentId}/confirm`)
  return unwrapData<Payment>(data)
}
