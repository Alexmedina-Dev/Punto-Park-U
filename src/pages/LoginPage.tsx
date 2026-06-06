import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { toast } from 'sonner'

export function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const { login, isLoading, error } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (username.length < 3) {
      toast.error('El usuario debe tener al menos 3 caracteres')
      return
    }
    
    if (password.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres')
      return
    }

    const success = await login({ username, password })
    if (success) {
      toast.success('¡Bienvenido!')
      navigate('/dashboard')
    } else {
      toast.error(error || 'Usuario o contraseña incorrectos')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="glass rounded-lg p-8 w-full max-w-md mx-4">
        <h1 className="text-3xl font-bold text-primary mb-6 text-center font-headline">
          Iniciar Sesión
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-on-surface-var mb-1">
              Usuario
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 bg-surface-container border border-outline rounded-lg text-on-bg focus:outline-none focus:border-primary"
              placeholder="Ingresa tu usuario"
              data-testid="login-username"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-on-surface-var mb-1">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 bg-surface-container border border-outline rounded-lg text-on-bg focus:outline-none focus:border-primary"
                placeholder="Ingresa tu contraseña"
                data-testid="login-password"
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
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 bg-primary text-on-primary rounded-lg font-bold hover:bg-primary-fixed transition-colors disabled:opacity-50"
            data-testid="login-submit"
          >
            {isLoading ? 'Cargando...' : 'Ingresar'}
          </button>
        </form>
        
        <p className="mt-4 text-center text-sm text-on-surface-var">
          ¿No tienes cuenta?{' '}
          <a href="/register" className="text-primary hover:text-primary-fixed transition-colors">
            Regístrate
          </a>
        </p>
      </div>
    </div>
  )
}
