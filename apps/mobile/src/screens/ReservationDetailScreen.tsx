import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useReservationStore } from '@punto-park-u/shared-stores';
import type { Reservation } from '@punto-park-u/shared-types';
import ConfirmDialog from '../components/ConfirmDialog';

// ── Helpers ────────────────────────────────────────────────────────

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
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatAmount(amount?: number): string {
  if (amount == null) return '—';
  return `$${amount.toLocaleString('es-CO')}`;
}

// ── ReservationDetailScreen ────────────────────────────────────────

export default function ReservationDetailScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { reservation: initialRes } = route.params || {};
  const { reservations, cancelReservation } = useReservationStore();
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Fresh data
  const reservation =
    reservations.find((r: Reservation) => r.id === initialRes?.id) || initialRes;

  // ── Handlers ──

  const handleQR = useCallback(async () => {
    // QR functionality will be added in a follow-up PR with the QR service
    Alert.alert('QR Ticket', 'La funcionalidad de QR estará disponible próximamente.');
  }, []);

  const handlePay = useCallback(() => {
    if (!reservation) return;
    navigation?.navigate('Checkout', {
      reservation,
      amount: reservation.billingAmount || 0,
    });
  }, [reservation, navigation]);

  const handleCancel = useCallback(async () => {
    if (!reservation) return;
    const success = await cancelReservation(reservation.id);
    setShowCancelDialog(false);
    if (success) {
      Alert.alert('Cancelada', 'Reserva cancelada correctamente');
    } else {
      Alert.alert('Error', 'No se pudo cancelar la reserva');
    }
  }, [reservation, cancelReservation]);

  const handleShare = useCallback(async () => {
    if (!reservation) return;
    try {
      await Share.share({
        message: `Reserva Punto Park U\n\n📅 ${formatDate(reservation.date || reservation.entryTime)}\n⏰ ${reservation.startTime} - ${reservation.endTime}\n🅿️ Spot: ${reservation.spotId}`,
      });
    } catch {
      // User cancelled share
    }
  }, [reservation]);

  // ── Guard ──

  if (!reservation) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation?.goBack()}>
            <Text style={styles.backButton}>← Volver</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Reserva no encontrada</Text>
        </View>
      </View>
    );
  }

  const status = STATUS_CONFIG[reservation.status] || STATUS_CONFIG.pending;
  const canCancel = reservation.status === 'pending' || reservation.status === 'active';

  const details = [
    { label: 'Fecha', value: formatDate(reservation.date || reservation.entryTime) },
    { label: 'Hora de inicio', value: reservation.startTime || '—' },
    { label: 'Hora de fin', value: reservation.endTime || '—' },
    { label: 'Spot', value: reservation.spotId || '—' },
    { label: 'Notas', value: reservation.notes || '—' },
  ];

  if (reservation.billingAmount != null) {
    details.push({ label: 'Monto', value: formatAmount(reservation.billingAmount) });
  }

  // ── Render ──

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()}>
          <Text style={styles.backButton}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Detalle</Text>
        <TouchableOpacity onPress={handleShare}>
          <Text style={styles.shareButton}>Compartir</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Hero */}
        <View style={[styles.statusHero, { backgroundColor: status.bg }]}>
          <Text style={styles.statusIcon}>{status.icon}</Text>
          <Text style={[styles.statusLabel, { color: status.color }]}>
            {status.label}
          </Text>
        </View>

        {/* Detail Card */}
        <View style={styles.detailCard}>
          {details.map((d, index) => (
            <View
              key={d.label}
              style={[
                styles.detailRow,
                index < details.length - 1 && styles.detailRowBorder,
              ]}
            >
              <Text style={styles.detailLabel}>{d.label}</Text>
              <Text style={styles.detailValue}>{d.value}</Text>
            </View>
          ))}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.qrButton}
            onPress={handleQR}
            activeOpacity={0.7}
          >
            <Text style={styles.qrIcon}>📱</Text>
            <Text style={styles.qrLabel}>Ver QR Ticket</Text>
          </TouchableOpacity>

          {reservation?.status === 'pending' && reservation?.billingAmount != null && (
            <TouchableOpacity
              style={styles.payButton}
              onPress={handlePay}
              activeOpacity={0.7}
            >
              <Text style={styles.payIcon}>💳</Text>
              <Text style={styles.payLabel}>
                Pagar ${reservation.billingAmount.toLocaleString('es-CO')}
              </Text>
            </TouchableOpacity>
          )}

          {canCancel && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowCancelDialog(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelIcon}>❌</Text>
              <Text style={styles.cancelLabel}>Cancelar Reserva</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Cancel Confirmation */}
      <ConfirmDialog
        visible={showCancelDialog}
        title="Cancelar Reserva"
        message="¿Estás seguro de cancelar esta reserva? Esta acción no se puede deshacer."
        confirmLabel="Cancelar"
        cancelLabel="Volver"
        destructive
        onConfirm={handleCancel}
        onCancel={() => setShowCancelDialog(false)}
      />
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    fontSize: 16,
    color: '#1a73e8',
    fontWeight: '500',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  shareButton: {
    fontSize: 14,
    color: '#1a73e8',
    fontWeight: '500',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 8,
  },
  statusHero: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
  },
  statusIcon: {
    fontSize: 28,
    marginRight: 10,
  },
  statusLabel: {
    fontSize: 20,
    fontWeight: '700',
  },
  detailCard: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  detailRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  detailLabel: {
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
    flex: 1,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a2e',
    textAlign: 'right',
    flex: 1.5,
  },
  actions: {
    gap: 12,
  },
  qrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a73e8',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#1a73e8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  qrIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  qrLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#e53935',
  },
  cancelIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  cancelLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e53935',
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22c55e',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  payIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  payLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFoundText: {
    fontSize: 16,
    color: '#888',
  },
});
