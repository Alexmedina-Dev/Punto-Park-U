import { useState, useEffect, useCallback } from 'react'
import { Card, Button, Badge } from '@/components/ui'
import { generateQRService, getQRTicketService } from '@/services/qr.service'
import { showErrorToast } from '@/utils/errorHandler'

interface QRDisplayProps {
  reservationId: string
  plate: string
  status: string
  onClose?: () => void
}

export function QRDisplay({ reservationId, plate, status, onClose }: QRDisplayProps) {
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isExpired, setIsExpired] = useState(false)

  // ── Load or generate QR ──────────────────────────────────────────
  const loadQR = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    setQrCode(null)
    setIsExpired(false)

    try {
      // Try to fetch existing QR first
      let ticket = await getQRTicketService(reservationId)
      setQrCode(ticket.qrCode)
    } catch {
      // Not found — generate a new one
      try {
        const ticket = await generateQRService(reservationId)
        setQrCode(ticket.qrCode)
      } catch (err) {
        setError('No se pudo generar el código QR')
        showErrorToast(err)
      }
    } finally {
      setIsLoading(false)
    }
  }, [reservationId])

  useEffect(() => {
    loadQR()
  }, [loadQR])

  // ── Auto-expire after 5 minutes ──────────────────────────────────
  useEffect(() => {
    if (qrCode) {
      const timer = setTimeout(() => {
        setIsExpired(true)
      }, 5 * 60 * 1000) // 5 minutes
      return () => clearTimeout(timer)
    }
  }, [qrCode])

  // ── Regenerate ───────────────────────────────────────────────────
  const handleRegenerate = async () => {
    setIsLoading(true)
    setError(null)
    setIsExpired(false)
    try {
      const ticket = await generateQRService(reservationId)
      setQrCode(ticket.qrCode)
    } catch (err) {
      setError('No se pudo regenerar el código QR')
      showErrorToast(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card variant="glass" padding="md" className="text-center">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-center gap-2 mb-1">
          <span className="material-symbols-outlined text-primary">qr_code_scanner</span>
          <h3 className="text-lg font-bold text-primary font-headline">Código QR</h3>
        </div>
        <p className="text-sm text-on-surface-var">
          Vehículo: <strong className="text-on-bg">{plate}</strong>
        </p>
        <div className="mt-1">
          <Badge variant={status === 'active' ? 'success' : status === 'pending' ? 'warning' : 'info'}>
            {status === 'active' ? 'Dentro' : status === 'pending' ? 'Pendiente' : status}
          </Badge>
        </div>
      </div>

      {/* QR Code */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <span className="inline-block w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error && !isLoading && (
        <div className="py-8">
          <span className="material-symbols-outlined text-4xl text-red-400 mb-2 block">error</span>
          <p className="text-sm text-red-400">{error}</p>
          <Button variant="primary" size="sm" className="mt-4" onClick={handleRegenerate}>
            Reintentar
          </Button>
        </div>
      )}

      {qrCode && !isLoading && (
        <div className="space-y-4">
          <div className="relative inline-block">
            <img
              src={qrCode}
              alt="QR de acceso"
              className={`w-48 h-48 mx-auto rounded-lg ${isExpired ? 'opacity-40 blur-sm' : ''}`}
            />
            {isExpired && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-surface/80 rounded-lg px-3 py-1">
                  <span className="text-xs font-bold text-yellow-400">EXPIRADO</span>
                </div>
              </div>
            )}
          </div>

          <p className="text-xs text-on-surface-var">
            {isExpired
              ? 'Este QR ha expirado. Regenera uno nuevo para ingresar.'
              : 'Escanea este código en la entrada del parqueadero'}
          </p>

          <div className="flex items-center justify-center gap-3">
            {isExpired && (
              <Button variant="primary" size="sm" onClick={handleRegenerate}>
                <span className="material-symbols-outlined text-sm">refresh</span>
                Regenerar QR
              </Button>
            )}
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                Cerrar
              </Button>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}
