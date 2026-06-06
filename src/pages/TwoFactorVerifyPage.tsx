import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '@/components/layout'
import { Card, Button, Input } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/stores/authStore'
import { showErrorToast, showSuccessToast } from '@/utils/errorHandler'
import { verify2FAService, verifyBackupCodeService } from '@/services/auth.service'

export function TwoFactorVerifyPage() {
  const navigate = useNavigate()
  const { tempToken } = useAuth()
  const store = useAuthStore()
  const [totpCode, setTotpCode] = useState('')
  const [backupCode, setBackupCode] = useState('')
  const [useBackup, setUseBackup] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Redirect if no tempToken
  useEffect(() => {
    if (!tempToken) {
      navigate('/login', { replace: true })
    }
  }, [tempToken, navigate])

  const handleVerifyTOTP = async () => {
    if (!totpCode || totpCode.length < 6) {
      setError('Ingresa un código TOTP válido de 6 dígitos')
      return
    }
    setIsLoading(true)
    setError('')
    try {
      const data = await verify2FAService(tempToken!, totpCode)
      store.complete2FALogin(data.user, data.token, data.refreshToken)
      showSuccessToast('¡Bienvenido!')
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Código inválido. Intenta de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyBackup = async () => {
    if (!backupCode || backupCode.length < 8) {
      setError('Ingresa un código de respaldo válido')
      return
    }
    setIsLoading(true)
    setError('')
    try {
      const data = await verifyBackupCodeService(tempToken!, backupCode)
      store.complete2FALogin(data.user, data.token, data.refreshToken)
      showSuccessToast('¡Bienvenido!')
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Código de respaldo inválido')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    store.clearTwoFactorState()
    navigate('/login', { replace: true })
  }

  return (
    <Layout>
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8">
        <Card variant="glass" className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-primary text-3xl">
              security
            </span>
            <div>
              <h1 className="text-2xl font-bold text-primary font-headline">
                Verificación en Dos Pasos
              </h1>
              <p className="text-sm text-on-surface-var">
                Ingresa el código de tu aplicación de autenticación
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400 text-center">
              {error}
            </div>
          )}

          {!useBackup ? (
            <>
              <div className="space-y-4">
                <Input
                  label="Código de Autenticación"
                  type="text"
                  value={totpCode}
                  onChange={(e) => {
                    setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                    setError('')
                  }}
                  placeholder="000000"
                  maxLength={6}
                  icon="pin"
                />

                <Button
                  variant="primary"
                  className="w-full"
                  onClick={handleVerifyTOTP}
                  loading={isLoading}
                  disabled={totpCode.length < 6}
                >
                  Verificar
                </Button>
              </div>

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setUseBackup(true)
                    setError('')
                  }}
                  className="text-sm text-primary hover:text-primary-fixed transition-colors"
                >
                  Usar un código de respaldo
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-4">
                <p className="text-sm text-on-surface-var">
                  Ingresa uno de tus códigos de respaldo (formato: XXXX-XXXX-XXXX):
                </p>

                <Input
                  label="Código de Respaldo"
                  type="text"
                  value={backupCode}
                  onChange={(e) => {
                    setBackupCode(e.target.value.toUpperCase())
                    setError('')
                  }}
                  placeholder="ABCD-1234-EFGH"
                  icon="key"
                />

                <Button
                  variant="primary"
                  className="w-full"
                  onClick={handleVerifyBackup}
                  loading={isLoading}
                  disabled={backupCode.length < 8}
                >
                  Verificar Código de Respaldo
                </Button>
              </div>

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setUseBackup(false)
                    setError('')
                  }}
                  className="text-sm text-primary hover:text-primary-fixed transition-colors"
                >
                  Usar código de autenticación
                </button>
              </div>
            </>
          )}

          <div className="mt-6 pt-4 border-t border-outline/20 text-center">
            <button
              type="button"
              onClick={handleCancel}
              className="text-sm text-on-surface-var hover:text-on-bg transition-colors"
            >
              Volver al inicio de sesión
            </button>
          </div>
        </Card>
      </div>
    </Layout>
  )
}
