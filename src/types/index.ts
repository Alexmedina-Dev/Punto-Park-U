export type VehicleType = 'car' | 'moto' | 'bike'

export interface User {
  id: string
  username: string
  email: string
  nombres: string
  apellidos: string
  cedula: string
  fechaNacimiento: string
  rol: 'user' | 'admin'
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
}
