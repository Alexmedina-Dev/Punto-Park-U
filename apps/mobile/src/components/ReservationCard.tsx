import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { Reservation } from '@punto-park-u/shared-types';

// ── Status Helpers ─────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  pending: { label: 'Pendiente', color: '#ff9800', bg: '#ff980015', icon: '⏳' },
  active: { label: 'Activa', color: '#4caf50', bg: '#4caf5015', icon: '✅' },
  completed: { label: 'Completada', color: '#1a73e8', bg: '#1a73e815', icon: '✔️' },
  cancelled: { label: 'Cancelada', color: '#e53935', bg: '#e5393515', icon: '❌' },
};

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

// ── Types ──────────────────────────────────────────────────────────

export interface ReservationCardProps {
  reservation: Reservation;
  onPress?: () => void;
  onLongPress?: () => void;
}

// ── Component ──────────────────────────────────────────────────────

export default function ReservationCard({
  reservation,
  onPress,
  onLongPress,
}: ReservationCardProps) {
  const status = STATUS_CONFIG[reservation.status] || STATUS_CONFIG.pending;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
      delayLongPress={500}
    >
      <View style={styles.header}>
        <View style={styles.dateRow}>
          <Text style={styles.icon}>📅</Text>
          <Text style={styles.date}>
            {formatDate(reservation.date || reservation.entryTime)}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
          <Text style={styles.statusIcon}>{status.icon}</Text>
          <Text style={[styles.statusLabel, { color: status.color }]}>
            {status.label}
          </Text>
        </View>
      </View>

      <View style={styles.detailRow}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Inicio</Text>
          <Text style={styles.detailValue}>{reservation.startTime || '—'}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Fin</Text>
          <Text style={styles.detailValue}>{reservation.endTime || '—'}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Spot</Text>
          <Text style={styles.detailValue}>{reservation.spotId || '—'}</Text>
        </View>
      </View>

      {reservation.notes && (
        <Text style={styles.notes} numberOfLines={1}>
          📝 {reservation.notes}
        </Text>
      )}
    </TouchableOpacity>
  );
}

// ── Styles ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 16,
    marginRight: 6,
  },
  date: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    gap: 16,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a2e',
  },
  notes: {
    fontSize: 12,
    color: '#888',
    marginTop: 10,
    fontStyle: 'italic',
  },
});
