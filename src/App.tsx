import { Toaster } from 'sonner'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { AppRoutes } from '@/routes/AppRoutes'

export function App() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-bg text-on-bg">
        <Toaster
          position="bottom-right"
          theme="dark"
          toastOptions={{
            style: {
              background: '#272a32',
              color: '#e1e2ec',
              border: '1px solid rgba(167, 200, 255, 0.1)',
            },
          }}
        />
        <AppRoutes />
      </div>
    </ErrorBoundary>
  )
}
