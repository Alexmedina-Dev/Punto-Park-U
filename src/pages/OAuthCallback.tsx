import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Layout } from '@/components/layout'
import { Card } from '@/components/ui/Card'
import { useAuthStore } from '@/stores/authStore'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ROUTES } from '@/utils/constants'
import type { User } from '@/types'

const ERROR_MESSAGES: Record<string, string> = {
  google_auth_cancelled: 'Inicio de sesión cancelado',
  google_no_email: 'No se pudo obtener tu correo electrónico de Google',
  google_auth_failed: 'Error al autenticar con Google. Intenta de nuevo.',
  google_not_configured: 'La autenticación con Google no está configurada',
}

export function OAuthCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const handleOAuthCallback = useAuthStore((state) => state.handleOAuthCallback)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = searchParams.get('token')
    const refreshToken = searchParams.get('refreshToken') || ''
    const userEncoded = searchParams.get('user')
    const errorParam = searchParams.get('error')

    // Handle OAuth errors from backend redirect
    if (errorParam) {
      setError(ERROR_MESSAGES[errorParam] || 'Error desconocido al iniciar sesión')
      return
    }

    // Validate required params
    if (!token || !userEncoded) {
      setError('Error al procesar la autenticación. Faltan datos.')
      return
    }

    try {
      // Decode base64 user data
      const userJson = atob(userEncoded)
      const user = JSON.parse(userJson) as User

      handleOAuthCallback(token, refreshToken, user)

      // Redirect to dashboard after successful auth
      navigate(ROUTES.DASHBOARD, { replace: true })
    } catch {
      setError('Error al procesar los datos de autenticación')
    }
  }, [searchParams, navigate, handleOAuthCallback])

  // Error state
  if (error) {
    return (
      <Layout>
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8">
          <Card variant="glass" className="w-full max-w-md text-center">
            <div className="text-5xl mb-4 text-red-400">✕</div>
            <h1 className="text-2xl font-bold text-on-surface mb-2 font-headline">
              Error de Autenticación
            </h1>
            <p className="text-on-surface-var mb-6">{error}</p>
            <a
              href="/login"
              className="inline-block px-6 py-2 bg-primary text-on-primary rounded-lg font-bold hover:bg-primary-fixed transition-colors"
            >
              Volver al inicio de sesión
            </a>
          </Card>
        </div>
      </Layout>
    )
  }

  // Loading state
  return (
    <Layout>
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8">
        <Card variant="glass" className="w-full max-w-md text-center">
          <LoadingSpinner size="lg" text="Completando inicio de sesión..." />
        </Card>
      </div>
    </Layout>
  )
}
