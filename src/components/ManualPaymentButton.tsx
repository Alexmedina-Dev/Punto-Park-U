import { useState, useCallback } from 'react'
import { Button, Modal } from '@/components/ui'
import { createPaymentService } from '@/services/payment.service'
import { showErrorToast, showSuccessToast } from '@/utils/errorHandler'

interface ManualPaymentButtonProps {
  vehicleId: string
  reservationId?: string
  amount?: number
  className?: string
}

type ManualMethod = 'nequi' | 'daviplata' | 'transfer'

const METHOD_OPTIONS: { key: ManualMethod; label: string; icon: string; instructions: string }[] = [
  {
    key: 'nequi',
    label: 'Nequi',
    icon: 'smartphone',
    instructions: 'Envía el pago al número 300XXXXXXX. Incluye tu placa en la descripción.',
  },
  {
    key: 'daviplata',
    label: 'Daviplata',
    icon: 'account_balance_wallet',
    instructions: 'Envía el pago al número 300XXXXXXX.',
  },
  {
    key: 'transfer',
    label: 'Transferencia',
    icon: 'swap_horiz',
    instructions: 'Cuenta bancaria: XXXX-XXXX-XXXX. Referencia: tu placa.',
  },
]

export function ManualPaymentButton({
  vehicleId,
  reservationId,
  amount = 0,
  className = '',
}: ManualPaymentButtonProps) {
  const [showModal, setShowModal] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState<ManualMethod | null>(null)
  const [proofReference, setProofReference] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = useCallback(async () => {
    if (!selectedMethod || !vehicleId) return

    setIsSubmitting(true)
    try {
      await createPaymentService({
        vehicle: vehicleId,
        reservation: reservationId,
        amount,
        method: selectedMethod,
        manualPaymentProof: proofReference || undefined,
      } as Parameters<typeof createPaymentService>[0] & { manualPaymentProof?: string })

      showSuccessToast('Pago registrado. Espera confirmación del operador.')
      setShowModal(false)
      setSelectedMethod(null)
      setProofReference('')
    } catch {
      showErrorToast('Error al registrar el pago')
    } finally {
      setIsSubmitting(false)
    }
  }, [selectedMethod, vehicleId, reservationId, amount, proofReference])

  const selectedInfo = METHOD_OPTIONS.find((m) => m.key === selectedMethod)

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setShowModal(true)}
        className={className}
      >
        <span className="material-symbols-outlined text-base">swap_horiz</span>
        Pago manual
      </Button>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Pago Manual">
        <div className="space-y-4">
          {/* Method selection */}
          <div>
            <label className="block text-xs font-semibold text-on-surface-var uppercase tracking-wider mb-2">
              Método de pago
            </label>
            <div className="grid grid-cols-3 gap-2">
              {METHOD_OPTIONS.map((m) => (
                <button
                  key={m.key}
                  onClick={() => setSelectedMethod(m.key)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-colors ${
                    selectedMethod === m.key
                      ? 'bg-primary/15 text-primary ring-2 ring-primary'
                      : 'bg-surface-container text-on-surface-var hover:bg-surface-container/80'
                  }`}
                >
                  <span className="material-symbols-outlined text-xl">{m.icon}</span>
                  <span className="text-xs font-semibold">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Instructions */}
          {selectedInfo && (
            <div className="p-3 rounded-lg bg-surface-container/50 text-sm text-on-surface-var">
              <span className="material-symbols-outlined text-base align-text-bottom mr-1">info</span>
              {selectedInfo.instructions}
            </div>
          )}

          {/* Proof reference input */}
          {selectedMethod && (
            <div>
              <label className="block text-xs font-semibold text-on-surface-var uppercase tracking-wider mb-1">
                Número de comprobante (opcional)
              </label>
              <input
                type="text"
                value={proofReference}
                onChange={(e) => setProofReference(e.target.value)}
                placeholder="Ej: 123456789"
                className="w-full px-3 py-2 rounded-lg border border-outline bg-surface-container text-on-bg text-sm focus:outline-none focus:border-primary"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSubmit}
              loading={isSubmitting}
              disabled={!selectedMethod || isSubmitting}
            >
              Registrar pago
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
