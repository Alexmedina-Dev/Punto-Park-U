import { useEffect, useRef, useState, useCallback } from 'react'
import { Card, Button, Badge } from '@/components/ui'
import { showErrorToast, showSuccessToast } from '@/utils/errorHandler'

interface QRScannerProps {
  onScan: (decodedText: string) => void | Promise<void>
  onError?: (error: string) => void
  title?: string
  description?: string
  isProcessing?: boolean
}

export function QRScanner({
  onScan,
  onError,
  title = 'Escanear Código QR',
  description = 'Apunta la cámara al código QR',
  isProcessing = false,
}: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [hasCamera, setHasCamera] = useState(false)
  const scannerRef = useRef<{ stop: () => Promise<void> } | null>(null)
  const mountedRef = useRef(true)

  // ── Check camera availability ────────────────────────────────────
  const checkCamera = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const hasVideo = devices.some((d) => d.kind === 'videoinput')
      setHasCamera(hasVideo)
      return hasVideo
    } catch {
      setHasCamera(false)
      return false
    }
  }, [])

  // ── Start scanning using native MediaDevices + canvas ─────────────
  const startScanning = useCallback(async () => {
    setCameraError(null)
    const available = await checkCamera()
    if (!available) {
      const errMsg = 'No se encontró ninguna cámara disponible'
      setCameraError(errMsg)
      onError?.(errMsg)
      return
    }

    try {
      // Dynamic import of html5-qrcode
      const { Html5Qrcode } = await import('html5-qrcode')

      const scannerId = 'qr-scanner-element'
      // Create a placeholder element if not exists
      let scannerEl = document.getElementById(scannerId) as HTMLDivElement | null
      if (!scannerEl) {
        scannerEl = document.createElement('div')
        scannerEl.id = scannerId
        scannerEl.style.display = 'none'
        document.body.appendChild(scannerEl)
      }

      const html5QrCode = new Html5Qrcode(scannerId)
      scannerRef.current = {
        stop: async () => {
          try {
            await html5QrCode.stop()
          } catch {
            // Already stopped
          }
        },
      }

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText) => {
          // Pause scanning while processing
          if (isProcessing) return
          try {
            await html5QrCode.pause()
            setIsScanning(false)
            await onScan(decodedText)
          } catch {
            // If handler fails, resume scanning
            try { await html5QrCode.resume() } catch { /* ignore */ }
            setIsScanning(true)
          }
        },
        () => {
          // No-op on no-match frames
        }
      )

      setIsScanning(true)
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Error al acceder a la cámara'
      setCameraError(errMsg)
      onError?.(errMsg)
      setIsScanning(false)
    }
  }, [onScan, onError, checkCamera, isProcessing])

  // ── Stop scanning ────────────────────────────────────────────────
  const stopScanning = useCallback(async () => {
    if (scannerRef.current) {
      await scannerRef.current.stop()
      scannerRef.current = null
    }
    setIsScanning(false)
    // Clean up placeholder
    const scannerEl = document.getElementById('qr-scanner-element')
    if (scannerEl) {
      scannerEl.remove()
    }
  }, [])

  // ── Resume scanning after processing ─────────────────────────────
  const resumeScanning = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const { Html5Qrcode } = await import('html5-qrcode')
        // We need to restart since stop/resume with Html5Qrcode is tricky
        await stopScanning()
        await startScanning()
      } catch {
        // If restart fails, just restart
        await startScanning()
      }
    }
  }, [startScanning, stopScanning])

  // Expose resume to parent via effect when isProcessing changes
  useEffect(() => {
    if (!isProcessing && isScanning === false && scannerRef.current) {
      // Was scanning, now done processing — allow parent to trigger resume
    }
  }, [isProcessing, isScanning])

  // ── Cleanup on unmount ───────────────────────────────────────────
  useEffect(() => {
    return () => {
      mountedRef.current = false
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {})
        scannerRef.current = null
      }
      const scannerEl = document.getElementById('qr-scanner-element')
      if (scannerEl) {
        scannerEl.remove()
      }
    }
  }, [])

  return (
    <Card variant="glass" padding="md">
      <div className="text-center">
        {/* Title */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="material-symbols-outlined text-primary">qr_code_scanner</span>
          <h3 className="text-lg font-bold text-primary font-headline">{title}</h3>
        </div>
        <p className="text-sm text-on-surface-var mb-4">{description}</p>

        {/* Camera error */}
        {cameraError && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <div className="flex items-center gap-2 justify-center">
              <span className="material-symbols-outlined text-red-400 text-sm">warning</span>
              <p className="text-sm text-red-400">{cameraError}</p>
            </div>
          </div>
        )}

        {/* Video container */}
        <div
          id="qr-reader"
          className={`mx-auto mb-4 rounded-lg overflow-hidden border border-outline/20 transition-all ${
            isScanning ? 'ring-2 ring-primary/50' : ''
          }`}
          style={{ maxWidth: '320px', minHeight: '240px' }}
        >
          {/* html5-qrcode renders its own viewfinder here */}
          {!isScanning && !cameraError && (
            <div className="flex items-center justify-center h-60 bg-surface-high/30">
              <div className="text-center">
                <span className="material-symbols-outlined text-4xl text-on-surface-var/50 block mb-2">
                  camera_alt
                </span>
                <p className="text-sm text-on-surface-var/50">
                  {hasCamera ? 'Presiona "Iniciar" para escanear' : 'Cámara no disponible'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Status */}
        {isScanning && (
          <div className="mb-3">
            <Badge variant="success">Escaneando...</Badge>
          </div>
        )}

        {isProcessing && (
          <div className="mb-3">
            <div className="flex items-center justify-center gap-2">
              <span className="inline-block w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-on-surface-var">Procesando...</span>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          {!isScanning && hasCamera && (
            <Button variant="primary" size="sm" onClick={startScanning}>
              <span className="material-symbols-outlined text-sm">videocam</span>
              Iniciar Escáner
            </Button>
          )}
          {isScanning && (
            <Button variant="ghost" size="sm" onClick={stopScanning}>
              <span className="material-symbols-outlined text-sm">stop</span>
              Detener
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
