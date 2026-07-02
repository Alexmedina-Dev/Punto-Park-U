// ╔══════════════════════════════════════════════════════════════════════╗
// ║  @punto-park-u/shared-types                                         ║
// ║  All shared TypeScript types, interfaces, and enums                 ║
// ╚══════════════════════════════════════════════════════════════════════╝

// ── API Response Types ──

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasMore: boolean
  }
}

export interface ApiError {
  success: false
  message: string
  errors?: Record<string, string[]>
}

export interface AuthResponse {
  user: User
  token: string
  accessToken?: string
  refreshToken?: string
}

export interface AdminStats {
  totalVehicles: number
  totalRevenue: number
  occupancyRate: number
  totalUsers: number
  activeReservations: number
  revenueToday: number
  entriesToday: number
  averageParkingTime?: number
  activeOperators?: number
  peakHour?: string
  vehiclesTodayTrend?: number[]
  revenueTodayTrend?: number[]
  occupancyTrend?: number[]
}

export interface ActivityLog {
  id: string
  action: string
  description: string
  user: string
  userRole: string
  timestamp: string
  type: 'create' | 'update' | 'delete' | 'payment' | 'entry' | 'exit'
}

export interface Alert {
  id: string
  type: 'warning' | 'error' | 'info' | 'success'
  title: string
  message: string
  timestamp: string
  resolved: boolean
}

export interface HourlyOccupancy {
  hour: string
  count: number
  capacity: number
}

export interface ParkedVehicle {
  id: string
  plate: string
  type: VehicleType
  brand: string
  model: string
  color: string
  zone: string
  entryTime: string
  duration: string
  paymentStatus: 'paid' | 'pending'
  operator: string
}

export interface ReportData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    color: string
  }[]
}

export interface RetryConfig {
  maxRetries: number
  baseDelay: number
  maxDelay: number
}

export type VehicleType = 'car' | 'moto' | 'bike'

export type UserRole = 'admin' | 'operator' | 'user' | 'guest'

export interface User {
  id: string
  username: string
  email: string
  nombres: string
  apellidos: string
  cedula: string
  fechaNacimiento?: string
  rol: UserRole
  role?: UserRole
  phone?: string
  isVerified?: boolean
  authProvider?: string
  googlePicture?: string
  createdAt?: string
}

export interface UserStats {
  admin: number
  operator: number
  user: number
  guest: number
  total: number
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasMore: boolean
  }
}

export interface UpdateRolePayload {
  role: UserRole
}

