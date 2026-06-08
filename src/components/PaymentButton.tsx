import { useState, useCallback } from 'react'
import { Button } from '@/components/ui'
import { createEpaycoCheckoutService } from '@/services/payment.service'
import { showErrorToast } from '@/utils/errorHandler'

interface PaymentButtonProps {
  /** Amount to charge in COP */
  amount: number
  /** Vehicle ID to associate payment with */
  vehicleId: string
  /** Optional reservation ID */
  reservationId?: string
  /** Customer email for ePayco receipt */
  email?: string
  /** Called when checkout URL is ready (before redirect) */
  onCheckoutCreated?: (url: string, ref: string) => void
  /** Called when an error occurs */
  onError?: (error: string) => void
  /** Optional CSS class overrides */
  className?: string
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'ghost'
  /** Button size */
  size?: 'sm' | 'md' | 'lg'
  /** Disable the button */
  disabled?: boolean
  /** Label override */
  label?: string
}

/**
 * PaymentButton — Triggers ePayco checkout flow.
 *
 * When clicked, it:
 * 1. Calls the backend to create an ePayco checkout session
 * 2. Redirects the user to the ePayco sandbox hosted page
 * 3. The user completes payment on ePayco
 * 4. ePayco sends a webhook back to our backend
 * 5. The frontend detects the status via WebSocket or polling
 *
 * Handles loading state, errors, and disabled states.
 */
export function PaymentButton({
  amount,
  vehicleId,
  reservationId,
  email,
  onCheckoutCreated,
  onError,
  className = '',
  variant = 'primary',
  size = 'md',
  disabled = false,
  label = 'Pagar con ePayco',
}: PaymentButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handlePayment = useCallback(async () => {
    if (isLoading || disabled) return

    setIsLoading(true)
    try {
      const result = await createEpaycoCheckoutService({
        vehicle: vehicleId,
        reservation: reservationId,
        amount,
        email,
      })

      onCheckoutCreated?.(result.checkoutUrl, result.ref)

      // Redirect to ePayco hosted checkout page
      window.location.href = result.checkoutUrl
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al iniciar el pago'
      showErrorToast(error)
      onError?.(message)
    } finally {
      setIsLoading(false)
    }
  }, [amount, vehicleId, reservationId, email, isLoading, disabled, onCheckoutCreated, onError])

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handlePayment}
      loading={isLoading}
      disabled={disabled || isLoading}
      className={className}
    >
      {!isLoading && (
        <span className="material-symbols-outlined text-base">account_balance</span>
      )}
      {label}
    </Button>
  )
}
