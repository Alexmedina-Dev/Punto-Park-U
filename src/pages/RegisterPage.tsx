import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { toast } from 'sonner'

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
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const { register, isLoading } = useAuthStore()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const validateForm = () => {
    if (formData.nombres.length < 2 || formData.apellidos.length < 2) {
      toast.error('Nombres y apellidos deben tener al menos 2 caracteres')
      return false
    }
    if (!/^\d{6,12}$/.test(formData.cedula)) {
      toast.error('La cédula debe contener entre 6 y 12 números')
      return false
    }
    if (!formData.fechaNacimiento) {
      toast.error('Debes ingresar una fecha de nacimiento')
      return false
    }
    const birthDate = new Date(formData.fechaNacimiento)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    if (age < 18) {
      toast.error('Debes ser mayor de 18 años')
      return false
    }
    if (formData.username.length < 3) {
      toast.error('El usuario debe tener al menos 3 caracteres')
      return false
    }
    if (formData.password.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres')
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return false
    }
    return true
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
    <div className="min-h-screen flex items-center justify-center bg-bg py-8">
      <div className="glass rounded-lg p-8 w-full max-w-md mx-4">
        <h1 className="text-3xl font-bold text-primary mb-6 text-center font-headline">
          Registro
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-on-surface-var mb-1">Nombres</label>
              <input
                type="text"
                name="nombres"
                value={formData.nombres}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-surface-container border border-outline rounded-lg text-on-bg focus:outline-none focus:border-primary"
                placeholder="Nombres"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-on-surface-var mb-1">Apellidos</label>
              <input
                type="text"
                name="apellidos"
                value={formData.apellidos}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-surface-container border border-outline rounded-lg text-on-bg focus:outline-none focus:border-primary"
                placeholder="Apellidos"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-on-surface-var mb-1">Cédula</label>
            <input
              type="text"
              name="cedula"
              value={formData.cedula}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-surface-container border border-outline rounded-lg text-on-bg focus:outline-none focus:border-primary"
              placeholder="Número de cédula"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-on-surface-var mb-1">Fecha de Nacimiento</label>
            <input
              type="date"
              name="fechaNacimiento"
              value={formData.fechaNacimiento}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-surface-container border border-outline rounded-lg text-on-bg focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-on-surface-var mb-1">Usuario</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-surface-container border border-outline rounded-lg text-on-bg focus:outline-none focus:border-primary"
              placeholder="Nombre de usuario"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-on-surface-var mb-1">Contraseña</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-surface-container border border-outline rounded-lg text-on-bg focus:outline-none focus:border-primary"
                placeholder="Mínimo 8 caracteres"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-var hover:text-on-bg"
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-on-surface-var mb-1">Confirmar Contraseña</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-surface-container border border-outline rounded-lg text-on-bg focus:outline-none focus:border-primary"
              placeholder="Repite la contraseña"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 bg-primary text-on-primary rounded-lg font-bold hover:bg-primary-fixed transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Cargando...' : 'Registrarse'}
          </button>
        </form>
        
        <p className="mt-4 text-center text-sm text-on-surface-var">
          ¿Ya tienes cuenta?{' '}
          <a href="/login" className="text-primary hover:text-primary-fixed transition-colors">
            Inicia sesión
          </a>
        </p>
      </div>
    </div>
  )
}
