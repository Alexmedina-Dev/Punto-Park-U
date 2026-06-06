export function AdminDashboard() {
  return (
    <div className="min-h-screen bg-bg text-on-bg p-6">
      <div className="glass rounded-lg p-6 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-primary mb-4 font-headline">
          Panel de Administración
        </h1>
        <p className="text-on-surface-var">
          Bienvenido al panel de administración. Aquí podrás gestionar el parqueadero.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="glass rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-primary mb-2">0</div>
            <div className="text-sm text-on-surface-var">Vehículos</div>
          </div>
          <div className="glass rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-primary mb-2">0</div>
            <div className="text-sm text-on-surface-var">Ingresos</div>
          </div>
          <div className="glass rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-primary mb-2">0%</div>
            <div className="text-sm text-on-surface-var">Ocupación</div>
          </div>
          <div className="glass rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-primary mb-2">0</div>
            <div className="text-sm text-on-surface-var">Usuarios</div>
          </div>
        </div>
      </div>
    </div>
  )
}
