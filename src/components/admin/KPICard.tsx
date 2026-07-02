import React from 'react'
import { Card } from '@/components/ui'
import { formatPercentage } from '@/utils/formatters'

interface KPICardProps {
  title: string
  value: string
  icon: string
  trend?: number[]
  trendColor?: string
  subtitle?: string
  className?: string
}

/**
 * Mini SVG sparkline — draws a simple polyline from a data array.
 */
function Sparkline({ data, color = '#60a5fa' }: { data: number[]; color?: string }) {
  if (!data || data.length < 2) return null

  const width = 80
  const height = 28
  const padding = 2

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const points = data
    .map((val, i) => {
      const x = padding + (i / (data.length - 1)) * (width - 2 * padding)
      const y = height - padding - ((val - min) / range) * (height - 2 * padding)
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="shrink-0"
      aria-hidden="true"
    >
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  )
}

/**
 * Individual KPI card for the admin dashboard.
 * Shows an icon, value, label, subtitle, and optional sparkline.
 */
export function KPICard({
  title,
  value,
  icon,
  trend,
  trendColor,
  subtitle,
  className = '',
}: KPICardProps) {
  return (
    <Card variant="glass" padding="md" className={`flex flex-col gap-2 min-w-0 ${className}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="material-symbols-outlined text-primary text-xl shrink-0">{icon}</span>
          <span className="text-xs font-semibold text-on-surface-var uppercase tracking-wider truncate">
            {title}
          </span>
        </div>
        {trend && <Sparkline data={trend} color={trendColor} />}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-primary font-headline truncate">{value}</span>
        {subtitle && (
          <span className="text-xs text-on-surface-var shrink-0">{subtitle}</span>
        )}
      </div>
    </Card>
  )
}
