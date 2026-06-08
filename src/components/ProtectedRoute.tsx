import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import type { UserRole } from '@/types'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
  requireRole?: UserRole
  requireRoles?: UserRole[]
}

export function ProtectedRoute({
  children,
  requireAdmin = false,
  requireRole: minRole,
  requireRoles: acceptedRoles,
}: ProtectedRouteProps) {
  const { isAuthenticated, hasRole, userRole } = useAuthStore()
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith('/admin')

  if (!isAuthenticated) {
    // Redirect to admin login for admin routes, regular login for others
    return <Navigate to={isAdminRoute ? '/admin/login' : '/login'} replace />
  }

  // Legacy requireAdmin support
  if (requireAdmin && userRole !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  // Minimum role check
  if (minRole && !hasRole(minRole)) {
    return <Navigate to="/dashboard" replace />
  }

  // Accepted roles list check
  if (acceptedRoles && userRole && !acceptedRoles.includes(userRole)) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
