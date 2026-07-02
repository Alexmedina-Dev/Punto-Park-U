import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { UserLayout } from '@/components/layout'
import { Card, Button, Badge, Modal, Input } from '@/components/ui'
import { VehicleForm } from '@/components/VehicleForm'
import { ReservationForm } from '@/components/ReservationForm'
import { PaymentCard } from '@/components/PaymentCard'
import { PaymentButton } from '@/components/PaymentButton'
import { PaymentStatus } from '@/components/PaymentStatus'
import { ReceiptModal } from '@/components/ReceiptModal'
import { ManualPaymentButton } from '@/components/ManualPaymentButton'
import { QRDisplay } from '@/components/QRDisplay'
import { SessionsInline } from '@/components/SessionsInline'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/stores/authStore'
import { useSessionActivity } from '@/hooks/useSessionActivity'
import { useVehicleStore } from '@/stores/vehicleStore'
import { useReservationStore } from '@/stores/reservationStore'
import { usePaymentStore } from '@/stores/paymentStore'
import { get2FAStatusService, updateUserService } from '@/services/auth.service'
import { formatDate, formatDateTime, formatCurrency, getVehicleLabel, getStatusLabel } from '@/utils/formatters'
import { showErrorToast, showSuccessToast } from '@/utils/errorHandler'

type UserTab = 'dashboard' | 'vehicles' | 'reservations' | 'sessions' | 'payments' | 'profile'

