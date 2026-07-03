import React from 'react'
import { Card } from '@/components/ui'
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters'
import type { ReportSummary, ReportPaymentKPI } from '@/types'

interface ReportKPIsProps {
  summary: ReportSummary
  paymentTotals: ReportPaymentKPI
  projection: number
  className?: string
}

interface KPIItemProps {
  title: string
  value: string
  icon: string
  trend?: 'up' | 'down' | 'neutral'
  subtitle?: string
}

function KPIItem({ title, value, icon, trend, subtitle }: KPIItemProps) {
  const trendColors: Record<string, string> = {
    up: 'text-green-400',
    down: 'text-red-400',
    neutral: 'text-on-surface-var',
  }

  return (
    <Card variant="glass" padding="md" className="flex flex-col gap-2 min-w-0">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="material-symbols-outlined text-primary text-xl shrink-0">{icon}</span>
          <span className="text-xs font-semibold text-on-surface-var uppercase tracking-wider truncate">
            {title}
          </span>
        </div>
        {trend && (
          <span className={`material-symbols-outlined text-base shrink-0 ${trendColors[trend]}`}>
            {trend === 'up' ? 'trending_up' : trend === 'down' ? 'trending_down' : 'remove'}
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-bold text-primary font-headline truncate">{value}</span>
        {subtitle && (
          <span className="text-xs text-on-surface-var shrink-0">{subtitle}</span>
        )}
      </div>
    </Card>
  )
}

/**
 * 10 KPI cards for the admin reports tab.
 * Matches the vanilla Punto Park U KPIs:
 *   1. Ingresos del período
 *   2. Vehículos atendidos
 *   3. Tasa de ocupación
 *   4. Ticket promedio
 *   5. Tiempo promedio
 *   6. Ingreso por hora operativa
 *   7. Efectivo
 *   8. Datáfono
 *   9. ePayco
 *   10. Proyección del mes
 */
export function ReportKPIs({ summary, paymentTotals, projection, className = '' }: ReportKPIsProps) {
  return (
    <div className={className}>
      <h3 className="text-base font-bold text-primary font-headline mb-3">
        Indicadores Clave
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* 1. Ingresos del período */}
        <KPIItem
          title="Ingresos del período"
          value={formatCurrency(summary.totalIngresos)}
          icon="payments"
          trend="up"
        />

        {/* 2. Vehículos atendidos */}
        <KPIItem
          title="Vehículos atendidos"
          value={formatNumber(summary.totalVehiculos)}
          icon="directions_car"
          trend="up"
        />

        {/* 3. Tasa de ocupación */}
        <KPIItem
          title="Tasa de ocupación"
          value={formatPercentage(summary.tasaOcupacion / 100)}
          icon="donut_large"
          trend="neutral"
        />

        {/* 4. Ticket promedio */}
        <KPIItem
          title="Ticket promedio"
          value={formatCurrency(summary.ticketPromedio)}
          icon="receipt"
          trend="up"
        />

        {/* 5. Tiempo promedio */}
        <KPIItem
          title="Tiempo promedio"
          value={summary.tiempoPromedio}
          icon="schedule"
          subtitle="estadía"
        />

        {/* 6. Ingreso por hora operativa */}
        <KPIItem
          title="Ingreso por hora"
          value={formatCurrency(summary.ingresosPorHora)}
          icon="speed"
          trend="up"
        />

        {/* 7. Efectivo */}
        <KPIItem
          title="Efectivo"
          value={formatCurrency(paymentTotals.efectivo)}
          icon="payments"
          subtitle="recaudado"
        />

        {/* 8. Datáfono */}
        <KPIItem
          title="Datáfono"
          value={formatCurrency(paymentTotals.pos)}
          icon="credit_card"
          subtitle="recaudado"
        />

        {/* 9. ePayco */}
        <KPIItem
          title="ePayco"
          value={formatCurrency(paymentTotals.epayco)}
          icon="account_balance"
          subtitle="recaudado"
        />

        {/* 10. Nequi */}
        <KPIItem
          title="Nequi"
          value={formatCurrency(paymentTotals.nequi)}
          icon="smartphone"
          subtitle="recaudado"
        />

        {/* 11. Daviplata */}
        <KPIItem
          title="Daviplata"
          value={formatCurrency(paymentTotals.daviplata)}
          icon="account_balance_wallet"
          subtitle="recaudado"
        />

        {/* 12. Transferencia */}
        <KPIItem
          title="Transferencia"
          value={formatCurrency(paymentTotals.transfer)}
          icon="swap_horiz"
          subtitle="recaudado"
        />

        {/* 13. Proyección del mes */}
        <KPIItem
          title="Proyección del mes"
          value={formatCurrency(projection)}
          icon="trending_up"
          subtitle="estimado"
          trend="up"
        />
      </div>
    </div>
  )
}
