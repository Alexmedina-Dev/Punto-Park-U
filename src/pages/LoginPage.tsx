import { useState } from 'react'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'

/**
 * User login page — pixel-matched to vanilla Login/Login.css.
 *
 * Vanilla input properties (NOT shared Input component):
 * - height: 4rem (64px), border: none, border-radius: 1.5rem
 * - background: surface-container-highest (#32353d)
 * - focus: box-shadow: 0 0 0 2px primary (ring, not border)
 * - label: font-label, 0.75rem, uppercase, letter-spacing: 0.1em
 */
export function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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

  return (
    <AuthLayout title="Inicio de sesión usuario" showRegister>
      {/* Server error */}
      {error && (
        <div
          className="bg-[rgba(147,0,10,0.2)] border border-error rounded-[0.5rem] font-label text-[0.875rem] text-error p-3 text-center"
          data-testid="login-error"
        >
          {error}
        </div>
      )}

      {/* User credentials hint */}
      <div className="bg-primary/5 border border-primary/10 rounded-xl p-3 text-center">
        <p className="text-xs text-on-surface-var">
          <span className="material-symbols-outlined text-sm align-text-bottom">person</span>
          {' '}Cuenta demo: <span className="font-semibold text-primary">juan / juan1234</span>
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-6">
          {/* ── Username field ── */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="login-username"
              className="font-label text-[0.75rem] tracking-[0.1em] uppercase text-on-surface-var"
            >
              Usuario
            </label>
            <input
              id="login-username"
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value)
                if (errors.username) setErrors((p) => ({ ...p, username: undefined }))
              }}
              placeholder="Ingrese su usuario"
              required
              data-testid="login-username"
              className={`w-full h-14 md:h-16 px-5 md:px-6 bg-surface-container-highest border-none rounded-2xl md:rounded-[1.5rem] text-on-bg font-headline text-base outline-none transition-[box-shadow] duration-300 placeholder:text-outline/50 focus:shadow-[0_0_0_2px_var(--color-primary)] font-[max(16px,1rem)] ${
                errors.username ? 'shadow-[0_0_0_2px_var(--color-error)]' : ''
              }`}
            />
            {errors.username && (
              <p className="text-sm text-red-400" data-testid="input-error">
                {errors.username}
              </p>
            )}
          </div>

          {/* ── Password field ── */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="login-password"
              className="font-label text-[0.75rem] tracking-[0.1em] uppercase text-on-surface-var"
            >
              Contraseña
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (errors.password) setErrors((p) => ({ ...p, password: undefined }))
                }}
                placeholder="••••••••"
                required
                data-testid="login-password"
                className={`w-full h-14 md:h-16 px-5 md:px-6 pr-12 bg-surface-container-highest border-none rounded-2xl md:rounded-[1.5rem] text-on-bg font-headline text-base outline-none transition-[box-shadow] duration-300 placeholder:text-outline/50 focus:shadow-[0_0_0_2px_var(--color-primary)] font-[max(16px,1rem)] ${
                  errors.password ? 'shadow-[0_0_0_2px_var(--color-error)]' : ''
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-outline/50 hover:text-primary transition-colors p-1 flex items-center justify-center"
                tabIndex={-1}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                <span className="material-symbols-outlined text-[1.25rem]">
                  {showPassword ? 'visibility' : 'visibility_off'}
                </span>
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-400" data-testid="input-error">
                {errors.password}
              </p>
            )}
          </div>

          {/* Submit */}
          <Button
            type="submit"
            variant="primary"
            className="w-full h-14 md:h-16 rounded-2xl md:rounded-[1.5rem] text-base font-bold tracking-[0.15em] uppercase shadow-[12px_12px_0_0_rgba(0,116,217,0.2)] hover:shadow-[8px_8px_0_0_rgba(0,116,217,0.3)] active:scale-[0.97] active:shadow-[4px_4px_0_0_rgba(0,116,217,0.2)] transition-all mt-2"
            loading={isLoading}
            data-testid="login-submit"
          >
            INGRESAR
            <span className="material-symbols-outlined text-xl">arrow_forward</span>
          </Button>
        </div>
      </form>
    </AuthLayout>
  )
}
