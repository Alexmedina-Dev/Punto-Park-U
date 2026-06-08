import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'

/**
 * Admin login page — pixel-matched to vanilla Administrador/Admi.css.
 *
 * Same input styling as LoginPage. Brand color is blue (primary-container).
 * No register link. Min password: 8 chars.
 */
export function AdminLoginPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({})
  const { login, isLoading, error, clearError, isAdmin, isAuthenticated } = useAuth()

  // Redirect if already logged in as admin
  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      navigate('/admin')
    }
  }, [isAuthenticated, isAdmin, navigate])

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
    <AuthLayout title="Inicio de sesión Administrador">
      {/* Server error */}
      {error && (
        <div
          className="bg-[rgba(147,0,10,0.2)] border border-error rounded-[0.5rem] font-label text-[0.875rem] text-error p-3 text-center"
          data-testid="admin-login-error"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-6">
          {/* ── Username field ── */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="admin-username"
              className="font-label text-[0.75rem] tracking-[0.1em] uppercase text-on-surface-var"
            >
              Usuario
            </label>
            <input
              id="admin-username"
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value)
                if (errors.username) setErrors((p) => ({ ...p, username: undefined }))
              }}
              placeholder="Ingrese su usuario"
              required
              data-testid="admin-username"
              className={`w-full h-16 px-6 bg-surface-container-highest border-none rounded-[1.5rem] text-on-bg font-headline text-base outline-none transition-[box-shadow] duration-300 placeholder:text-outline/50 focus:shadow-[0_0_0_2px_var(--color-primary)] ${
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
              htmlFor="admin-password"
              className="font-label text-[0.75rem] tracking-[0.1em] uppercase text-on-surface-var"
            >
              Contraseña
            </label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (errors.password) setErrors((p) => ({ ...p, password: undefined }))
              }}
              placeholder="••••••••"
              required
              data-testid="admin-password"
              className={`w-full h-16 px-6 bg-surface-container-highest border-none rounded-[1.5rem] text-on-bg font-headline text-base outline-none transition-[box-shadow] duration-300 placeholder:text-outline/50 focus:shadow-[0_0_0_2px_var(--color-primary)] ${
                errors.password ? 'shadow-[0_0_0_2px_var(--color-error)]' : ''
              }`}
            />
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
            className="w-full h-16 rounded-[1.5rem] text-lg font-bold tracking-[0.15em] uppercase shadow-[12px_12px_0_0_rgba(0,116,217,0.2)] hover:shadow-[8px_8px_0_0_rgba(0,116,217,0.3)] active:scale-[0.97] active:shadow-[4px_4px_0_0_rgba(0,116,217,0.2)] transition-all mt-2"
            loading={isLoading}
            data-testid="admin-submit"
          >
            INGRESAR
            <span className="material-symbols-outlined text-xl">arrow_forward</span>
          </Button>
        </div>
      </form>
    </AuthLayout>
  )
}
