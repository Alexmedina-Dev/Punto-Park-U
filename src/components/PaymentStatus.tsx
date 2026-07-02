import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, Badge } from '@/components/ui'
import { getEpaycoPaymentStatusService } from '@/services/payment.service'
import wsService from '@/services/websocket.service'
import { formatCurrency, formatDateTime } from '@/utils/formatters'
import type { Payment } from '@/types'

// ── Types ──────────────────────────────────────────────────────────────

interface PaymentStatusProps {
  /** The payment object to track */
  payment: Payment
  /** Called when the payment status changes */
  onStatusChange?: (newStatus: Payment['status']) => void
  /** Enable auto-polling fallback (every 10s) */
  enablePolling?: boolean
  /** Show full details or compact */
  variant?: 'full' | 'compact'
  /** Optional CSS class overrides */
  className?: string
}

interface WsPaymentUpdate {
  paymentId: string
  status: Payment['status']
  amount: number
  method: string
  epaycoRef?: string
}

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
  completed: 'success',
  pending: 'warning',
  pending_epayco: 'warning',
  failed: 'error',
  refunded: 'info',
}

const STATUS_LABELS: Record<string, string> = {
  completed: 'Completado',
  pending: 'Pendiente',
  pending_epayco: 'Pendiente de pago',
  pending_manual: 'Pendiente de confirmación',
  failed: 'Fallido',
  refunded: 'Reembolsado',
}

const STATUS_ICONS: Record<string, string> = {
  completed: 'check_circle',
  pending: 'schedule',
  pending_epayco: 'account_balance',
  pending_manual: 'hourglass_top',
  failed: 'cancel',
  refunded: 'replay',
}

/**
 * PaymentStatus — Displays the current state of an ePayco payment.
 *
 * Listens for WebSocket `payment:update` events for real-time status changes.
 * Falls back to HTTP polling (every 10s) if WebSocket is disconnected.
 * Can be used standalone or embedded in a receipt/payment flow.
 */
export function PaymentStatus({
  payment,
  onStatusChange,
  enablePolling = true,
  variant = 'full',
  className = '',
}: PaymentStatusProps) {
  const [status, setStatus] = useState<Payment['status']>(payment.status)
  const [amount] = useState(payment.amount)
  const [epaycoRef] = useState(payment.epaycoRef || null)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const unmountedRef = useRef(false)

  // ── Handle status change notification ──────────────────────────
  const handleStatusChange = useCallback(
    (newStatus: Payment['status']) => {
      if (unmountedRef.current) return
      setStatus(newStatus)
      onStatusChange?.(newStatus)
    },
    [onStatusChange]
  )

  // ── WebSocket listener for payment:update ──────────────────────
  useEffect(() => {
    unmountedRef.current = false

    const unsubscribe = wsService.on<WsPaymentUpdate>('payment:update', (data) => {
      if (data.paymentId === payment.id && data.status !== status) {
        handleStatusChange(data.status)
      }
    })

    return () => {
      unmountedRef.current = true
      unsubscribe()
    }
  }, [payment.id, status, handleStatusChange])

  // ── Polling fallback (every 10s while status is not final) ─────
  useEffect(() => {
    if (!enablePolling) return
    if (status === 'completed' || status === 'failed' || status === 'refunded') return

    const poll = async () => {
      if (unmountedRef.current) return
      try {
        const result = await getEpaycoPaymentStatusService(payment.id)
        if (result.status !== status) {
          handleStatusChange(result.status)
        }
      } catch {
        // Silently fail — next poll will retry
      }
    }

    // Start polling
    pollingRef.current = setInterval(poll, 10000)

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }
  }, [payment.id, status, enablePolling, handleStatusChange])

  // ── Render ─────────────────────────────────────────────────────
  const icon = STATUS_ICONS[status] || 'payments'
  const label = STATUS_LABELS[status] || status
  const badgeVariant = STATUS_VARIANT[status] || 'info'

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className={`material-symbols-outlined text-sm ${
          status === 'completed' ? 'text-green-400' :
          status === 'failed' ? 'text-red-400' :
          status === 'refunded' ? 'text-blue-400' :
          'text-yellow-400'
        }`}>
          {icon}
        </span>
        <Badge variant={badgeVariant}>{label}</Badge>
      </div>
    )
  }

  return (
    <Card variant="glass" padding="sm" className={className}>
      <div className="flex items-start gap-4">
        {/* Status icon */}
        <div
          className={`
            flex items-center justify-center w-12 h-12 rounded-xl shrink-0
            ${status === 'completed' ? 'bg-green-500/15' :
              status === 'failed' ? 'bg-red-500/15' :
              status === 'refunded' ? 'bg-blue-500/15' :
              'bg-yellow-500/15'}
          `}
        >
          <span
            className={`material-symbols-outlined text-2xl ${
              status === 'completed' ? 'text-green-400' :
              status === 'failed' ? 'text-red-400' :
              status === 'refunded' ? 'text-blue-400' :
              'text-yellow-400'
            }`}
          >
            {icon}
          </span>
        </div>

        {/* Status details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-on-bg text-lg">
              {formatCurrency(amount)}
            </span>
            <Badge variant={badgeVariant}>{label}</Badge>
          </div>

          {/* Pending status note */}
          {status === 'pending_epayco' && (
            <p className="text-sm text-on-surface-var mt-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">info</span>
              Esperando confirmación de ePayco. La página se actualizará automáticamente.
            </p>
          )}

          {/* Manual payment pending status */}
          {status === 'pending' && payment.method !== 'epayco' && payment.method !== 'cash' && payment.method !== 'pos' && (
            <p className="text-sm text-on-surface-var mt-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">info</span>
              Pendiente de confirmación por un operador.
            </p>
          )}

          {/* Manual payment proof */}
          {payment.manualPaymentProof && (
            <p className="text-xs text-on-surface-var mt-2 font-mono">
              Comprobante: {payment.manualPaymentProof}
            </p>
          )}

          {/* Completed status */}
          {status === 'completed' && (
            <p className="text-sm text-on-surface-var mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              Pago confirmado correctamente
            </p>
          )}

          {/* Failed status */}
          {status === 'failed' && (
            <p className="text-sm text-on-surface-var mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">error</span>
              El pago no pudo ser procesado. Intenta de nuevo.
            </p>
          )}

          {/* Refunded status */}
          {status === 'refunded' && (
            <p className="text-sm text-on-surface-var mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">replay</span>
              Pago reembolsado
            </p>
          )}

          {/* ePayco reference */}
          {epaycoRef && (
            <p className="text-xs text-on-surface-var mt-2 font-mono">
              Ref: {epaycoRef}
            </p>
          )}

          {/* Date */}
          {payment.createdAt && (
            <p className="text-xs text-on-surface-var mt-0.5">
              {formatDateTime(payment.createdAt)}
            </p>
          )}
        </div>
      </div>
    </Card>
  )
}
