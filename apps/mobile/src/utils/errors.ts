// ╔══════════════════════════════════════════════════════════════════════╗
// ║  Errors — structured error handling and display helpers             ║
// ╚══════════════════════════════════════════════════════════════════════╝

import { parseError } from '@punto-park-u/shared-api';
import type { AppError } from '@punto-park-u/shared-types';

// ── Error Categories ──────────────────────────────────────────────────

export type ErrorCategory = 'network' | 'auth' | 'validation' | 'server' | 'unknown' | 'payment';

export function categorizeError(error: unknown): ErrorCategory {
  if (!error) return 'unknown';

  const appError = normalizeError(error);

  switch (appError.code) {
    case 'NETWORK_ERROR':
      return 'network';
    case 'HTTP_401':
      return 'auth';
    case 'HTTP_403':
      return 'auth';
    case 'HTTP_422':
      return 'validation';
    case 'HTTP_500':
    case 'HTTP_502':
    case 'HTTP_503':
      return 'server';
  }

  if (appError.code?.startsWith('HTTP_4')) {
    return 'validation';
  }

  if (appError.code?.startsWith('PAYMENT_')) {
    return 'payment';
  }

  return 'unknown';
}

// ── Normalize ─────────────────────────────────────────────────────────

export function normalizeError(error: unknown): AppError {
  if (error && typeof error === 'object' && 'message' in error && 'code' in error) {
    return error as AppError;
  }
  return parseError(error);
}

// ── User-Facing Messages ──────────────────────────────────────────────

const CATEGORY_MESSAGES: Record<ErrorCategory, string> = {
  network: 'Error de conexión. Verifica tu conexión a internet e intenta de nuevo.',
  auth: 'Tu sesión ha expirado. Inicia sesión nuevamente.',
  validation: 'Verifica los datos ingresados e intenta de nuevo.',
  server: 'Error del servidor. Intenta de nuevo más tarde.',
  payment: 'Error al procesar el pago. Si el problema persiste, contacta a soporte.',
  unknown: 'Ha ocurrido un error inesperado. Intenta de nuevo.',
};

export function getUserMessage(error: unknown): string {
  const appError = normalizeError(error);
  const category = categorizeError(error);
  return appError.message || CATEGORY_MESSAGES[category];
}

export function getErrorTitle(error: unknown): string {
  const category = categorizeError(error);
  const titles: Record<ErrorCategory, string> = {
    network: 'Sin conexión',
    auth: 'Sesión expirada',
    validation: 'Datos inválidos',
    server: 'Error del servidor',
    payment: 'Error de pago',
    unknown: 'Error',
  };
  return titles[category];
}

// ── Payment-specific errors ───────────────────────────────────────────

export const PAYMENT_ERRORS = {
  CARD_DECLINED: {
    code: 'PAYMENT_CARD_DECLINED',
    message: 'La tarjeta fue rechazada. Intenta con otro método de pago.',
  },
  INSUFFICIENT_FUNDS: {
    code: 'PAYMENT_INSUFFICIENT_FUNDS',
    message: 'Fondos insuficientes. Intenta con otra tarjeta.',
  },
  EXPIRED_CARD: {
    code: 'PAYMENT_EXPIRED_CARD',
    message: 'La tarjeta está vencida. Usa otra tarjeta.',
  },
  PROCESSING_ERROR: {
    code: 'PAYMENT_PROCESSING_ERROR',
    message: 'Error al procesar el pago. Intenta de nuevo.',
  },
  TIMEOUT: {
    code: 'PAYMENT_TIMEOUT',
    message: 'La transacción tardó demasiado. Intenta de nuevo.',
  },
  DUPLICATE: {
    code: 'PAYMENT_DUPLICATE',
    message: 'Este pago ya fue procesado.',
  },
} as const;

export function isPaymentError(error: unknown): boolean {
  const appError = normalizeError(error);
  return appError.code?.startsWith('PAYMENT_') ?? false;
}

// ── Error Details ─────────────────────────────────────────────────────

export function getErrorDetails(error: unknown): string[] {
  const appError = normalizeError(error);
  if (appError.details && appError.details.length > 0) {
    return appError.details;
  }
  return [];
}

export function hasErrorDetails(error: unknown): boolean {
  return getErrorDetails(error).length > 0;
}
