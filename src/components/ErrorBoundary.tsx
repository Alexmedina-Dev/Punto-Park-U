import React from 'react'

interface ErrorBoundaryProps {
  children: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Error capturado:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen flex items-center justify-center bg-bg p-4"
          data-testid="error-boundary"
        >
          <div className="glass rounded-lg p-8 max-w-md w-full text-center">
            <span className="material-symbols-outlined text-5xl text-red-400 mb-4">
              error_outline
            </span>
            <h1 className="text-2xl font-bold text-primary font-headline mb-2">
              Algo salió mal
            </h1>
            <p className="text-on-surface-var font-body mb-4">
              Ha ocurrido un error inesperado. Por favor, intenta recargar la página.
            </p>
            {this.state.error && (
              <details className="text-left mb-4">
                <summary className="text-sm text-on-surface-var cursor-pointer hover:text-primary transition-colors">
                  Detalles técnicos
                </summary>
                <pre className="mt-2 text-xs text-red-400 bg-surface-low p-3 rounded-lg overflow-auto max-h-32">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-primary text-on-primary rounded-lg font-bold hover:bg-primary-fixed transition-colors"
              data-testid="error-reload"
            >
              Recargar página
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
