import React from 'react'
import type { UserRole } from '@/types'

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info'
export type RoleVariant = UserRole

export interface BadgeProps {
  variant?: BadgeVariant
  role?: RoleVariant
  dot?: boolean
  children?: React.ReactNode
  className?: string
  'data-testid'?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  success: 'bg-green-500/15 text-green-400 border-green-500/30',
  warning: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  error: 'bg-red-500/15 text-red-400 border-red-500/30',
  info: 'bg-primary/15 text-primary border-primary/30',
}

const roleClasses: Record<RoleVariant, string> = {
  admin: 'bg-red-500/15 text-red-400 border-red-500/30',
  operator: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  user: 'bg-green-500/15 text-green-400 border-green-500/30',
  guest: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
}

const roleLabels: Record<RoleVariant, string> = {
  admin: 'Admin',
  operator: 'Operador',
  user: 'Usuario',
  guest: 'Invitado',
}

const dotColors: Record<string, string> = {
  success: 'bg-green-400',
  warning: 'bg-yellow-400',
  error: 'bg-red-400',
  info: 'bg-primary',
  admin: 'bg-red-400',
  operator: 'bg-blue-400',
  user: 'bg-green-400',
  guest: 'bg-gray-400',
}

export function Badge({
  variant,
  role,
  dot = false,
  children,
  className = '',
  'data-testid': testId = 'badge',
}: BadgeProps) {
  // If role is provided, use role-specific styling
  if (role) {
    return (
      <span
        data-testid={testId}
        className={`
          inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full
          text-xs font-semibold border
          ${roleClasses[role]}
          ${className}
        `}
      >
        {dot && (
          <span
            className={`inline-block w-1.5 h-1.5 rounded-full ${dotColors[role]}`}
          />
        )}
        {children || roleLabels[role]}
      </span>
    )
  }

  const v = variant || 'info'
  return (
    <span
      data-testid={testId}
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full
        text-xs font-semibold border
        ${variantClasses[v]}
        ${className}
      `}
    >
      {dot && (
        <span
          className={`inline-block w-1.5 h-1.5 rounded-full ${dotColors[v]}`}
        />
      )}
      {children}
    </span>
  )
}

export { roleLabels }
