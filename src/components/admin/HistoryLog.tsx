import React from 'react'
import { Card, Badge } from '@/components/ui'
import type { ActivityLog } from '@/types'
import { formatDateTime } from '@/utils/formatters'

interface HistoryLogProps {
  entries: ActivityLog[]
  className?: string
}

const typeIcons: Record<string, string> = {
  create: 'add_circle',
  update: 'edit',
  delete: 'delete',
  payment: 'payments',
  entry: 'login',
  exit: 'logout',
}

const typeColors: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
  create: 'success',
  update: 'info',
  delete: 'error',
  payment: 'success',
  entry: 'info',
  exit: 'warning',
}

/**
 * History log table — "Historial de Cambios".
 * Displays a paginated log of admin actions.
 */
export function HistoryLog({ entries, className = '' }: HistoryLogProps) {
  if (entries.length === 0) {
    return (
      <Card variant="glass" title="Historial de Cambios" className={className}>
        <div className="text-center py-6 text-on-surface-var text-sm">
          <span className="material-symbols-outlined text-3xl mb-2 block">history</span>
          <p>No hay cambios registrados.</p>
        </div>
      </Card>
    )
  }

  return (
    <Card variant="glass" title="Historial de Cambios" className={className}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-outline/10">
              <th className="text-left py-2 px-3 text-on-surface-var font-semibold">Tipo</th>
              <th className="text-left py-2 px-3 text-on-surface-var font-semibold">Acción</th>
              <th className="text-left py-2 px-3 text-on-surface-var font-semibold hidden sm:table-cell">Descripción</th>
              <th className="text-left py-2 px-3 text-on-surface-var font-semibold hidden md:table-cell">Usuario</th>
              <th className="text-right py-2 px-3 text-on-surface-var font-semibold hidden md:table-cell">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} className="border-b border-outline/5 hover:bg-surface-container/40 transition-colors">
                <td className="py-2.5 px-3">
                  <span className={`material-symbols-outlined text-sm ${
                    typeColors[entry.type] === 'success' ? 'text-green-400' :
                    typeColors[entry.type] === 'warning' ? 'text-yellow-400' :
                    typeColors[entry.type] === 'error' ? 'text-red-400' :
                    'text-primary'
                  }`}>
                    {typeIcons[entry.type] || 'info'}
                  </span>
                </td>
                <td className="py-2.5 px-3 font-medium">{entry.action}</td>
                <td className="py-2.5 px-3 text-on-surface-var hidden sm:table-cell">{entry.description}</td>
                <td className="py-2.5 px-3 hidden md:table-cell">
                  <Badge variant={entry.userRole === 'admin' ? 'info' : entry.userRole === 'operator' ? 'warning' : 'success'}>
                    {entry.user}
                  </Badge>
                </td>
                <td className="py-2.5 px-3 text-right text-on-surface-var text-xs hidden md:table-cell">
                  {formatDateTime(entry.timestamp)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
