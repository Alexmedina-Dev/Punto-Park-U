export function LandingPage() {
  return (
    <main className="flex items-center justify-center min-h-screen">
      <div
        className="glass rounded-lg px-8 py-12 text-center max-w-md"
        data-testid="welcome-card"
      >
        <h1 className="text-4xl font-black text-primary mb-4 font-headline">
          PUNTO PARK U
        </h1>
        <p className="text-on-surface-var font-body">
          Estacionamiento Fácil y Sencillo
        </p>
        <div className="mt-6 flex gap-4 justify-center">
          <a
            href="/login"
            className="px-6 py-2 bg-primary text-on-primary rounded-lg font-bold hover:bg-primary-fixed transition-colors"
          >
            Iniciar Sesión
          </a>
          <a
            href="/register"
            className="px-6 py-2 border border-outline text-on-surface rounded-lg hover:bg-surface-container transition-colors"
          >
            Registrarse
          </a>
        </div>
      </div>
    </main>
  )
}
