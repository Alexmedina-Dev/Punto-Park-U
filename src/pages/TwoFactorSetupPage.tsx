import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '@/components/layout'
import { Card, Button, Input } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { showErrorToast, showSuccessToast } from '@/utils/errorHandler'
import {
  setup2FAService,
  verifySetup2FAService,
  disable2FAService,
  generateBackupCodesService,
} from '@/services/auth.service'

type SetupStep = 'intro' | 'scan' | 'verify' | 'codes' | 'done'

export function TwoFactorSetupPage() {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const [step, setStep] = useState<SetupStep>('intro')
  const [qrCode, setQrCode] = useState('')
  const [secret, setSecret] = useState('')
  const [token, setToken] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [showCodes, setShowCodes] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const handleStartSetup = async () => {
    setIsLoading(true)
    setError('')
    try {
      const data = await setup2FAService()
      setQrCode(data.qrCode)
      setSecret(data.secret)
      setStep('scan')
    } catch (err) {
      showErrorToast(err)
      setError(err instanceof Error ? err.message : 'Error al iniciar configuración')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyToken = async () => {
    if (!token || token.length < 6) {
      setError('Ingresa un código TOTP válido de 6 dígitos')
      return
    }
    setIsLoading(true)
    setError('')
    try {
      const data = await verifySetup2FAService(token)
      setBackupCodes(data.backupCodes)
      setStep('codes')
      showSuccessToast('2FA activado exitosamente')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Código inválido. Intenta de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisable = async () => {
    const password = prompt('Ingresa tu contraseña para deshabilitar 2FA:')
    if (!password) return

    setIsLoading(true)
    setError('')
    try {
      await disable2FAService(password)
      showSuccessToast('2FA deshabilitado')
      navigate('/dashboard', { replace: true })
    } catch (err) {
      showErrorToast(err)
      setError(err instanceof Error ? err.message : 'Error al deshabilitar 2FA')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegenerateCodes = async () => {
    setIsLoading(true)
    setError('')
    try {
      const data = await generateBackupCodesService()
      setBackupCodes(data.backupCodes)
      setShowCodes(true)
      showSuccessToast('Nuevos códigos de respaldo generados')
    } catch (err) {
      showErrorToast(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDone = () => {
    navigate('/dashboard', { replace: true })
  }

  const copyCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'))
    showSuccessToast('Códigos copiados al portapapeles')
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-primary font-headline mb-6">
          Autenticación de Dos Factores (2FA)
        </h1>

        {/* Intro Step */}
        {step === 'intro' && (
          <Card variant="glass">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary text-2xl">security</span>
                <div>
                  <h3 className="text-lg font-bold text-on-bg mb-2">¿Qué es 2FA?</h3>
                  <p className="text-on-surface-var text-sm leading-relaxed">
                    La autenticación de dos factores añade una capa extra de seguridad a tu cuenta.
                    Además de tu contraseña, necesitarás un código temporal generado por una
                    aplicación de autenticación en tu teléfono.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary text-2xl">
                  smartphone
                </span>
                <div>
                  <h3 className="text-lg font-bold text-on-bg mb-2">App Recomendada</h3>
                  <p className="text-on-surface-var text-sm leading-relaxed">
                    Necesitarás una aplicación como{' '}
                    <strong>Google Authenticator</strong>,{' '}
                    <strong>Microsoft Authenticator</strong>, o{' '}
                    <strong>Authy</strong>.
                  </p>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button variant="primary" onClick={handleStartSetup} loading={isLoading}>
                  Configurar 2FA
                </Button>
                <Button variant="ghost" onClick={() => navigate('/dashboard')}>
                  Cancelar
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Scan QR Step */}
        {step === 'scan' && (
          <div className="space-y-4">
            <Card variant="glass">
              <h3 className="text-lg font-bold text-primary font-headline mb-4">
                Escanea el Código QR
            </h3>

              <div className="flex flex-col items-center gap-4">
                <div className="bg-white p-4 rounded-xl">
                  {qrCode ? (
                    <img
                      src={qrCode}
                      alt="Código QR para 2FA"
                      className="w-48 h-48"
                    />
                  ) : (
                    <div className="w-48 h-48 bg-surface-container animate-pulse rounded-lg" />
                  )}
                </div>

                <p className="text-sm text-on-surface-var text-center max-w-md">
                  Abre tu aplicación de autenticación y escanea este código QR.
                  Si no puedes escanearlo, ingresa manualmente la clave secreta.
                </p>

                <details className="text-sm text-on-surface-var w-full">
                  <summary className="cursor-pointer hover:text-on-bg transition-colors">
                    No puedo escanear el código
                  </summary>
                  <p className="mt-2 p-3 bg-surface-container rounded-lg font-mono text-xs break-all select-all">
                    {secret}
                  </p>
                </details>
              </div>
            </Card>

            <Card variant="glass">
              <h3 className="text-lg font-bold text-primary font-headline mb-4">
                Verifica el Código
              </h3>

              <p className="text-sm text-on-surface-var mb-4">
                Ingresa el código de 6 dígitos que aparece en tu aplicación de autenticación
                para confirmar que está configurada correctamente.
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
                  {error}
                </div>
              )}

              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <Input
                    label="Código TOTP"
                    type="text"
                    value={token}
                    onChange={(e) => {
                      setToken(e.target.value.replace(/\D/g, '').slice(0, 6))
                      setError('')
                    }}
                    placeholder="000000"
                    maxLength={6}
                    icon="pin"
                  />
                </div>
                <Button
                  variant="primary"
                  onClick={handleVerifyToken}
                  loading={isLoading}
                  disabled={token.length < 6}
                >
                  Verificar
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Backup Codes Step */}
        {step === 'codes' && (
          <div className="space-y-4">
            <Card variant="glass">
              <div className="flex items-start gap-3 mb-4">
                <span className="material-symbols-outlined text-warning text-2xl">
                  warning
                </span>
                <div>
                  <h3 className="text-lg font-bold text-on-bg mb-2">
                    Códigos de Respaldo
                  </h3>
                  <p className="text-on-surface-var text-sm leading-relaxed">
                    Guarda estos códigos en un lugar seguro. Cada código solo puede usarse
                    una vez. Si pierdes tu teléfono y estos códigos, perderás acceso a tu cuenta.
                  </p>
                </div>
              </div>

              {showCodes && (
                <div className="mb-4">
                  <div className="bg-surface-container p-4 rounded-lg font-mono text-sm space-y-2">
                    {backupCodes.map((code, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-on-surface-var w-6 text-right">{i + 1}.</span>
                        <span className="text-on-bg tracking-wider">{code}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button variant="secondary" size="sm" onClick={copyCodes}>
                      <span className="material-symbols-outlined text-sm">content_copy</span>
                      Copiar
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setShowCodes(false)}>
                      Ocultar códigos
                    </Button>
                  </div>
                </div>
              )}

              {!showCodes && (
                <p className="text-sm text-on-surface-var mb-4">
                  Los códigos han sido ocultados. Puedes regenerarlos desde la configuración de tu perfil.
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <Button variant="primary" onClick={handleDone}>
                  He guardado mis códigos
                </Button>
                <Button variant="secondary" onClick={handleRegenerateCodes} loading={isLoading}>
                  Regenerar códigos
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  )
}
