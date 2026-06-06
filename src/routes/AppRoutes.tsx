import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { LoadingSpinner } from '@/components/LoadingSpinner'

// Eagerly loaded pages (public/landing)
import { LandingPage } from '@/pages/LandingPage'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'

// Lazy-loaded dashboard pages
const UserDashboard = lazy(() =>
  import('@/pages/UserDashboard').then((m) => ({ default: m.UserDashboard }))
)
const AdminDashboard = lazy(() =>
  import('@/pages/AdminDashboard').then((m) => ({ default: m.AdminDashboard }))
)

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

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
