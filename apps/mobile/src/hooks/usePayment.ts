// ╔══════════════════════════════════════════════════════════════════════╗
// ║  usePayment — payment lifecycle hook with ePayco integration        ║
// ╚══════════════════════════════════════════════════════════════════════╝

import { useState, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import {
  createEpaycoCheckoutService,
  getEpaycoPaymentStatusService,
  withRetry,
} from '@punto-park-u/shared-api';
import { usePaymentStore } from '@punto-park-u/shared-stores';
import type { Payment } from '@punto-park-u/shared-types';
import { normalizeError, getUserMessage, categorizeError } from '../utils/errors';
import { EPAYCO } from '../constants/app';

// ── Types ─────────────────────────────────────────────────────────────

export interface PaymentStateData {
  checkoutUrl: string | null;
  currentPayment: Payment | null;
  isProcessing: boolean;
  isLoading: boolean;
  error: string | null;
  errorCategory: string;
  paymentStatus: string;
  isPolling: boolean;
}

export interface UsePaymentReturn extends PaymentStateData {
  // Create a new ePayco checkout
  createCheckout: (params: {
    vehicle: string;
    reservation?: string;
    amount: number;
    email?: string;
  }) => Promise<string | null>;

  // Poll payment status until completion or failure
  pollPaymentStatus: (paymentId: string) => Promise<Payment['status']>;

  // Reset state
  reset: () => void;

  // Dismiss error
  clearError: () => void;

  // Retry last failed checkout
  retryCheckout: () => Promise<string | null>;

  // Fetch user payments
  fetchPayments: () => Promise<void>;
}

// ── Initial State ─────────────────────────────────────────────────────

const INITIAL_STATE: PaymentStateData = {
  checkoutUrl: null,
  currentPayment: null,
  isProcessing: false,
  isLoading: false,
  error: null,
  errorCategory: '',
  paymentStatus: 'idle',
  isPolling: false,
};

// ── Hook ──────────────────────────────────────────────────────────────

export function usePayment(): UsePaymentReturn {
  const [state, setState] = useState<PaymentStateData>(INITIAL_STATE);
  const { createPayment, fetchPayments: fetchStorePayments } = usePaymentStore();
  const lastCheckoutParams = useRef<{
    vehicle: string;
    reservation?: string;
    amount: number;
    email?: string;
  } | null>(null);

  // ── Create Checkout ──

  const createCheckout = useCallback(
    async (params: {
      vehicle: string;
      reservation?: string;
      amount: number;
      email?: string;
    }): Promise<string | null> => {
      setState((prev) => ({
        ...prev,
        isProcessing: true,
        error: null,
        errorCategory: '',
        paymentStatus: 'creating',
      }));

      lastCheckoutParams.current = params;

      try {
        const result = await withRetry(() => createEpaycoCheckoutService(params));

        // Create a local reference in the payment store
        await createPayment({
          vehicle: params.vehicle,
          reservation: params.reservation,
          amount: params.amount,
          method: 'epayco',
        });

        setState((prev) => ({
          ...prev,
          checkoutUrl: result.checkoutUrl,
          currentPayment: result.payment,
          isProcessing: false,
          isPolling: false,
          paymentStatus: 'checkout_ready',
        }));

        return result.checkoutUrl;
      } catch (err) {
        const appError = normalizeError(err);
        setState((prev) => ({
          ...prev,
          isProcessing: false,
          error: getUserMessage(err),
          errorCategory: categorizeError(err),
          paymentStatus: 'error',
          checkoutUrl: null,
        }));
        return null;
      }
    },
    [createPayment]
  );

  // ── Poll Payment Status ──

  const pollPaymentStatus = useCallback(
    async (paymentId: string): Promise<Payment['status']> => {
      setState((prev) => ({ ...prev, isPolling: true, paymentStatus: 'polling' }));

      let attempts = 0;

      const poll = async (): Promise<Payment['status']> => {
        while (attempts < EPAYCO.maxPollingAttempts) {
          attempts++;

          try {
            const statusResult = await withRetry(() =>
              getEpaycoPaymentStatusService(paymentId)
            );

            if (
              statusResult.status === 'completed' ||
              statusResult.status === 'failed' ||
              statusResult.status === 'refunded'
            ) {
              setState((prev) => ({
                ...prev,
                isPolling: false,
                paymentStatus: statusResult.status,
              }));
              return statusResult.status;
            }

            // Wait before next poll
            await new Promise((resolve) =>
              setTimeout(resolve, EPAYCO.pollingInterval)
            );
          } catch {
            // Continue polling on errors, don't stop
            await new Promise((resolve) =>
              setTimeout(resolve, EPAYCO.pollingInterval)
            );
          }
        }

        // Timeout reached
        setState((prev) => ({
          ...prev,
          isPolling: false,
          paymentStatus: 'timeout',
          error: 'La transacción tardó demasiado. Verifica el estado en tu historial.',
        }));

        return 'failed';
      };

      return poll();
    },
    []
  );

  // ── Retry ──

  const retryCheckout = useCallback(async (): Promise<string | null> => {
    if (!lastCheckoutParams.current) return null;
    return createCheckout(lastCheckoutParams.current);
  }, [createCheckout]);

  // ── Reset ──

  const reset = useCallback(() => {
    setState(INITIAL_STATE);
    lastCheckoutParams.current = null;
  }, []);

  // ── Clear Error ──

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null, errorCategory: '' }));
  }, []);

  // ── Fetch Payments ──

  const fetchPayments = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      await fetchStorePayments();
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [fetchStorePayments]);

  // ── Return ──

  return {
    ...state,
    createCheckout,
    pollPaymentStatus,
    reset,
    clearError,
    retryCheckout,
    fetchPayments,
  };
}
