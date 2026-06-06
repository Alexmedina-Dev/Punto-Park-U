import React from 'react'

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info'

export interface BadgeProps {
  variant?: BadgeVariant
  dot?: boolean
  children: React.ReactNode
  className?: string
  'data-testid'?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  success: 'bg-green-500/15 text-green-400 border-green-500/30',
  warning: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  error: 'bg-red-500/15 text-red-400 border-red-500/30',
  info: 'bg-primary/15 text-primary border-primary/30',
}

const dotColors: Record<BadgeVariant, string> = {
  success: 'bg-green-400',
  warning: 'bg-yellow-400',
  error: 'bg-red-400',
  info: 'bg-primary',
}

export function Badge({
  variant = 'info',
  dot = false,
  children,
  className = '',
  'data-testid': testId = 'badge',
}: BadgeProps) {
  return (
    <span
      data-testid={testId}
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full
        text-xs font-semibold border
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {dot && (
        <span
          className={`inline-block w-1.5 h-1.5 rounded-full ${dotColors[variant]}`}
        />
      )}
      {children}
    </span>
  )
}
