import { Link } from 'react-router-dom'
import { Layout } from '@/components/layout'
import { Card, Button } from '@/components/ui'

export function NotFoundPage() {
  return (
    <Layout>
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8">
        <Card variant="glass" className="w-full max-w-md text-center">
          <div className="text-7xl font-black text-primary/30 font-headline mb-4">
            404
          </div>
          <h1 className="text-2xl font-bold text-on-bg mb-2 font-headline">
            Página No Encontrada
          </h1>
          <p className="text-on-surface-var mb-8">
            La página que buscas no existe o ha sido movida.
          </p>
          <Link to="/">
            <Button variant="primary" className="w-full">
              Volver al Inicio
            </Button>
          </Link>
        </Card>
      </div>
    </Layout>
  )
}
