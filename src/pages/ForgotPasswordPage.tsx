import { useState } from 'react'
import { Layout } from '@/components/layout'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/stores/authStore'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const { forgotPassword, isLoading, error, clearError } = useAuthStore()

  const validate = () => {
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setEmailError('Ingresa un correo electrónico válido')
      return false
    }
    setEmailError('')
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    if (!validate()) return

    const result = await forgotPassword(email)
    if (result.success) {
      setSubmitted(true)
    }
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
    if (emailError) {
      setEmailError('')
    }
  }

  if (submitted) {
    return (
      <Layout>
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8">
          <Card variant="glass" className="w-full max-w-md">
            <h1 className="text-3xl font-bold text-primary mb-6 text-center font-headline">
              Correo Enviado
            </h1>
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-sm text-green-400 text-center">
              Si existe una cuenta con ese correo electrónico, recibirás un enlace para restablecer tu contraseña.
            </div>
            <p className="text-sm text-on-surface-var text-center mb-6">
              Revisa tu bandeja de entrada. Si no ves el correo, revisa la carpeta de spam.
              <br />
              <span className="block mt-2 text-xs opacity-70">
                (Modo simulación: el token se muestra en la consola del servidor)
              </span>
            </p>
            <a
              href="/login"
              className="block text-center text-primary hover:text-primary-fixed transition-colors text-sm"
            >
              Volver a Iniciar Sesión
            </a>
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
            ¿Olvidaste tu Contraseña?
          </h1>
          <p className="text-sm text-on-surface-var text-center mb-6">
            Ingresa tu correo electrónico y te enviaremos un enlace para restablecerla.
          </p>

          {/* Server error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Correo Electrónico"
              type="email"
              value={email}
              onChange={handleEmailChange}
              placeholder="Ingresa tu correo electrónico"
              error={emailError}
              icon="email"
              data-testid="forgot-password-email"
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              loading={isLoading}
              data-testid="forgot-password-submit"
            >
              {isLoading ? 'Enviando...' : 'Enviar Enlace'}
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
