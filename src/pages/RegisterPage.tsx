import { useState } from 'react'
import { Layout } from '@/components/layout'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { API_BASE_URL } from '@/utils/constants'

export function RegisterPage() {
  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    cedula: '',
    fechaNacimiento: '',
    username: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [googleLoading, setGoogleLoading] = useState(false)
  const { register, isLoading, error, clearError } = useAuth()

  const handleGoogleRegister = () => {
    setGoogleLoading(true)
    window.location.href = `${API_BASE_URL}/oauth/google`
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    // Clear error when user types
    if (errors[e.target.name]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[e.target.name]
        return next
      })
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (formData.nombres.length < 2) {
      newErrors.nombres = 'Debe tener al menos 2 caracteres'
    }
    if (formData.apellidos.length < 2) {
      newErrors.apellidos = 'Debe tener al menos 2 caracteres'
    }
    if (!/^\d{6,12}$/.test(formData.cedula)) {
      newErrors.cedula = 'Debe contener entre 6 y 12 números'
    }
    if (!formData.fechaNacimiento) {
      newErrors.fechaNacimiento = 'Debes ingresar una fecha de nacimiento'
    } else {
      const birthDate = new Date(formData.fechaNacimiento)
      const today = new Date()
      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }
      if (age < 18) {
        newErrors.fechaNacimiento = 'Debes ser mayor de 18 años'
      }
    }
    if (formData.username.length < 3) {
      newErrors.username = 'Debe tener al menos 3 caracteres'
    }
    if (formData.password.length < 8) {
      newErrors.password = 'Debe tener al menos 8 caracteres'
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    if (!validateForm()) return
    await register(formData)
  }

  return (
    <Layout>
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8">
        <Card variant="glass" className="w-full max-w-md">
          <h1 className="text-3xl font-bold text-primary mb-6 text-center font-headline">
            Registro
          </h1>

          {/* Server error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Nombres"
                name="nombres"
                value={formData.nombres}
                onChange={handleChange}
                placeholder="Nombres"
                error={errors.nombres}
                icon="badge"
              />
              <Input
                label="Apellidos"
                name="apellidos"
                value={formData.apellidos}
                onChange={handleChange}
                placeholder="Apellidos"
                error={errors.apellidos}
                icon="badge"
              />
            </div>

            <Input
              label="Cédula"
              name="cedula"
              value={formData.cedula}
              onChange={handleChange}
              placeholder="Número de cédula"
              error={errors.cedula}
              icon="credit_card"
            />

            <Input
              label="Fecha de Nacimiento"
              type="date"
              name="fechaNacimiento"
              value={formData.fechaNacimiento}
              onChange={handleChange}
              error={errors.fechaNacimiento}
              icon="calendar_month"
            />

            <Input
              label="Usuario"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Nombre de usuario"
              error={errors.username}
              icon="person"
            />

            <Input
              label="Contraseña"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Mínimo 8 caracteres"
              error={errors.password}
              icon="lock"
              showPasswordToggle
            />

            <Input
              label="Confirmar Contraseña"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Repite la contraseña"
              error={errors.confirmPassword}
              icon="lock"
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              loading={isLoading}
            >
              {isLoading ? 'Registrando...' : 'Registrarse'}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-outline/30" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-surface px-2 text-on-surface-var">O regístrate con</span>
            </div>
          </div>

          {/* Google OAuth button */}
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={handleGoogleRegister}
            loading={googleLoading}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {googleLoading ? 'Redirigiendo...' : 'Registrarse con Google'}
          </Button>

          <p className="mt-4 text-center text-sm text-on-surface-var">
            ¿Ya tienes cuenta?{' '}
            <a
              href="/login"
              className="text-primary hover:text-primary-fixed transition-colors"
            >
              Inicia sesión
            </a>
          </p>
        </Card>
      </div>
    </Layout>
  )
}
