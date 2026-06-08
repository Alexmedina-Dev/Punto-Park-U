import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Layout } from '@/components/layout'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/stores/authStore'

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [confirmError, setConfirmError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [tokenMissing, setTokenMissing] = useState(false)

  const { resetPassword, isLoading, error, clearError } = useAuthStore()

  useEffect(() => {
    if (!token) {
      setTokenMissing(true)
    }
  }, [token])

  const validate = () => {
    let valid = true

    if (!password || password.length < 6) {
      setPasswordError('La contraseña debe tener al menos 8 caracteres')
      valid = false
    } else {
      setPasswordError('')
    }

    if (password !== confirmPassword) {
      setConfirmError('Las contraseñas no coinciden')
      valid = false
    } else {
      setConfirmError('')
    }

    return valid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    if (!validate()) return

    const result = await resetPassword(token, password)
    if (result.success) {
      setSubmitted(true)
      setTimeout(() => {
        navigate('/login', { replace: true })
      }, 3000)
    }
  }

  if (tokenMissing) {
    return (
      <Layout>
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8">
          <Card variant="glass" className="w-full max-w-md">
            <h1 className="text-3xl font-bold text-primary mb-6 text-center font-headline">
              Enlace Inválido
            </h1>
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400 text-center">
              El enlace de restablecimiento no es válido o falta el token de seguridad.
            </div>
            <a
              href="/forgot-password"
              className="block text-center text-primary hover:text-primary-fixed transition-colors text-sm"
            >
              Solicitar un nuevo enlace
            </a>
          </Card>
        </div>
      </Layout>
    )
  }

  if (submitted) {
    return (
      <Layout>
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8">
          <Card variant="glass" className="w-full max-w-md">
            <h1 className="text-3xl font-bold text-primary mb-6 text-center font-headline">
              Contraseña Restablecida
            </h1>
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-sm text-green-400 text-center">
              Tu contraseña ha sido restablecida exitosamente.
            </div>
            <p className="text-sm text-on-surface-var text-center">
              Serás redirigido a la página de inicio de sesión en unos segundos...
            </p>
          </Card>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8">
        <Card variant="glass" className="w-full max-w-md">
          <h1 className="text-3xl font-bold text-primary mb-2 text-center font-headline">
            Restablecer Contraseña
          </h1>
          <p className="text-sm text-on-surface-var text-center mb-6">
            Ingresa tu nueva contraseña.
          </p>

          {/* Server error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nueva Contraseña"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (passwordError) setPasswordError('')
              }}
              placeholder="Ingresa tu nueva contraseña"
              error={passwordError}
              icon="lock"
              showPasswordToggle
              data-testid="reset-password-input"
            />

            <Input
              label="Confirmar Contraseña"
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value)
                if (confirmError) setConfirmError('')
              }}
              placeholder="Confirma tu nueva contraseña"
              error={confirmError}
              icon="lock"
              showPasswordToggle
              data-testid="reset-password-confirm"
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              loading={isLoading}
              data-testid="reset-password-submit"
            >
              {isLoading ? 'Restableciendo...' : 'Restablecer Contraseña'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-on-surface-var">
            <a
              href="/login"
              className="text-primary hover:text-primary-fixed transition-colors"
            >
              Volver a Iniciar Sesión
            </a>
          </p>
        </Card>
      </div>
    </Layout>
  )
}
