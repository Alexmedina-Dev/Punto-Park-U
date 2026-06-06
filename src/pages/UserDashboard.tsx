export function UserDashboard() {
  return (
    <div className="min-h-screen bg-bg text-on-bg p-6">
      <div className="glass rounded-lg p-6 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-primary mb-4 font-headline">
          Panel de Usuario
        </h1>
        <p className="text-on-surface-var">
          Bienvenido a tu panel de control. Aquí podrás gestionar tus vehículos y reservas.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="glass rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-primary mb-2">0</div>
            <div className="text-sm text-on-surface-var">Vehículos</div>
          </div>
          <div className="glass rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-primary mb-2">0</div>
            <div className="text-sm text-on-surface-var">Reservas</div>
          </div>
          <div className="glass rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-primary mb-2">0</div>
            <div className="text-sm text-on-surface-var">Notificaciones</div>
          </div>
        </div>
      </div>
    </div>
  )
}
