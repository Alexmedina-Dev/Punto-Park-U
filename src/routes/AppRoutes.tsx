import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { LoadingSpinner } from '@/components/LoadingSpinner'

// Eagerly loaded pages (public/landing)
import { LandingPage } from '@/pages/LandingPage'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { OAuthCallback } from '@/pages/OAuthCallback'
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage'
import { ResetPasswordPage } from '@/pages/ResetPasswordPage'
import { VerifyEmailPage } from '@/pages/VerifyEmailPage'

// Lazy-loaded dashboard pages
const UserDashboard = lazy(() =>
  import('@/pages/UserDashboard').then((m) => ({ default: m.UserDashboard }))
)
const AdminDashboard = lazy(() =>
  import('@/pages/AdminDashboard').then((m) => ({ default: m.AdminDashboard }))
)

// Lazy-loaded 2FA pages
const TwoFactorSetupPage = lazy(() =>
  import('@/pages/TwoFactorSetupPage').then((m) => ({ default: m.TwoFactorSetupPage }))
)
const TwoFactorVerifyPage = lazy(() =>
  import('@/pages/TwoFactorVerifyPage').then((m) => ({ default: m.TwoFactorVerifyPage }))
)

// Lazy-loaded sessions page
const SessionsPage = lazy(() =>
  import('@/pages/SessionsPage').then((m) => ({ default: m.SessionsPage }))
)

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/oauth/callback" element={<OAuthCallback />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />

        {/* Sessions Route */}
        <Route
          path="/sessions"
          element={
            <ProtectedRoute>
              <Suspense fallback={<LoadingSpinner size="lg" text="Cargando..." />}>
                <SessionsPage />
              </Suspense>
            </ProtectedRoute>
          }
        />

        {/* 2FA Routes */}
        <Route
          path="/2fa/setup"
          element={
            <ProtectedRoute>
              <Suspense fallback={<LoadingSpinner size="lg" text="Cargando..." />}>
                <TwoFactorSetupPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/2fa/verify"
          element={
            <Suspense fallback={<LoadingSpinner size="lg" text="Cargando..." />}>
              <TwoFactorVerifyPage />
            </Suspense>
          }
        />

        {/* Protected Routes with lazy loading */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Suspense fallback={<LoadingSpinner size="lg" text="Cargando panel..." />}>
                <UserDashboard />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin>
              <Suspense fallback={<LoadingSpinner size="lg" text="Cargando panel..." />}>
                <AdminDashboard />
              </Suspense>
            </ProtectedRoute>
          }
        />

        {/* 404 Redirect — catch all unmatched routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
