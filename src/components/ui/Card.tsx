import React from 'react'

export type CardVariant = 'default' | 'glass'
export type CardPadding = 'none' | 'sm' | 'md' | 'lg'

export interface CardProps {
  title?: string
  variant?: CardVariant
  padding?: CardPadding
  children: React.ReactNode
  className?: string
  'data-testid'?: string
}

const variantClasses: Record<CardVariant, string> = {
  default: 'bg-surface-container border border-outline/20',
  glass: 'glass',
}

const paddingClasses: Record<CardPadding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

export function Card({
  title,
  variant = 'glass',
  padding = 'md',
  children,
  className = '',
  'data-testid': testId = 'card',
}: CardProps) {
  return (
    <div
      data-testid={testId}
      className={`
        rounded-lg
        ${variantClasses[variant]}
        ${paddingClasses[padding]}
        ${className}
      `}
    >
      {title && (
        <h3 className="text-lg font-bold text-primary font-headline mb-4">
          {title}
        </h3>
      )}
      {children}
    </div>
  )
}
