import React, { forwardRef, useState } from 'react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: string
  showPasswordToggle?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, showPasswordToggle, className = '', type, ...rest }, ref) => {
    const [showPassword, setShowPassword] = useState(false)
    const resolvedType = showPasswordToggle
      ? showPassword
        ? 'text'
        : 'password'
      : type

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-on-surface-var mb-1">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-var text-base pointer-events-none">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            type={resolvedType}
            data-testid={rest['data-testid'] || 'input'}
            className={`
              w-full px-4 py-2 bg-surface-container border rounded-lg text-on-bg
              placeholder:text-on-surface-var/50
              focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30
              transition-colors duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
              ${icon ? 'pl-10' : ''}
              ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30' : 'border-outline'}
              ${className}
            `}
            {...rest}
          />
          {showPasswordToggle && (
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-var hover:text-on-bg transition-colors"
              tabIndex={-1}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              <span className="material-symbols-outlined text-base">
                {showPassword ? 'visibility' : 'visibility_off'}
              </span>
            </button>
          )}
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-400" data-testid="input-error">
            {error}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
