import { useState } from 'react'
import { Link } from 'react-router-dom'
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
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [googleLoading, setGoogleLoading] = useState(false)
  const [registrationDone, setRegistrationDone] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState('')
  const { register, isLoading, error, clearError } = useAuth()

  const handleGoogleRegister = () => {
    setGoogleLoading(true)
    window.location.href = `${API_BASE_URL}/oauth/google`
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
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
    if (!/^\d{6,10}$/.test(formData.cedula)) {
      newErrors.cedula = 'Debe contener entre 6 y 10 números'
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
      } else if (age > 85) {
        newErrors.fechaNacimiento = 'La edad máxima permitida es 85 años'
      }
    }
    if (!formData.email || !/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Debes ingresar un correo electrónico válido'
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
    const result = await register(formData)
    if (typeof result === 'object' && 'needsVerification' in result) {
      setRegistrationDone(true)
      setRegisteredEmail(result.email)
    }
  }

  const formContent = (
    <>
      {/* Registration done — show verification message */}
      {registrationDone ? (
        <div className="py-4 text-center">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl text-primary">✉</span>
          </div>
          <h2 className="text-xl font-bold text-primary mb-2 font-headline">
            ¡Registro exitoso!
          </h2>
          <p className="text-on-surface-var mb-4">
            Hemos enviado un link de verificación a{' '}
            <strong className="text-primary">{registeredEmail || 'tu email'}</strong>.
            Por favor revisa tu bandeja de entrada para verificar tu cuenta.
          </p>
          <p className="text-sm text-on-surface-var mb-4">
            ¿No recibiste el email?{' '}
            <Link
              to="/verify-email"
              className="text-primary hover:text-primary-fixed transition-colors"
            >
              Reenviar verificación
            </Link>
          </p>
          <Link to="/login">
            <Button variant="primary" className="w-full">
              Ir a Iniciar Sesión
            </Button>
          </Link>
        </div>
      ) : (
        <>
          {/* Server error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nombres — full width on all screens */}
            <Input
              label="Nombres"
              name="nombres"
              value={formData.nombres}
              onChange={handleChange}
              placeholder="Nombres"
              error={errors.nombres}
              icon="badge"
            />

            {/* Apellidos — full width on all screens */}
            <Input
              label="Apellidos"
              name="apellidos"
              value={formData.apellidos}
              onChange={handleChange}
              placeholder="Apellidos"
              error={errors.apellidos}
              icon="badge"
            />

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
              label="Correo Electrónico"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="ejemplo@correo.com"
              error={errors.email}
              icon="mail"
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

            {/* Password fields — side by side on tablet+ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
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
            </div>

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
        </>
      )}
    </>
  )

  return (
    <div className="min-h-screen flex flex-col bg-bg text-on-bg">
      {/* ═══════════════════════════════════════════════════════════
          MOBILE: Centered card with logo watermark
          ═══════════════════════════════════════════════════════════ */}
      <div className="md:hidden flex-1 flex items-center justify-center px-4 py-8 relative overflow-y-auto overflow-x-hidden">
        {/* Logo watermark — more visible on mobile */}
        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
          <img
            src="/images/Logo.webp"
            alt=""
            className="w-[70%] max-w-[400px] opacity-[0.12] drop-shadow-[0_0_40px_rgba(0,116,217,0.4)]"
            aria-hidden="true"
          />
        </div>

        {/* Ambient glow */}
        <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-secondary/5 rounded-full blur-[100px] pointer-events-none" />

        <Card variant="glass" className="w-full max-w-md relative z-10">
          <h1 className="text-3xl font-bold text-primary mb-6 text-center font-headline">
            Registro
          </h1>
          {formContent}
        </Card>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          DESKTOP / TABLET: Split layout (matching login)
          ═══════════════════════════════════════════════════════════ */}
      <main className="hidden md:grid grid-cols-2 min-h-screen">
        {/* LEFT: Form Column */}
        <section className="flex flex-col justify-center items-center px-16 py-12 bg-bg overflow-y-auto">
          <div className="w-full max-w-[28rem] flex flex-col gap-8">
            {/* Brand */}
            <div>
              <h2 className="font-headline font-black text-[1.875rem] tracking-[-0.05em] uppercase italic text-primary">
                &ldquo;PUNTO PARK U&rdquo;
              </h2>
              <p className="font-label text-[0.75rem] tracking-[0.15em] text-outline uppercase mt-1">
                Sistema de Gestión de Parqueadero
              </p>
            </div>

            {/* Header */}
            <div>
              <h1 className="text-[2.5rem] font-extrabold tracking-[-0.02em] text-on-bg leading-[1] font-headline italic">
                Registro de Usuario
              </h1>
            </div>

            {/* Form */}
            {formContent}
          </div>
        </section>

        {/* RIGHT: Visual Column — clean logo only */}
        <section className="relative flex items-center justify-center bg-surface-low overflow-hidden py-12">
          {/* Watermark logo — centered, clean, no extras */}
          <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
            <img
              src="/images/Logo.webp"
              alt=""
              className="w-[75%] max-w-[500px] opacity-[0.25] drop-shadow-[0_0_50px_rgba(0,116,217,0.3)]"
              aria-hidden="true"
            />
          </div>

          {/* Gradient overlay */}
          <div className="absolute inset-0 z-10 bg-gradient-to-tr from-bg via-transparent to-primary/20" />
        </section>
      </main>

      {/* HOME BUTTON */}
      <Link
        to="/"
        className="fixed bottom-[90px] md:bottom-[90px] max-md:bottom-[110px] right-6 md:right-8 z-50 flex items-center justify-center bg-surface-highest/80 text-white md:px-6 md:py-4 max-md:p-4 rounded-full shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1)] transition-colors hover:bg-primary-container group touch-target"
      >
        <span className="material-symbols-outlined text-primary text-[1.5rem] group-hover:text-on-primary-container transition-colors">
          home
        </span>
        <span className="hidden md:inline font-label text-[0.875rem] font-bold tracking-[0.15em] uppercase text-on-bg group-hover:text-on-primary-container transition-colors ml-2">
          Inicio
        </span>
      </Link>

      {/* FOOTER */}
      <footer className="bg-bg flex flex-col items-center justify-center gap-4 py-8 border-t border-outline-variant/10 z-40">
        <p className="font-label text-[0.875rem] text-outline-variant flex flex-wrap justify-center gap-[10px] flex-col md:flex-row gap-[5px] md:gap-[10px]">
          <span className="whitespace-nowrap">&copy; 2026 &ldquo;Punto Park U&rdquo;</span>
          <span className="whitespace-nowrap">Todos los derechos reservados</span>
        </p>
      </footer>
    </div>
  )
}
