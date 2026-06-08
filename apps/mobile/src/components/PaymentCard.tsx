import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { Payment } from '@punto-park-u/shared-types';

// ── Helpers ────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pendiente', color: '#ff9800', bg: '#ff980015' },
  pending_epayco: { label: 'En proceso', color: '#ff9800', bg: '#ff980015' },
  completed: { label: 'Pagado', color: '#4caf50', bg: '#4caf5015' },
  failed: { label: 'Fallido', color: '#e53935', bg: '#e5393515' },
  refunded: { label: 'Reembolsado', color: '#1a73e8', bg: '#1a73e815' },
};

const METHOD_LABELS: Record<string, string> = {
  cash: 'Efectivo',
  pos: 'POS',
  epayco: 'ePayco',
};

const METHOD_ICONS: Record<string, string> = {
  cash: '💵',
  pos: '💳',
  epayco: '🔄',
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

function formatAmount(amount: number): string {
  return `$${amount.toLocaleString('es-CO')}`;
}

// ── Types ──────────────────────────────────────────────────────────

export interface PaymentCardProps {
  payment: Payment;
  onPress?: () => void;
}

// ── Component ──────────────────────────────────────────────────────

export default function PaymentCard({ payment, onPress }: PaymentCardProps) {
  const status = STATUS_CONFIG[payment.status] || STATUS_CONFIG.pending;
  const methodIcon = METHOD_ICONS[payment.method] || '💳';
  const methodLabel = METHOD_LABELS[payment.method] || payment.method;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.topRow}>
        <View style={styles.methodRow}>
          <Text style={styles.methodIcon}>{methodIcon}</Text>
          <View>
            <Text style={styles.amount}>{formatAmount(payment.amount)}</Text>
            <Text style={styles.method}>{methodLabel}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
          <Text style={[styles.statusLabel, { color: status.color }]}>
            {status.label}
          </Text>
        </View>
      </View>

      <View style={styles.bottomRow}>
        <Text style={styles.date}>
          🗓️ {formatDate(payment.date || payment.createdAt || '')}
        </Text>
        {payment.epaycoRef && (
          <Text style={styles.ref}>Ref: {payment.epaycoRef}</Text>
        )}
      </View>
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
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  methodIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  method: {
    fontSize: 12,
    color: '#888',
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.04)',
    paddingTop: 10,
  },
  date: {
    fontSize: 12,
    color: '#888',
  },
  ref: {
    fontSize: 11,
    color: '#aaa',
    fontFamily: 'monospace',
  },
});