export interface Vehicle {
  id: string
  plate: string
  type: VehicleType
  brand: string
  model: string
  color: string
  ownerId: string
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export interface PriceSet {
  hour: number
  day: number
  month: number
}

export interface PricingConfig {
  car: PriceSet
  moto: PriceSet
  bike: PriceSet
}

export interface TimeRange {
  open: string
  close: string
}

export interface Schedule {
  weekday: TimeRange
  sunday: TimeRange
}

export type SpotType = 'car' | 'moto' | 'bike'

export type SpotStatus = 'libre' | 'ocupado' | 'reservado'

export interface ParkingSpot {
  id: string
  code: string
  zone: 'A' | 'B' | 'C'
  type: SpotType
  status: SpotStatus
  floor?: number | null
  accessible?: boolean
  plate?: string
}

export interface ParkingStats {
  cars: { used: number; total: number }
  motos: { used: number; total: number }
  bikes: { used: number; total: number }
}

export interface ParkingEntry {
  plate: string
  type: VehicleType
  entryTime: string
  duration: string
  zone: 'A' | 'B' | 'C'
  status: 'active'
  payment: 'paid' | 'pending'
  operator: string
}

// ── Report Types ──

export interface ReportFilters {
  period: 'today' | 'week' | 'month' | 'custom'
  type: 'all' | 'car' | 'moto' | 'bike'
  payment: 'all' | 'cash' | 'pos' | 'epayco' | 'nequi' | 'daviplata' | 'transfer'
  dateFrom?: string
  dateTo?: string
}

export interface ReportSummary {
  totalIngresos: number
  totalVehiculos: number
  tasaOcupacion: number
  ticketPromedio: number
  tiempoPromedio: string
  ingresosPorHora: number
}

export interface ReportBreakdown {
  tipo: string
  cantidad: number
  ingresos: number
  porcentaje: number
}

export interface ReportPaymentKPI {
  efectivo: number
  pos: number
  epayco: number
  nequi: number
  daviplata: number
  transfer: number
}

export interface ReportKPI {
  label: string
  value: string
  detail?: string
  status?: 'ok' | 'warning' | 'error'
}

export interface ReportRow {
  placa: string
  tipo: string
  ingreso: string
  salida: string
  duracion: string
  tarifa: string
  pago: string
  conductor: string
}

export interface ReportMeta {
  title: string
  subtitle: string
  generatedAt: string
  period: string
}

export interface ReportContent {
  meta: ReportMeta
  summary: ReportSummary
  breakdown: ReportBreakdown[]
  kpis: ReportKPI[]
  rows: ReportRow[]
  prices?: PricingConfig
}

export interface DailyIncome {
  label: string
  income: number
  previous: number
}

export interface OccupancyByType {
  type: string
  percentage: number
  color: string
}

export interface PaymentMethodStat {
  method: string
  amount: number
  color: string
}

export interface Reservation {
  id: string
  userId: string
  vehicleId: string
  spotId: string
  entryTime: string
  exitTime?: string
  billingAmount?: number
  date: string
  startTime: string
  endTime: string
  notes: string
  status: 'pending' | 'active' | 'completed' | 'cancelled'
  createdAt?: string
  updatedAt?: string
}

export interface Ticket {
  id: string
  reservationId: string
  qrCode: string
  qrData: string
  plate: string
  validatedEntry: boolean
  validatedExit: boolean
  entryValidatedAt?: string
  exitValidatedAt?: string
  createdAt: string
}

export interface QRValidationResult {
  message: string
  reservationId: string
  plate: string
  spot: string | null
  entryTime?: string
  exitTime?: string
  duration?: string
  durationMinutes?: number
  billingAmount?: number
  status: string
}

export interface Payment {
  id: string
  userId: string
  vehicleId: string
  reservationId?: string
  amount: number
  method: 'cash' | 'pos' | 'epayco' | 'pending' | 'nequi' | 'daviplata' | 'transfer'
  status: 'pending' | 'pending_epayco' | 'completed' | 'failed' | 'refunded'
  date: string
  epaycoRef?: string | null
  checkoutUrl?: string | null
  manualPaymentProof?: string | null
  confirmedBy?: string | null
  confirmedAt?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface NotificationSettings {
  email: boolean
  sms: boolean
  whatsapp: boolean
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface RegisterData {
  nombres: string
  apellidos: string
  cedula: string
  fechaNacimiento: string
  username: string
  password: string
  confirmPassword: string
  email?: string
}

// ── 2FA Types ──

export interface TwoFactorStatus {
  twoFactorEnabled: boolean
  backupCodesCount: number
}

export interface TwoFactorSetupData {
  secret: string
  qrCode: string
  otpauthUrl: string
}

export interface TwoFactorVerifySetupResponse {
  message: string
  backupCodes: string[]
  user: User
}

export interface TwoFactorVerifyResponse {
  user: User
  token: string
  accessToken: string
  refreshToken: string
}

export interface TwoFactorBackupCodesResponse {
  backupCodes: string[]
}

export interface LoginResponse2FA {
  user: User
  requiresTwoFactor: true
  tempToken: string
}

// ── Session Types ──

export interface SessionData {
  id: string
  userId: string
  ipAddress: string
  userAgent: string
  device: string
  createdAt: string
  lastActiveAt: string
  expiresAt: string
  isCurrent: boolean
  isExpired: boolean
  isInactive: boolean
}

export interface SessionStats {
  total: number
  active: number
  revoked: number
  expired: number
}

// ── WebSocket Types ──

export interface WsSpotUpdate {
  id: string
  zone: string
  status: 'libre' | 'ocupado' | 'reservado'
  vehicleType?: string
  plate?: string
}

export interface WsAlertEvent {
  id: string
  type: string
  message: string
  severity?: string
  zone?: string
  timestamp: string
  resolved: boolean
  createdAt?: string
  updatedAt?: string
}

export interface WsActivityEvent {
  id: string
  action: string
  userId?: string
  type: string
  details?: Record<string, unknown>
  timestamp: string
}

// ── Notification Types (shared-api) ──

export interface AppNotification {
  id: string
  type: 'reservation_reminder' | 'payment_confirmed' | 'entry_alert' | 'exit_alert' | 'system_alert'
  title: string
  message: string
  data: Record<string, unknown>
  read: boolean
  readAt: string | null
  createdAt: string
  updatedAt: string
}

export interface NotificationsResponse {
  notifications: AppNotification[]
  total: number
  unreadCount: number
  limit: number
  offset: number
}

// ── Shared Configuration Types ──

export interface StorageAdapter {
  getItem(key: string): Promise<string | null> | string | null
  setItem(key: string, value: string): Promise<void> | void
  removeItem(key: string): Promise<void> | void
}

export interface ApiConfig {
  baseURL: string
  timeout: number
  getToken: () => Promise<string | null> | string | null
  getRefreshToken?: () => Promise<string | null> | string | null
  onAuthFailure?: () => void
  debug?: boolean
}

export interface AppError {
  message: string
  code?: string
  status?: number
  details?: string[]
}

// ── Analytics / Anomaly Types ──

export interface AnomalyStats {
  todayPrediction: number
  peakHourPrediction: string
  accuracy: number
  anomalyCount24h: number
  mae: number
  rmse: number
  r2: number
  earlyPredictionRate: number
  predictionsLast7Days: number
  status: 'active' | 'training'
  lastTrained?: string
  trainingDataCount: number
  falsePositiveRate: number
  falseNegativeRate: number
}

export interface Anomaly {
  _id: string
  type: string
  severity: 'low' | 'medium' | 'high'
  title: string
  message: string
  score?: number
  timestamp: string
  resolved: boolean
  resolvedAt?: string
}

// ── Pricing Types ──

export interface PricingTier {
  multiplier: number
  label: string
  discount?: number
  surcharge?: number
}

export interface PricingStats {
  enabled: boolean
  currentTier: string
  currentMultiplier: number
  currentPricing: {
    hour: number
    day: number
    month: number
  }
  revenueToday: number
  revenueYesterday: number
  change: number
  tiers: Record<string, PricingTier>
}

export interface PricingForecast {
  hour: string
  tier: string
  price: number
  label: string
}

export interface PricingSettings {
  enabled: boolean
  rules: {
    lowThreshold: number
    highThreshold: number
    peakThreshold: number
  }
}

// ── Hardware / IoT Types ──

export interface HardwareSensor {
  spotId: string
  code: string
  zone: string
  type: VehicleType
  status: string
  hardwareId: string | null
  sensorStatus: 'online' | 'offline' | 'unknown'
  lastSensorUpdate: string | null
  sensorValue: number | null
  isConnected: boolean
}

export interface HardwareStatus {
  mqtt: {
    connected: boolean
    broker: string
    subscribedTopic: string
  }
  sensors: {
    total: number
    online: number
    offline: number
    unknown: number
  }
}

export interface BarrierStatus {
  id: string
  name: string
  location: string
  type: 'entry' | 'exit'
  isOpen: boolean
  lastActivatedAt: string | null
  autoCloseIn: number | null
  error: string | null
}

export interface CameraResult {
  plate: string
  confidence: number
  boundingBox: {
    x: number
    y: number
    width: number
    height: number
  }
  imageBase64?: string
  timestamp: string
}
