import { useState, useEffect } from 'react'
import { Card } from '@/components/ui'
import { useHardwareStore } from '@/stores/hardwareStore'

export function HardwarePanel() {
  const {
    sensors,
    barriers,
    loading,
    error,
    fetchSensors,
    fetchBarriers,
    openBarrier,
    closeBarrier,
  } = useHardwareStore()

  const [activeSection, setActiveSection] = useState<'sensors' | 'barriers' | 'camera'>('sensors')

  useEffect(() => {
    fetchSensors()
    fetchBarriers()
  }, [fetchSensors, fetchBarriers])

  const getSensorColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-success'
      case 'offline': return 'bg-error'
      default: return 'bg-surface-container'
    }
  }

  const getSpotStatusColor = (status: string) => {
    switch (status) {
      case 'occupied': return 'bg-error'
      case 'reserved': return 'bg-warning'
      default: return 'bg-success'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-on-bg font-headline">
          Control de Hardware — IoT
        </h2>
        <div className="flex gap-2">
          {(['sensors', 'barriers', 'camera'] as const).map((section) => (
            <button
              key={section}
              onClick={() => setActiveSection(section)}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors capitalize ${
                activeSection === section
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container text-on-surface-var hover:text-on-bg'
              }`}
            >
              {section === 'sensors' ? 'Sensores' : section === 'barriers' ? 'Barreras' : 'Cámara'}
            </button>
          ))}
        </div>
      </div>

      {/* Sensors Section */}
      {activeSection === 'sensors' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {sensors.map((sensor) => (
              <Card
                key={sensor.spotId}
                variant={sensor.status === 'occupied' ? 'glass' : 'glass'}
                padding="sm"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-on-bg">{sensor.code}</span>
                    <div className={`w-3 h-3 rounded-full ${getSensorColor(sensor.sensorStatus)}`} />
                  </div>
                  <div className={`w-full h-2 rounded-full ${getSpotStatusColor(sensor.status)}`} />
                  <div className="text-xs text-on-surface-var space-y-1">
                    <p>Zone: {sensor.zone}</p>
                    <p>Type: {sensor.type}</p>
                    {sensor.sensorValue && (
                      <p>Distance: {sensor.sensorValue}cm</p>
                    )}
                    <p>Status: {sensor.sensorStatus}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          {sensors.length === 0 && (
            <Card variant="glass" padding="lg">
              <div className="text-center text-on-surface-var">
                <span className="material-symbols-outlined text-4xl mb-2">sensors</span>
                <p>No sensors configured</p>
                <p className="text-sm mt-2">
                  Run hardware simulator: <code className="bg-surface-container px-2 py-1 rounded">node scripts/hardware-simulator.js</code>
                </p>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Barriers Section */}
      {activeSection === 'barriers' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {barriers.map((barrier) => (
              <Card key={barrier.id} variant={barrier.isOpen ? 'glass' : 'glass'} padding="md">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-on-bg">{barrier.name}</p>
                      <p className="text-sm text-on-surface-var">{barrier.location}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                      barrier.isOpen ? 'bg-error text-on-error' : 'bg-success text-on-success'
                    }`}>
                      {barrier.isOpen ? 'OPEN' : 'CLOSED'}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openBarrier(barrier.id, true)}
                      disabled={barrier.isOpen}
                      className="flex-1 px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-bold hover:bg-primary-light disabled:opacity-50 transition-colors"
                    >
                      Abrir
                    </button>
                    <button
                      onClick={() => closeBarrier(barrier.id, true)}
                      disabled={!barrier.isOpen}
                      className="flex-1 px-4 py-2 bg-surface-container text-on-surface rounded-lg text-sm font-bold hover:bg-surface-container-high disabled:opacity-50 transition-colors"
                    >
                      Cerrar
                    </button>
                  </div>
                  {barrier.lastActivatedAt && (
                    <p className="text-xs text-on-surface-var">
                      Last activated: {new Date(barrier.lastActivatedAt).toLocaleString('es-CO')}
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>
          {barriers.length === 0 && (
            <Card variant="glass" padding="lg">
              <div className="text-center text-on-surface-var">
                <span className="material-symbols-outlined text-4xl mb-2">gate</span>
                <p>No barriers configured</p>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Camera Section */}
      {activeSection === 'camera' && (
        <div className="space-y-4">
          <Card variant="glass" padding="lg">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-3xl text-primary">photo_camera</span>
                <div>
                  <p className="font-bold text-on-bg">Reconocimiento de Placas</p>
                  <p className="text-sm text-on-surface-var">Flux AI Vision v2.0</p>
                </div>
              </div>
              <div className="bg-surface-container rounded-lg p-4 text-center">
                <span className="material-symbols-outlined text-6xl text-surface-container-high mb-2">videocam</span>
                <p className="text-sm text-on-surface-var">
                  Camera preview will appear here when connected
                </p>
                <p className="text-xs text-on-surface-var mt-2">
                  Start Python service: <code className="bg-surface-container px-2 py-1 rounded">cd python-flux && uvicorn vision_api:app --port 4001</code>
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  className="px-4 py-3 bg-primary text-on-primary rounded-lg text-sm font-bold hover:bg-primary-light transition-colors"
                >
                  <span className="material-symbols-outlined text-base mr-2">capture</span>
                  Capturar Placa
                </button>
                <button
                  className="px-4 py-3 bg-surface-container text-on-surface rounded-lg text-sm font-bold hover:bg-surface-container-high transition-colors"
                >
                  <span className="material-symbols-outlined text-base mr-2">upload</span>
                  Subir Imagen
                </button>
              </div>
            </div>
          </Card>
          <Card variant="glass" padding="md">
            <div className="space-y-2">
              <p className="text-sm font-bold text-on-surface-var">Última captura:</p>
              <div className="text-center py-4 text-on-surface-var text-sm">
                <span className="material-symbols-outlined text-3xl mb-2">image_search</span>
                <p>No captures yet</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <Card variant="glass" padding="md">
          <div className="flex items-center gap-2 text-error">
            <span className="material-symbols-outlined">error</span>
            <p className="text-sm">{error}</p>
          </div>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-4 text-on-surface-var">
          <span className="material-symbols-outlined text-3xl animate-spin">refresh</span>
          <p className="text-sm mt-2">Loading hardware data...</p>
        </div>
      )}
    </div>
  )
}
