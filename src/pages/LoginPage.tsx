import { useState } from 'react'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { API_BASE_URL } from '@/utils/constants'

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
  const [googleLoading, setGoogleLoading] = useState(false)
  const { login, isLoading, error, clearError } = useAuth()

  const handleGoogleLogin = () => {
    setGoogleLoading(true)
    window.location.href = `${API_BASE_URL}/oauth/google`
  }

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
    <AuthLayout title="Inicio de sesión usuario" showRegister showForgotPassword>
      {/* Server error */}
      {error && (
        <div
          className="bg-[rgba(147,0,10,0.2)] border border-error rounded-[0.5rem] font-label text-[0.875rem] text-error p-3 text-center"
          data-testid="login-error"
        >
          {error}
        </div>
      )}

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

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-outline/30" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-surface px-2 text-on-surface-var">O inicia sesión con</span>
            </div>
          </div>

          {/* Google OAuth button */}
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={handleGoogleLogin}
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
            {googleLoading ? 'Redirigiendo...' : 'Iniciar sesión con Google'}
          </Button>
        </div>
      </form>
    </AuthLayout>
  )
}
