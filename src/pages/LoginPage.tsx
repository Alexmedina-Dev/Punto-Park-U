import { useState } from 'react'
import { Layout } from '@/components/layout'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'

export function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({})
  const { login, isLoading, error, clearError } = useAuth()

  const validate = () => {
    const newErrors: { username?: string; password?: string } = {}
    if (username.length < 3) {
      newErrors.username = 'El usuario debe tener al menos 3 caracteres'
    }
    if (password.length < 8) {
      newErrors.password = 'La contraseña debe tener al menos 8 caracteres'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    if (!validate()) return
    await login(username, password)
  }

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value)
    if (errors.username) {
      setErrors((prev) => ({ ...prev, username: undefined }))
    }
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value)
    if (errors.password) {
      setErrors((prev) => ({ ...prev, password: undefined }))
    }
  }

  return (
    <Layout>
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8">
        <Card variant="glass" className="w-full max-w-md">
          <h1 className="text-3xl font-bold text-primary mb-6 text-center font-headline">
            Iniciar Sesión
          </h1>

          {/* Server error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Usuario"
              type="text"
              value={username}
              onChange={handleUsernameChange}
              placeholder="Ingresa tu usuario"
              error={errors.username}
              icon="person"
              data-testid="login-username"
            />

            <Input
              label="Contraseña"
              type="password"
              value={password}
              onChange={handlePasswordChange}
              placeholder="Ingresa tu contraseña"
              error={errors.password}
              icon="lock"
              showPasswordToggle
              data-testid="login-password"
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              loading={isLoading}
              data-testid="login-submit"
            >
              {isLoading ? 'Ingresando...' : 'Ingresar'}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-on-surface-var">
            ¿No tienes cuenta?{' '}
            <a
              href="/register"
              className="text-primary hover:text-primary-fixed transition-colors"
            >
              Regístrate
            </a>
          </p>
        </Card>
      </div>
    </Layout>
  )
}
