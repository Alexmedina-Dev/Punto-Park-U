import { Layout } from '@/components/layout'
import { Card } from '@/components/ui'

export function UserDashboard() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-primary mb-4 font-headline">
          Panel de Usuario
        </h1>
        <p className="text-on-surface-var mb-6">
          Bienvenido a tu panel de control. Aquí podrás gestionar tus vehículos y reservas.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card variant="glass" className="text-center">
            <div className="text-2xl font-bold text-primary mb-2">0</div>
            <div className="text-sm text-on-surface-var">Vehículos</div>
          </Card>
          <Card variant="glass" className="text-center">
            <div className="text-2xl font-bold text-primary mb-2">0</div>
            <div className="text-sm text-on-surface-var">Reservas</div>
          </Card>
          <Card variant="glass" className="text-center">
            <div className="text-2xl font-bold text-primary mb-2">0</div>
            <div className="text-sm text-on-surface-var">Notificaciones</div>
          </Card>
        </div>
      </div>
    </Layout>
  )
}
