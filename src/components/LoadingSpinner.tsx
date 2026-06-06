export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
}

const sizeClasses = {
  sm: 'w-5 h-5 border-2',
  md: 'w-8 h-8 border-3',
  lg: 'w-12 h-12 border-4',
}

export function LoadingSpinner({ size = 'md', text }: LoadingSpinnerProps) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 py-12"
      data-testid="loading-spinner"
    >
      <span
        className={`
          inline-block rounded-full border-primary border-t-transparent
          animate-spin
          ${sizeClasses[size]}
        `}
      />
      {text && (
        <p className="text-sm text-on-surface-var font-body">{text}</p>
      )}
    </div>
  )
}
