import { create } from 'zustand'
import type { Payment } from '@punto-park-u/shared-types'
import {
  getPaymentsService,
  createPaymentService,
  getPaymentStatsService,
  withRetry,
} from '@punto-park-u/shared-api'

export interface PaymentState {
  payments: Payment[]
  stats: {
    totals: { count: number; totalAmount: number; avgAmount: number; maxAmount: number; minAmount: number }
    byStatus: Record<string, { count: number; total: number }>
    byMethod: Record<string, { count: number; total: number }>
  } | null
  isLoading: boolean
  error: string | null

  // Actions
  fetchPayments: () => Promise<void>
  fetchStats: () => Promise<void>
  createPayment: (data: {
    vehicle: string
    reservation?: string
    amount: number
    method: string
  }) => Promise<boolean>
  clearError: () => void
}

export const usePaymentStore = create<PaymentState>((set) => ({
  payments: [],
  stats: null,
  isLoading: false,
  error: null,

  fetchPayments: async () => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await withRetry(() => getPaymentsService())
      set({ payments: data, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  fetchStats: async () => {
    try {
      const stats = await withRetry(() => getPaymentStatsService())
      set({ stats })
    } catch {
      // Stats fetch is non-critical
    }
  },

  createPayment: async (paymentData) => {
    set({ isLoading: true, error: null })
    try {
      const payment = await withRetry(() => createPaymentService(paymentData))
      set((state) => ({
        payments: [payment, ...state.payments],
        isLoading: false,
      }))
      return true
    } catch {
      set({ isLoading: false })
      return false
    }
  },

  clearError: () => set({ error: null }),
}))