export function UserDashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout, isLoading: authLoading } = useAuth()
  const setUser = useAuthStore((state) => state.setUser)
  
  // Sync activeTab with URL parameter
  const urlTab = new URLSearchParams(location.search).get('tab') as UserTab || 'dashboard'
  const [activeTab, setActiveTab] = useState<UserTab>(urlTab)
  
  // Update activeTab when URL changes
  useEffect(() => {
    setActiveTab(urlTab)
  }, [urlTab])

  // Track user activity for session management
  useSessionActivity()

  // ── Stores ────────────────────────────────────────────────────────
  const {
    vehicles,
    isLoading: vehiclesLoading,
    error: vehicleError,
    fetchVehicles,
    createVehicle,
    updateVehicle,
    deleteVehicle,
  } = useVehicleStore()

  const {
    reservations,
    stats: reservationStats,
    isLoading: reservationsLoading,
    error: reservationError,
    fetchReservations,
    fetchStats: fetchReservationStats,
    createReservation,
    cancelReservation,
  } = useReservationStore()

  const {
    payments,
    isLoading: paymentsLoading,
    fetchPayments,
  } = usePaymentStore()

  // ── Local state ───────────────────────────────────────────────────
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [backupCodesCount, setBackupCodesCount] = useState(0)

  // Payment flow
  const [selectedPayment, setSelectedPayment] = useState<typeof payments[0] | null>(null)
  const [showReceiptModal, setShowReceiptModal] = useState(false)

  // Profile edit
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({ nombres: '', apellidos: '', email: '', phone: '', cedula: '', fechaNacimiento: '' })
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({})
  const [profileSaving, setProfileSaving] = useState(false)

  // Vehicle modals
  const [showVehicleModal, setShowVehicleModal] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<typeof vehicles[0] | null>(null)

  // Reservation modals
  const [showReservationModal, setShowReservationModal] = useState(false)
  const [showQRCode, setShowQRCode] = useState<typeof reservations[0] | null>(null)

  // ── Effects ───────────────────────────────────────────────────────
  useEffect(() => {
    // Fetch all data on first mount
    fetchVehicles()
    fetchReservations()
    fetchReservationStats()
    fetchPayments()
  }, [fetchVehicles, fetchReservations, fetchReservationStats, fetchPayments])

  useEffect(() => {
    if (activeTab === 'profile') {
      load2FAStatus()
    }
  }, [activeTab])

  const load2FAStatus = async () => {
    try {
      const status = await get2FAStatusService()
      setTwoFactorEnabled(status.twoFactorEnabled)
      setBackupCodesCount(status.backupCodesCount)
    } catch {
      // Silently fail
    }
  }

  // ── Profile Handlers ──────────────────────────────────────────────
  const startEditProfile = useCallback(() => {
    setProfileForm({
      nombres: user?.nombres || '',
      apellidos: user?.apellidos || '',
      email: user?.email || '',
      phone: user?.phone || '',
      cedula: user?.cedula || '',
      fechaNacimiento: user?.fechaNacimiento || '',
    })
    setProfileErrors({})
    setIsEditingProfile(true)
  }, [user])

  const cancelEditProfile = useCallback(() => {
    setIsEditingProfile(false)
    setProfileErrors({})
  }, [])

  const handleProfileChange = (field: string, value: string) => {
    setProfileForm((prev) => ({ ...prev, [field]: value }))
    if (profileErrors[field]) {
      setProfileErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  const validateProfile = (): boolean => {
    const errors: Record<string, string> = {}
    if (!profileForm.nombres.trim()) errors.nombres = 'Los nombres son obligatorios'
    if (!profileForm.apellidos.trim()) errors.apellidos = 'Los apellidos son obligatorios'
    if (!profileForm.email.trim()) {
      errors.email = 'El email es obligatorio'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileForm.email)) {
      errors.email = 'Formato de email inválido'
    }
    if (profileForm.cedula && !/^\d{6,10}$/.test(profileForm.cedula)) {
      errors.cedula = 'La cédula debe tener entre 6 y 10 dígitos'
    }
    if (profileForm.fechaNacimiento) {
      const birthDate = new Date(profileForm.fechaNacimiento)
      const today = new Date()
      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }
      if (age < 18) {
        errors.fechaNacimiento = 'Debes ser mayor de 18 años'
      }
    }
    setProfileErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleProfileSave = async () => {
    if (!validateProfile() || !user) return
    setProfileSaving(true)
    try {
      // Backend expects combined 'name' field, not separate nombres/apellidos
      const fullName = `${profileForm.nombres.trim()} ${profileForm.apellidos.trim()}`.trim()
      const updatedUser = await updateUserService(user.id, {
        name: fullName,
        email: profileForm.email,
        phone: profileForm.phone || undefined,
        cedula: profileForm.cedula || undefined,
        fechaNacimiento: profileForm.fechaNacimiento || undefined,
      })
      setUser(updatedUser)
      showSuccessToast('Perfil actualizado correctamente')
      setIsEditingProfile(false)
    } catch (error) {
      showErrorToast(error)
    } finally {
      setProfileSaving(false)
    }
  }

  // ── Vehicle Handlers ──────────────────────────────────────────────
  const handleAddVehicle = () => {
    setEditingVehicle(null)
    setShowVehicleModal(true)
  }

  const handleEditVehicle = (vehicle: typeof vehicles[0]) => {
    setEditingVehicle(vehicle)
    setShowVehicleModal(true)
  }

  const handleVehicleSubmit = async (data: {
    plate: string
    type: string
    brand: string
    model: string
    color: string
  }) => {
    if (editingVehicle) {
      const ok = await updateVehicle(editingVehicle.id, data)
      if (ok) setShowVehicleModal(false)
      return ok
    }
    const ok = await createVehicle(data)
    if (ok) setShowVehicleModal(false)
    return ok
  }

  const handleDeleteVehicle = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este vehículo?')) {
      await deleteVehicle(id)
    }
  }

  // ── Reservation Handlers ──────────────────────────────────────────
  const handleCreateReservation = async (data: {
    vehicle: string
    entryTime: string
    date?: string
    startTime?: string
    endTime?: string
    notes?: string
  }) => {
    const ok = await createReservation(data)
    if (ok) setShowReservationModal(false)
    return ok
  }

  const handleCancelReservation = async (id: string) => {
    if (window.confirm('¿Estás seguro de cancelar esta reserva?')) {
      await cancelReservation(id)
    }
  }

  const handleShowQR = (reservation: typeof reservations[0]) => {
    setShowQRCode(reservation)
  }

  // ── Payment Handlers ──────────────────────────────────────────────
  const handleViewReceipt = (payment: typeof payments[0]) => {
    setSelectedPayment(payment)
    setShowReceiptModal(true)
  }

  const handleCloseReceipt = () => {
    setShowReceiptModal(false)
    setSelectedPayment(null)
  }

  const handlePaymentStatusChange = useCallback(
    (_paymentId: string, newStatus: string) => {
      // Re-fetch payments list when an ePayco payment changes status
      if (newStatus === 'completed' || newStatus === 'failed') {
        fetchPayments()
        showSuccessToast(
          newStatus === 'completed'
            ? 'Pago confirmado correctamente'
            : 'El pago no pudo ser procesado'
        )
      }
    },
    [fetchPayments]
  )

  // ── Tabs config ───────────────────────────────────────────────────
  const tabs: { key: UserTab; label: string; icon: string }[] = [
    { key: 'dashboard', label: 'Resumen', icon: 'dashboard' },
    { key: 'vehicles', label: 'Vehículos', icon: 'directions_car' },
    { key: 'reservations', label: 'Reservas', icon: 'calendar_month' },
    { key: 'payments', label: 'Pagos', icon: 'payments' },
    { key: 'sessions', label: 'Sesiones', icon: 'devices' },
    { key: 'profile', label: 'Perfil', icon: 'person' },
  ]

  // ── Helpers ───────────────────────────────────────────────────────
  const activeReservations = reservations.filter((r) => r.status === 'active' || r.status === 'pending')

  return (
    <UserLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primary font-headline">
              Panel de Usuario
            </h1>
            <p className="text-on-surface-var mt-1">
              Bienvenido, {user?.nombres || user?.username || 'Usuario'}
            </p>
          </div>
          <Button variant="ghost" onClick={logout} loading={authLoading}>
            <span className="material-symbols-outlined text-base">logout</span>
            Cerrar Sesión
          </Button>
        </div>



        {/* ═══════════════════════════════════════════════════════════
           DASHBOARD TAB
           ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'dashboard' && (
          <div>
            {/* Welcome Card */}
            <div className="bg-surface border border-outline/10 rounded-2xl p-5 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-primary font-headline">
                    Hola, {user?.nombres || user?.username || 'Usuario'}
                  </h2>
                  <p className="text-on-surface-var mt-1">
                    Bienvenido de vuelta a tu espacio.
                  </p>
                </div>
                {/* Membership Badge */}
                <div className="bg-surface-container rounded-xl p-3 border border-outline/10 min-w-[240px]">
                  <div className="flex items-center gap-2 text-sm font-medium text-primary">
                    <span className="material-symbols-outlined text-base">workspace_premium</span>
                    Cliente Frecuente
                  </div>
                  <div className="mt-2">
                    <div className="h-1.5 bg-outline/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, ((reservationStats?.completed ?? 0) / 30) * 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-on-surface-var mt-1">
                      {reservationsLoading ? '...' : `${reservationStats?.completed ?? 0} visitas · ${Math.max(0, 30 - (reservationStats?.completed ?? 0))} para siguiente nivel`}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <Card variant="glass" className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-primary text-2xl">directions_car</span>
                </div>
                <div className="text-2xl font-bold text-primary mb-1">
                  {reservationsLoading ? '...' : (reservationStats?.completed ?? 0)}
                </div>
                <div className="text-sm text-on-surface-var">Visitas</div>
              </Card>
              <Card variant="glass" className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-primary text-2xl">credit_card</span>
                </div>
                <div className="text-2xl font-bold text-primary mb-1">
                  {paymentsLoading ? '...' : formatCurrency(payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + (p.amount || 0), 0))}
                </div>
                <div className="text-sm text-on-surface-var">Gastado</div>
              </Card>
              <Card variant="glass" className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-primary text-2xl">emoji_events</span>
                </div>
                <div className="text-2xl font-bold text-primary mb-1">10%</div>
                <div className="text-sm text-on-surface-var">Descuento</div>
              </Card>
            </div>

            {/* Recent History */}
            <div className="bg-surface border border-outline/10 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-primary font-headline flex items-center gap-2">
                  <span className="material-symbols-outlined">history</span>
                  Historial Reciente
                </h3>
                <button
                  className="text-sm text-primary hover:underline"
                  onClick={() => navigate('/dashboard?tab=payments')}
                >
                  Ver todo
                </button>
              </div>
              <div className="space-y-2">
                {payments.slice(0, 5).map((p) => {
                  const vehicle = vehicles.find((v) => v.id === p.vehicleId)
                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-surface-high/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/15">
                          <span className="material-symbols-outlined text-primary text-sm">
                            {vehicle?.type === 'moto' ? 'two_wheeler' : vehicle?.type === 'bike' ? 'pedal_bike' : 'directions_car'}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-on-bg">
                            {vehicle?.plate || '—'}
                          </p>
                          <p className="text-xs text-on-surface-var">
                            {p.date ? formatDate(p.date) : (p.createdAt ? formatDate(p.createdAt) : '')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-on-bg">
                          {formatCurrency(p.amount)}
                        </div>
                        <div className={`text-xs font-medium ${p.status === 'completed' ? 'text-green-400' : 'text-yellow-400'}`}>
                          {p.status === 'completed' ? 'PAGADO' : (getStatusLabel(p.status) || p.status).toUpperCase()}
                        </div>
                      </div>
                    </div>
                  )
                })}
                {payments.length === 0 && (
                  <div className="text-center py-6 text-on-surface-var text-sm">
                    <span className="material-symbols-outlined text-3xl mb-2 block">history</span>
                    No hay historial reciente
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
           VEHICLES TAB
           ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'vehicles' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-primary font-headline">Mis Vehículos</h2>
              <Button variant="primary" size="sm" onClick={handleAddVehicle}>
                <span className="material-symbols-outlined text-sm">add</span>
                Agregar Vehículo
              </Button>
            </div>

            {vehiclesLoading && vehicles.length === 0 ? (
              <Card variant="glass">
                <div className="flex items-center justify-center py-8">
                  <span className="inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              </Card>
            ) : vehicles.length === 0 ? (
              <Card variant="glass">
                <div className="text-center py-8 text-on-surface-var text-sm">
                  <span className="material-symbols-outlined text-3xl mb-2 block">
                    directions_car
                  </span>
                  <p className="mb-4">No tienes vehículos registrados</p>
                  <Button variant="primary" size="sm" onClick={handleAddVehicle}>
                    + Agregar Vehículo
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {vehicles.map((v) => (
                  <Card key={v.id} variant="glass" padding="sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/15 shrink-0">
                          <span className="material-symbols-outlined text-primary text-lg">
                            {v.type === 'moto' ? 'two_wheeler' : v.type === 'bike' ? 'pedal_bike' : 'directions_car'}
                          </span>
                        </div>
                        <div className="min-w-0 overflow-hidden">
                          <p className="font-bold text-on-bg text-lg">{v.plate}</p>
                          <p className="text-sm text-on-surface-var whitespace-normal">
                            <span className="font-medium text-on-bg">{getVehicleLabel(v.type)}</span>
                            {v.brand ? ` · ${v.brand}` : ''}
                            {v.model ? ` ${v.model}` : ''}
                          </p>
                          {v.color && (
                            <p className="text-xs text-on-surface-var mt-0.5">
                              Color: {v.color}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleEditVehicle(v)}
                          className="p-2.5 rounded-lg text-on-surface-var hover:text-primary hover:bg-primary/10 transition-colors"
                          title="Editar"
                        >
                          <span className="material-symbols-outlined text-base">edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteVehicle(v.id)}
                          className="p-2.5 rounded-lg text-on-surface-var hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Eliminar"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
           RESERVATIONS TAB
           ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'reservations' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-primary font-headline">Mis Reservas</h2>
              <Button variant="primary" size="sm" onClick={() => setShowReservationModal(true)}>
                <span className="material-symbols-outlined text-sm">add</span>
                Nueva Reserva
              </Button>
            </div>

            {/* Stats row */}
            {reservationStats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <Card variant="glass" padding="sm" className="text-center">
                  <div className="text-lg font-bold text-primary">{reservationStats.active}</div>
                  <div className="text-xs text-on-surface-var">Activas</div>
                </Card>
                <Card variant="glass" padding="sm" className="text-center">
                  <div className="text-lg font-bold text-yellow-400">{reservationStats.pending}</div>
                  <div className="text-xs text-on-surface-var">Pendientes</div>
                </Card>
                <Card variant="glass" padding="sm" className="text-center">
                  <div className="text-lg font-bold text-green-400">{reservationStats.completed}</div>
                  <div className="text-xs text-on-surface-var">Completadas</div>
                </Card>
                <Card variant="glass" padding="sm" className="text-center">
                  <div className="text-lg font-bold text-red-400">{reservationStats.cancelled}</div>
                  <div className="text-xs text-on-surface-var">Canceladas</div>
                </Card>
              </div>
            )}

            {reservationsLoading && reservations.length === 0 ? (
              <Card variant="glass">
                <div className="flex items-center justify-center py-8">
                  <span className="inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              </Card>
            ) : reservations.length === 0 ? (
              <Card variant="glass">
                <div className="text-center py-8 text-on-surface-var text-sm">
                  <span className="material-symbols-outlined text-3xl mb-2 block">
                    calendar_month
                  </span>
                  <p className="mb-4">No tienes reservas</p>
                  <Button variant="primary" size="sm" onClick={() => setShowReservationModal(true)}>
                    + Nueva Reserva
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="space-y-3">
                {reservations.map((r) => (
                  <Card key={r.id} variant="glass" padding="sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div
                          className={`
                            flex items-center justify-center w-10 h-10 rounded-lg shrink-0
                            ${r.status === 'active' ? 'bg-green-500/15' : r.status === 'cancelled' ? 'bg-red-500/15' : r.status === 'completed' ? 'bg-primary/15' : 'bg-yellow-500/15'}
                          `}
                        >
                          <span
                            className={`material-symbols-outlined text-lg ${
                              r.status === 'active' ? 'text-green-400' : r.status === 'cancelled' ? 'text-red-400' : r.status === 'completed' ? 'text-primary' : 'text-yellow-400'
                            }`}
                          >
                            calendar_month
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-on-bg text-sm">
                              {r.date ? formatDate(r.date) : 'Sin fecha'}
                            </p>
                            <Badge
                              variant={
                                r.status === 'active' ? 'success' : r.status === 'cancelled' ? 'error' : r.status === 'completed' ? 'info' : 'warning'
                              }
                            >
                              {getStatusLabel(r.status)}
                            </Badge>
                          </div>
                          <p className="text-sm text-on-surface-var mt-0.5">
                            {r.startTime || r.entryTime?.slice(11, 16) || '--:--'} — {r.endTime || '--:--'}
                          </p>
                          <p className="text-xs text-on-surface-var mt-0.5">
                            Espacio: {r.spotId}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {(r.status === 'pending' || r.status === 'active') && (
                          <>
                            <button
                              onClick={() => handleShowQR(r)}
                              className="p-2.5 rounded-lg text-on-surface-var hover:text-primary hover:bg-primary/10 transition-colors"
                              title="Ver código QR"
                            >
                              <span className="material-symbols-outlined text-base">qr_code</span>
                            </button>
                            <button
                              onClick={() => handleCancelReservation(r.id)}
                              className="p-2.5 rounded-lg text-on-surface-var hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              title="Cancelar reserva"
                            >
                              <span className="material-symbols-outlined text-base">close</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    {r.notes && (
                      <p className="text-xs text-on-surface-var mt-2 pt-2 border-t border-outline/10">
                        {r.notes}
                      </p>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
           PAYMENTS TAB
           ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'payments' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-primary font-headline">Historial de Pagos</h2>
            </div>

            {/* ePayco Payment Button (quick pay from a reservation) */}
            {activeReservations.length > 0 && (
              <Card variant="glass" padding="sm" className="mb-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/15 shrink-0">
                      <span className="material-symbols-outlined text-primary text-lg">payments</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-on-bg text-sm">
                        Paga tu reserva
                      </p>
                      <p className="text-xs text-on-surface-var">
                        Elige tu método de pago preferido
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ManualPaymentButton
                      vehicleId={activeReservations[0]?.vehicleId || vehicles[0]?.id || ''}
                      reservationId={activeReservations[0]?.id}
                      amount={5000}
                    />
                    <PaymentButton
                      amount={5000}
                      vehicleId={activeReservations[0]?.vehicleId || vehicles[0]?.id || ''}
                      reservationId={activeReservations[0]?.id}
                      email={user?.email}
                      label="ePayco"
                      variant="primary"
                      size="sm"
                    />
                  </div>
                </div>
              </Card>
            )}

            {/* Payment List */}
            {paymentsLoading && payments.length === 0 ? (
              <Card variant="glass">
                <div className="flex items-center justify-center py-8">
                  <span className="inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              </Card>
            ) : payments.length === 0 ? (
              <Card variant="glass">
                <div className="text-center py-8 text-on-surface-var text-sm">
                  <span className="material-symbols-outlined text-3xl mb-2 block">
                    payments
                  </span>
                  <p>No hay pagos registrados</p>
                </div>
              </Card>
            ) : (
              <div className="space-y-3">
                {payments.map((p) => (
                  <div key={p.id} className="relative">
                    {/* Show inline ePayco status for pending ePayco payments */}
                    {p.method === 'epayco' && (p.status === 'pending_epayco' || p.status === 'pending') ? (
                      <button
                        onClick={() => handleViewReceipt(p)}
                        className="w-full text-left"
                      >
                        <PaymentStatus
                          payment={p}
                          variant="full"
                          onStatusChange={(newStatus) => handlePaymentStatusChange(p.id, newStatus)}
                          enablePolling={true}
                        />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleViewReceipt(p)}
                        className="w-full text-left"
                      >
                        <PaymentCard payment={p} showVehicleInfo={true} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Receipt Modal ───────────────────────────────────── */}
        {selectedPayment && (
          <ReceiptModal
            payment={selectedPayment}
            open={showReceiptModal}
            onClose={handleCloseReceipt}
            vehiclePlate={
              vehicles.find((v) => v.id === selectedPayment.vehicleId)?.plate
            }
            vehicleType={
              vehicles.find((v) => v.id === selectedPayment.vehicleId)?.type
            }
            userName={
              user ? `${user.nombres} ${user.apellidos}`.trim() || user.username : undefined
            }
          />
        )}

        {/* ═══════════════════════════════════════════════════════════
           SESSIONS TAB
           ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'sessions' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-primary font-headline">Mis Sesiones</h2>
            </div>

            {/* Sessions content inlined from SessionsPage */}
            <SessionsInline />
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
           PROFILE TAB
           ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* User Info */}
            <Card variant="glass" title="Mi Perfil">
              {isEditingProfile ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Nombres"
                      icon="person"
                      value={profileForm.nombres}
                      onChange={(e) => handleProfileChange('nombres', e.target.value)}
                      error={profileErrors.nombres}
                    />
                    <Input
                      label="Apellidos"
                      icon="person"
                      value={profileForm.apellidos}
                      onChange={(e) => handleProfileChange('apellidos', e.target.value)}
                      error={profileErrors.apellidos}
                    />
                    <Input
                      label="Email"
                      icon="mail"
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => handleProfileChange('email', e.target.value)}
                      error={profileErrors.email}
                    />
                    <Input
                      label="Teléfono"
                      icon="phone"
                      value={profileForm.phone}
                      onChange={(e) => handleProfileChange('phone', e.target.value)}
                    />
                    <Input
                      label="Cédula"
                      icon="badge"
                      value={profileForm.cedula}
                      onChange={(e) => handleProfileChange('cedula', e.target.value)}
                      error={profileErrors.cedula}
                      placeholder="Número de cédula"
                    />
                    <Input
                      label="Fecha de Nacimiento"
                      icon="calendar_month"
                      type="date"
                      value={profileForm.fechaNacimiento}
                      onChange={(e) => handleProfileChange('fechaNacimiento', e.target.value)}
                      error={profileErrors.fechaNacimiento}
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <Button variant="ghost" onClick={cancelEditProfile} disabled={profileSaving}>
                      Cancelar
                    </Button>
                    <Button variant="primary" onClick={handleProfileSave} loading={profileSaving}>
                      Guardar Cambios
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-on-surface-var mb-1">Nombres</label>
                      <p className="text-on-bg font-medium">{user?.nombres || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-on-surface-var mb-1">Apellidos</label>
                      <p className="text-on-bg font-medium">{user?.apellidos || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-on-surface-var mb-1">Usuario</label>
                      <p className="text-on-bg font-medium">{user?.username || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-on-surface-var mb-1">Email</label>
                      <p className="text-on-bg font-medium">{user?.email || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-on-surface-var mb-1">Cédula</label>
                      <p className="text-on-bg font-medium">{user?.cedula || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-on-surface-var mb-1">Fecha de Nacimiento</label>
                      <p className="text-on-bg font-medium">{user?.fechaNacimiento ? new Date(user.fechaNacimiento).toLocaleDateString('es-CO') : '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-on-surface-var mb-1">Rol</label>
                      <div>
                        <Badge variant={user?.rol === 'admin' ? 'info' : 'success'}>
                          {user?.rol === 'admin' ? 'Administrador' : 'Usuario'}
                        </Badge>
                      </div>
                    </div>
                    {user?.phone && (
                      <div>
                        <label className="block text-sm text-on-surface-var mb-1">Teléfono</label>
                        <p className="text-on-bg font-medium">{user.phone}</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 pt-4 border-t border-outline/10">
                    <Button variant="secondary" size="sm" onClick={startEditProfile}>
                      <span className="material-symbols-outlined text-sm">edit</span>
                      Editar Perfil
                    </Button>
                  </div>
                </>
              )}
            </Card>

            {/* 2FA Settings */}
            <Card variant="glass" title="Seguridad de la Cuenta">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-primary text-xl">
                      security
                    </span>
                    <div>
                      <p className="font-medium text-on-bg">
                        Autenticación de Dos Factores (2FA)
                      </p>
                      <p className="text-sm text-on-surface-var">
                        {twoFactorEnabled
                          ? `Protegido — ${backupCodesCount} códigos de respaldo disponibles`
                          : 'Añade una capa extra de seguridad a tu cuenta'}
                      </p>
                    </div>
                  </div>
                  <Badge variant={twoFactorEnabled ? 'success' : 'info'}>
                    {twoFactorEnabled ? 'Activado' : 'Desactivado'}
                  </Badge>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant={twoFactorEnabled ? 'secondary' : 'primary'}
                    size="sm"
                    onClick={() => navigate('/2fa/setup')}
                  >
                    <span className="material-symbols-outlined text-sm">security</span>
                    {twoFactorEnabled ? 'Administrar 2FA' : 'Activar 2FA'}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ── Vehicle Modal ────────────────────────────────────────── */}
        <Modal
          open={showVehicleModal}
          onClose={() => { setShowVehicleModal(false); setEditingVehicle(null) }}
          title={editingVehicle ? 'Editar Vehículo' : 'Agregar Vehículo'}
        >
          <VehicleForm
            initialData={
              editingVehicle
                ? {
                    plate: editingVehicle.plate,
                    type: editingVehicle.type,
                    brand: editingVehicle.brand,
                    model: editingVehicle.model,
                    color: editingVehicle.color,
                  }
                : undefined
            }
            onSubmit={handleVehicleSubmit}
            onCancel={() => { setShowVehicleModal(false); setEditingVehicle(null) }}
            isLoading={vehiclesLoading}
            error={vehicleError}
          />
        </Modal>

        {/* ── Reservation Modal ────────────────────────────────────── */}
        <Modal
          open={showReservationModal}
          onClose={() => setShowReservationModal(false)}
          title="Nueva Reserva"
        >
          <ReservationForm
            vehicles={vehicles}
            onSubmit={handleCreateReservation}
            onCancel={() => setShowReservationModal(false)}
            isLoading={reservationsLoading}
            error={reservationError}
          />
        </Modal>

        {/* ── QR Code Modal ──────────────────────────────────────────── */}
        {showQRCode && (
          <Modal
            open={!!showQRCode}
            onClose={() => setShowQRCode(null)}
            title="Código QR de Acceso"
          >
            <QRDisplay
              reservationId={showQRCode.id}
              plate={vehicles.find((v) => v.id === showQRCode.vehicleId)?.plate || '—'}
              status={showQRCode.status}
              onClose={() => setShowQRCode(null)}
            />
          </Modal>
        )}
      </div>
    </UserLayout>
  )
}


