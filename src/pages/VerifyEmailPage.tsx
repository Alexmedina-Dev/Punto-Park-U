import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Layout } from '@/components/layout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { verifyEmailService, resendVerificationService } from '@/services/auth.service'
import { ROUTES } from '@/utils/constants'

type VerifyStatus = 'loading' | 'success' | 'error' | 'idle'

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [status, setStatus] = useState<VerifyStatus>(token ? 'loading' : 'idle')
  const [message, setMessage] = useState('')
  const [resendEmail, setResendEmail] = useState('')
  const [resendStatus, setResendStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')
  const [resendMessage, setResendMessage] = useState('')

  // Verify token on mount if present
  useEffect(() => {
    if (!token) return

    const verifyToken = async () => {
      try {
        const result = await verifyEmailService(token)
        setStatus('success')
        setMessage(result.message || '¡Email verificado exitosamente!')
      } catch (err) {
        setStatus('error')
        const errorMsg =
          err && typeof err === 'object' && 'response' in err
            ? (err as { response?: { data?: { error?: string } } }).response?.data?.error ||
              'Error al verificar el email'
            : 'Error al verificar el email'
        setMessage(errorMsg)
      }
    }

    verifyToken()
  }, [token])

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resendEmail) return

    setResendStatus('loading')
    setResendMessage('')

    try {
      const result = await resendVerificationService(resendEmail)
      setResendStatus('sent')
      setResendMessage(result.message || 'Si existe una cuenta con ese email, se ha enviado un link de verificación.')
    } catch (err) {
      setResendStatus('error')
      const errorMsg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error ||
            'Error al reenviar la verificación'
          : 'Error al reenviar la verificación'
      setResendMessage(errorMsg)
    }
  }

  return (
    <Layout>
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8">
        <Card variant="glass" className="w-full max-w-md text-center">
          {/* Verifying token */}
          {status === 'loading' && (
            <div className="py-8">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-primary mb-2 font-headline">
                Verificando email...
              </h1>
              <p className="text-on-surface-var">Por favor espera mientras verificamos tu email.</p>
            </div>
          )}

          {/* Token verified successfully */}
          {status === 'success' && (
            <div className="py-8">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl text-green-400">✓</span>
              </div>
              <h1 className="text-2xl font-bold text-green-400 mb-2 font-headline">
                ¡Email Verificado!
              </h1>
              <p className="text-on-surface-var mb-6">{message}</p>
              <Link to={ROUTES.LOGIN}>
                <Button variant="primary" className="w-full">
                  Ir a Iniciar Sesión
                </Button>
              </Link>
            </div>
          )}

          {/* Invalid/expired token */}
          {status === 'error' && (
            <div className="py-8">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl text-red-400">✕</span>
              </div>
              <h1 className="text-2xl font-bold text-red-400 mb-2 font-headline">
                Error de Verificación
              </h1>
              <p className="text-on-surface-var mb-6">{message}</p>
              <p className="text-sm text-on-surface-var mb-4">
                Puedes solicitar un nuevo link de verificación ingresando tu email:
              </p>

              <form onSubmit={handleResend} className="space-y-4">
                <Input
                  label="Email"
                  type="email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="tu@email.com"
                  icon="mail"
                />

                {resendMessage && (
                  <div
                    className={`p-3 rounded-lg text-sm text-center ${
                      resendStatus === 'sent'
                        ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                        : 'bg-red-500/10 border border-red-500/30 text-red-400'
                    }`}
                  >
                    {resendMessage}
                  </div>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  loading={resendStatus === 'loading'}
                >
                  {resendStatus === 'loading' ? 'Enviando...' : 'Reenviar Verificación'}
                </Button>
              </form>

              <div className="mt-4">
                <Link
                  to={ROUTES.LOGIN}
                  className="text-sm text-primary hover:text-primary-fixed transition-colors"
                >
                  Volver a Iniciar Sesión
                </Link>
              </div>
            </div>
          )}

          {/* No token — show resend form */}
          {status === 'idle' && (
            <div className="py-8">
              <h1 className="text-2xl font-bold text-primary mb-2 font-headline">
                Verificar Email
              </h1>
              <p className="text-on-surface-var mb-6">
                Ingresa tu email para recibir un link de verificación.
              </p>

              <form onSubmit={handleResend} className="space-y-4">
                <Input
                  label="Email"
                  type="email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="tu@email.com"
                  icon="mail"
                />

                {resendMessage && (
                  <div
                    className={`p-3 rounded-lg text-sm text-center ${
                      resendStatus === 'sent'
                        ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                        : 'bg-red-500/10 border border-red-500/30 text-red-400'
                    }`}
                  >
                    {resendMessage}
                  </div>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  loading={resendStatus === 'loading'}
                >
                  {resendStatus === 'loading' ? 'Enviando...' : 'Enviar Verificación'}
                </Button>
              </form>

              <div className="mt-4">
                <Link
                  to={ROUTES.LOGIN}
                  className="text-sm text-primary hover:text-primary-fixed transition-colors"
                >
                  Volver a Iniciar Sesión
                </Link>
              </div>
            </div>
          )}
        </Card>
      </div>
    </Layout>
  )
}
