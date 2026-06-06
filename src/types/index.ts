// ── API Response Types ──

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
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
}

export interface ReportData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    color: string
  }[]
}

export interface UserStats {
  totalVehicles: number
  activeReservations: number
  totalReservations: number
  pendingPayments: number
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
  color: string
  year: string
  userId: string
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

export interface ParkingSpot {
  id: string
  zone: 'A' | 'B' | 'C'
  status: 'libre' | 'ocupado' | 'reservado'
  vehicleType?: VehicleType
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

export interface Reservation {
  id: string
  plate: string
  spot: string
  startTime: string
  paymentType: 'prepaid' | 'postpaid'
  status: 'active' | 'cancelled' | 'completed'
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
