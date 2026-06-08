import type { Payment } from '@/types'
import { Card, Badge } from '@/components/ui'
import { formatCurrency, formatDateTime } from '@/utils/formatters'

const METHOD_LABELS: Record<string, string> = {
  cash: 'Efectivo',
  pos: 'POS/Tarjeta',
  epayco: 'ePayco',
}

const METHOD_ICONS: Record<string, string> = {
  cash: 'payments',
  pos: 'credit_card',
  epayco: 'account_balance',
}

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
  completed: 'success',
  pending: 'warning',
  failed: 'error',
}

const STATUS_LABELS: Record<string, string> = {
  completed: 'Completado',
  pending: 'Pendiente',
  failed: 'Fallido',
}

interface PaymentCardProps {
  payment: Payment
  showVehicleInfo?: boolean
}

export function PaymentCard({ payment, showVehicleInfo = false }: PaymentCardProps) {
  const isPending = payment.status === 'pending'

  return (
    <Card variant="glass" padding="sm" className="group">
      <div className="flex items-start justify-between gap-4">
        {/* Icon + Info */}
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div
            className={`
              flex items-center justify-center w-10 h-10 rounded-lg shrink-0
              ${isPending ? 'bg-yellow-500/15' : 'bg-green-500/15'}
            `}
          >
            <span
              className={`material-symbols-outlined text-lg ${
                isPending ? 'text-yellow-400' : 'text-green-400'
              }`}
            >
              {METHOD_ICONS[payment.method] || 'payments'}
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-on-bg text-lg">
                {formatCurrency(payment.amount)}
              </span>
              <Badge variant={STATUS_VARIANT[payment.status] || 'info'}>
                {STATUS_LABELS[payment.status] || payment.status}
              </Badge>
            </div>
            <p className="text-sm text-on-surface-var mt-0.5">
              {formatDateTime(payment.date || payment.createdAt || '')}
            </p>
            <div className="flex items-center gap-2 mt-1 text-sm text-on-surface-var">
              <span className="material-symbols-outlined text-xs">
                {METHOD_ICONS[payment.method] || 'payments'}
              </span>
              <span>{METHOD_LABELS[payment.method] || payment.method}</span>
            </div>
            {showVehicleInfo && payment.vehicleId && (
              <p className="text-xs text-on-surface-var mt-1">
                ID Vehículo: {payment.vehicleId}
              </p>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
