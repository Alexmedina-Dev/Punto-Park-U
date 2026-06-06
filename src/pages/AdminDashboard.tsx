import { Layout } from '@/components/layout'
import { Card } from '@/components/ui'

export function AdminDashboard() {
  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-primary mb-4 font-headline">
          Panel de Administración
        </h1>
        <p className="text-on-surface-var mb-6">
          Bienvenido al panel de administración. Aquí podrás gestionar el parqueadero.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card variant="glass" className="text-center">
            <div className="text-2xl font-bold text-primary mb-2">0</div>
            <div className="text-sm text-on-surface-var">Vehículos</div>
          </Card>
          <Card variant="glass" className="text-center">
            <div className="text-2xl font-bold text-primary mb-2">$0</div>
            <div className="text-sm text-on-surface-var">Ingresos</div>
          </Card>
          <Card variant="glass" className="text-center">
            <div className="text-2xl font-bold text-primary mb-2">0%</div>
            <div className="text-sm text-on-surface-var">Ocupación</div>
          </Card>
          <Card variant="glass" className="text-center">
            <div className="text-2xl font-bold text-primary mb-2">0</div>
            <div className="text-sm text-on-surface-var">Usuarios</div>
          </Card>
        </div>
      </div>
    </Layout>
  )
}
