import { useState, useCallback } from 'react'
import { Card, Button, Badge, Modal } from '@/components/ui'
import { QRScanner } from '@/components/QRScanner'
import { QRDisplay } from '@/components/QRDisplay'
import { validateQRService, processExitService } from '@/services/qr.service'
import { showSuccessToast, showErrorToast } from '@/utils/errorHandler'
import type { QRValidationResult } from '@/types'

type ValidatorMode = 'entry' | 'exit'

interface QRValidatorProps {
  mode: ValidatorMode
  title?: string
  description?: string
}

export function QRValidator({ mode, title, description }: QRValidatorProps) {
  const [scanned, setScanned] = useState<QRValidationResult | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [showQR, setShowQR] = useState<{
    reservationId: string
    plate: string
    status: string
  } | null>(null)

  // ── Handle scan ──────────────────────────────────────────────────
  const handleScan = useCallback(async (decodedText: string) => {
    setIsProcessing(true)
    try {
      if (mode === 'entry') {
        const result = await validateQRService(decodedText)
        setScanned(result)
        setShowResult(true)
        showSuccessToast(`Entrada registrada: ${result.plate} — Espacio ${result.spot}`)
      } else {
        const result = await processExitService(decodedText)
        setScanned(result)
        setShowResult(true)
        showSuccessToast(
          `Salida procesada: ${result.plate} — Facturado $${result.billingAmount?.toLocaleString()}`
        )
      }
    } catch (err) {
      showErrorToast(err)
      setScanned(null)
    } finally {
      setIsProcessing(false)
    }
  }, [mode])

  // ── Handle manual input ──────────────────────────────────────────
  const [manualInput, setManualInput] = useState('')
  const [showManual, setShowManual] = useState(false)

  const handleManualSubmit = async () => {
    if (!manualInput.trim()) return
    setIsProcessing(true)
    try {
      if (mode === 'entry') {
        const result = await validateQRService(manualInput.trim())
        setScanned(result)
        setShowResult(true)
        showSuccessToast(`Entrada registrada: ${result.plate}`)
      } else {
        const result = await processExitService(manualInput.trim())
        setScanned(result)
        setShowResult(true)
        showSuccessToast(`Salida procesada: ${result.plate}`)
      }
      setManualInput('')
      setShowManual(false)
    } catch (err) {
      showErrorToast(err)
    } finally {
      setIsProcessing(false)
    }
  }

  // ── Clear result ─────────────────────────────────────────────────
  const handleClear = useCallback(() => {
    setScanned(null)
    setShowResult(false)
  }, [])

  // ── Generate QR for a reservation ────────────────────────────────
  const [generateId, setGenerateId] = useState('')
  const [showGenerate, setShowGenerate] = useState(false)

  const handleGenerateQR = () => {
    if (!generateId.trim()) return
    setShowQR({
      reservationId: generateId.trim(),
      plate: '—',
      status: 'pending',
    })
    setGenerateId('')
    setShowGenerate(false)
  }

  const modeLabel = mode === 'entry' ? 'Entrada' : 'Salida'
  const modeIcon = mode === 'entry' ? 'login' : 'logout'

  return (
    <div className="space-y-4">
      {/* Mode Header */}
      <div className="flex items-center gap-2 mb-2">
        <span className={`material-symbols-outlined ${mode === 'entry' ? 'text-green-400' : 'text-orange-400'}`}>
          {modeIcon}
        </span>
        <h3 className="text-lg font-bold text-primary font-headline">
          {title || `Validación de ${modeLabel} — QR`}
        </h3>
      </div>

      {/* Scanner */}
      <QRScanner
        onScan={handleScan}
        title={description || `Escanea QR para registrar ${modeLabel}`}
        description={`Apunta la cámara al código QR del vehículo para registrar su ${modeLabel}`}
        isProcessing={isProcessing}
      />

      {/* Manual Input Toggle */}
      <div className="text-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowManual(!showManual)}
        >
          <span className="material-symbols-outlined text-sm">keyboard</span>
          {showManual ? 'Ocultar entrada manual' : 'Ingresar QR manualmente'}
        </Button>
      </div>

      {/* Manual Input */}
      {showManual && (
        <Card variant="glass" padding="sm">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="Pega el contenido del código QR aquí..."
              className="flex-1 px-3 py-2 rounded-lg bg-surface-high/50 border border-outline/20 text-sm text-on-bg placeholder-on-surface-var/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <Button
              variant="primary"
              size="sm"
              onClick={handleManualSubmit}
              loading={isProcessing}
              disabled={!manualInput.trim()}
            >
              Validar
            </Button>
          </div>
        </Card>
      )}

      {/* Result Modal */}
      <Modal
        open={showResult}
        onClose={handleClear}
        title={`Resultado de ${modeLabel}`}
      >
        {scanned && (
          <div className="space-y-4">
            <div className="flex items-center justify-center">
              <Badge
                variant={
                  mode === 'entry'
                    ? 'success'
                    : scanned.billingAmount
                      ? 'success'
                      : 'info'
                }
              >
                {mode === 'entry' ? 'ENTRADA REGISTRADA' : 'SALIDA PROCESADA'}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 rounded-lg bg-surface-high/30">
                <p className="text-on-surface-var text-xs">Placa</p>
                <p className="font-bold text-on-bg">{scanned.plate}</p>
              </div>
              <div className="p-3 rounded-lg bg-surface-high/30">
                <p className="text-on-surface-var text-xs">Espacio</p>
                <p className="font-bold text-on-bg">{scanned.spot || '—'}</p>
              </div>
              {mode === 'entry' && scanned.entryTime && (
                <div className="p-3 rounded-lg bg-surface-high/30 col-span-2">
                  <p className="text-on-surface-var text-xs">Hora de Ingreso</p>
                  <p className="font-bold text-on-bg">
                    {new Date(scanned.entryTime).toLocaleTimeString('es-CO', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              )}
              {mode === 'exit' && scanned.duration && (
                <div className="p-3 rounded-lg bg-surface-high/30">
                  <p className="text-on-surface-var text-xs">Duración</p>
                  <p className="font-bold text-on-bg">{scanned.duration}</p>
                </div>
              )}
              {mode === 'exit' && scanned.billingAmount !== undefined && (
                <div className="p-3 rounded-lg bg-surface-high/30">
                  <p className="text-on-surface-var text-xs">Total Facturado</p>
                  <p className="font-bold text-lg text-primary">
                    ${scanned.billingAmount.toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-center pt-2">
              <Button variant="primary" onClick={handleClear}>
                <span className="material-symbols-outlined text-sm">qr_code_scanner</span>
                Escanear otro
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Generate QR section */}
      <div className="pt-4 border-t border-outline/10">
        <details className="group">
          <summary className="flex items-center gap-2 cursor-pointer text-sm text-on-surface-var hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-sm">add</span>
            Generar QR para una reserva
          </summary>
          <div className="mt-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={generateId}
                onChange={(e) => setGenerateId(e.target.value)}
                placeholder="ID de la reserva..."
                className="flex-1 px-3 py-2 rounded-lg bg-surface-high/50 border border-outline/20 text-sm text-on-bg placeholder-on-surface-var/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={handleGenerateQR}
                disabled={!generateId.trim()}
              >
                Generar QR
              </Button>
            </div>
          </div>
        </details>
      </div>

      {/* QR Display Modal */}
      {showQR && (
        <Modal
          open={!!showQR}
          onClose={() => setShowQR(null)}
          title="Código QR de Acceso"
        >
          <QRDisplay
            reservationId={showQR.reservationId}
            plate={showQR.plate}
            status={showQR.status}
            onClose={() => setShowQR(null)}
          />
        </Modal>
      )}
    </div>
  )
}
