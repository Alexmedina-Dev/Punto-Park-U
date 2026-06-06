import React from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-on-primary hover:bg-primary-fixed focus-visible:ring-primary/50',
  secondary:
    'border border-outline text-on-surface hover:bg-surface-container focus-visible:ring-outline/50',
  danger:
    'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500/50',
  ghost:
    'text-on-surface-var hover:bg-surface-container hover:text-on-bg focus-visible:ring-outline/50',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2 text-base',
  lg: 'px-7 py-3 text-lg',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading

  return (
    <button
      disabled={isDisabled}
      data-testid={rest['data-testid'] || `btn-${variant}`}
      className={`
        inline-flex items-center justify-center gap-2 rounded-lg font-bold
        transition-all duration-200
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-bg
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
      {...rest}
    >
      {loading && (
        <span
          className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
          data-testid="btn-spinner"
        />
      )}
      {children}
    </button>
  )
}
