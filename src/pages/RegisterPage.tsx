import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { toast } from 'sonner'
import { Layout } from '@/components/layout'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

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
  const navigate = useNavigate()
  const { register, isLoading } = useAuthStore()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
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
    if (!validateForm()) return

    const success = await register(formData)
    if (success) {
      toast.success('¡Registro exitoso!')
      navigate('/login')
    } else {
      toast.error('Error al registrar usuario')
    }
  }

  return (
    <Layout>
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8">
        <Card variant="glass" className="w-full max-w-md">
          <h1 className="text-3xl font-bold text-primary mb-6 text-center font-headline">
            Registro
          </h1>

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

          <p className="mt-4 text-center text-sm text-on-surface-var">
            ¿Ya tienes cuenta?{' '}
            <a href="/login" className="text-primary hover:text-primary-fixed transition-colors">
              Inicia sesión
            </a>
          </p>
        </Card>
      </div>
    </Layout>
  )
}
