import { useState, useEffect, useCallback } from 'react'
import { Card, Button, Badge } from '@/components/ui'
import { getPaymentsService, confirmManualPaymentService } from '@/services/payment.service'
import { formatCurrency, formatDateTime } from '@/utils/formatters'
import { showErrorToast } from '@/utils/errorHandler'
import type { Payment } from '@/types'

const METHOD_LABELS: Record<string, string> = {
  nequi: 'Nequi',
  daviplata: 'Daviplata',
  transfer: 'Transferencia',
}

const METHOD_ICONS: Record<string, string> = {
  nequi: 'smartphone',
  daviplata: 'account_balance_wallet',
  transfer: 'swap_horiz',
}

interface ManualPaymentsPanelProps {
  className?: string
}

export function ManualPaymentsPanel({ className = '' }: ManualPaymentsPanelProps) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  const fetchPendingPayments = useCallback(async () => {
    try {
      setIsLoading(true)
      const result = await getPaymentsService({ status: 'pending', limit: 50 })
      const manualPayments = result.data.filter((p) =>
        ['nequi', 'daviplata', 'transfer'].includes(p.method)
      )
      setPayments(manualPayments)
    } catch {
      showErrorToast('Error al cargar pagos pendientes')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPendingPayments()
  }, [fetchPendingPayments])

  const handleConfirm = async (paymentId: string) => {
    try {
      setConfirmingId(paymentId)
      await confirmManualPaymentService(paymentId)
      setPayments((prev) => prev.filter((p) => p.id !== paymentId))
    } catch {
      showErrorToast('Error al confirmar el pago')
    } finally {
      setConfirmingId(null)
    }
  }

  return (
    <Card variant="glass" padding="lg" className={className}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-primary font-headline">
            Pagos Manuales Pendientes
          </h3>
          <p className="text-sm text-on-surface-var mt-1">
            Nequi, Daviplata y Transferencias por confirmar
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={fetchPendingPayments} loading={isLoading}>
          <span className="material-symbols-outlined text-base">refresh</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <span className="inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : payments.length === 0 ? (
        <div className="text-center py-8 text-on-surface-var text-sm">
          <span className="material-symbols-outlined text-3xl mb-2 block">check_circle</span>
          <p>No hay pagos manuales pendientes</p>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between gap-4 p-3 rounded-lg bg-surface-container/50"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-yellow-500/15 shrink-0">
                  <span className="material-symbols-outlined text-yellow-400 text-lg">
                    {METHOD_ICONS[p.method] || 'payments'}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-on-bg">{formatCurrency(p.amount)}</span>
                    <Badge variant="warning">{METHOD_LABELS[p.method] || p.method}</Badge>
                  </div>
                  <p className="text-xs text-on-surface-var mt-0.5">
                    {formatDateTime(p.createdAt || p.date)}
                  </p>
                  {p.manualPaymentProof && (
                    <p className="text-xs text-on-surface-var font-mono mt-0.5">
                      Comprobante: {p.manualPaymentProof}
                    </p>
                  )}
                </div>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleConfirm(p.id)}
                loading={confirmingId === p.id}
                disabled={confirmingId !== null}
              >
                <span className="material-symbols-outlined text-sm">check</span>
                Confirmar
              </Button>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
