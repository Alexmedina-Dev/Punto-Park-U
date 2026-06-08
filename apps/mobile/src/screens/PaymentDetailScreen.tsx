import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Payment } from '@punto-park-u/shared-types';
import { COLORS, RADIUS, SPACING, FONT, PAYMENT_STATUS, PAYMENT_METHODS, APP_METADATA } from '../constants/app';
import { formatCurrency, formatDate, formatDateTime, formatReference } from '../utils/formatters';
import { useFadeIn } from '../hooks/useAnimation';
import { useStaggeredList } from '../hooks/useAnimation';

// ── Types ─────────────────────────────────────────────────────────────

export interface PaymentDetailParams {
  payment: Payment;
}

// ── PaymentDetailScreen ───────────────────────────────────────────────

export default function PaymentDetailScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { payment } = route.params || {};
  const { opacity } = useFadeIn(0);

  // ── Status Config ──

  const statusConfig = PAYMENT_STATUS[payment?.status as keyof typeof PAYMENT_STATUS] || PAYMENT_STATUS.pending;
  const methodInfo = PAYMENT_METHODS[payment?.method as keyof typeof PAYMENT_METHODS] || { label: payment?.method || '—', icon: '💳' };

  // ─── Animated items ──

  const detailItems = [
    { label: 'ID', value: payment?.id || '—' },
    { label: 'Fecha', value: payment?.date ? formatDateTime(payment.date) : '—' },
    { label: 'Método', value: methodInfo.label },
    { label: 'Estado', value: statusConfig.label },
    ...(payment?.epaycoRef ? [{ label: 'Ref. ePayco', value: formatReference(payment.epaycoRef) }] : []),
    ...(payment?.amount ? [{ label: 'Monto', value: formatCurrency(payment.amount) }] : []),
  ];

  // ── Handlers ──

  const handleShare = useCallback(async () => {
    if (!payment) return;
    try {
      await Share.share({
        message:
          `Pago Punto Park U\n\n` +
          `💰 Monto: ${formatCurrency(payment.amount)}\n` +
          `📄 ID: ${payment.id}\n` +
          `📅 Fecha: ${formatDateTime(payment.date)}\n` +
          `💳 Método: ${methodInfo.label}\n` +
          `${payment.epaycoRef ? `🔗 ePayco: ${formatReference(payment.epaycoRef)}\n` : ''}` +
          `📊 Estado: ${statusConfig.label}`,
      });
    } catch {
      // User cancelled
    }
  }, [payment, methodInfo, statusConfig]);

  const handleContactSupport = useCallback(async () => {
    try {
      await Linking.openURL(`mailto:${APP_METADATA.supportEmail}?subject=Consulta%20pago%20${payment?.id}`);
    } catch {
      Alert.alert('Contactar soporte', `Escríbenos a ${APP_METADATA.supportEmail}`);
    }
  }, [payment]);

  // ── Guard ──

  if (!payment) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation?.goBack()}>
            <Text style={styles.backButton}>← Volver</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Pago no encontrado</Text>
        </View>
      </View>
    );
  }

  const canRetry = payment.status === 'failed' || payment.status === 'pending_epayco';

  // ── Render ──

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()}>
          <Text style={styles.backButton}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Detalle de pago</Text>
        <TouchableOpacity onPress={handleShare}>
          <Text style={styles.shareButton}>Compartir</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Hero */}
        <View style={[styles.statusHero, { backgroundColor: statusConfig.bg }]}>
          <Text style={styles.statusIcon}>{statusConfig.icon}</Text>
          <Text style={[styles.statusLabel, { color: statusConfig.color }]}>
            {statusConfig.label}
          </Text>
          <Text style={styles.statusAmount}>
            {formatCurrency(payment.amount)}
          </Text>
        </View>

        {/* Detail Card */}
        <View style={styles.detailCard}>
          {detailItems.map((d, index) => (
            <View
              key={d.label}
              style={[
                styles.detailRow,
                index < detailItems.length - 1 && styles.detailRowBorder,
              ]}
            >
              <Text style={styles.detailLabel}>{d.label}</Text>
              <Text style={styles.detailValue}>{d.value}</Text>
            </View>
          ))}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {canRetry && (
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                navigation?.replace('Checkout', {
                  reservation: { id: payment.reservationId },
                  amount: payment.amount,
                });
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.retryIcon}>🔄</Text>
              <Text style={styles.retryLabel}>Intentar de nuevo</Text>
            </TouchableOpacity>
          )}

          {payment.status === 'failed' && (
            <TouchableOpacity
              style={styles.supportButton}
              onPress={handleContactSupport}
              activeOpacity={0.7}
            >
              <Text style={styles.supportIcon}>📧</Text>
              <Text style={styles.supportLabel}>Contactar soporte</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    fontSize: FONT.size.md,
    color: COLORS.primary,
    fontWeight: FONT.weight.medium,
  },
  title: {
    fontSize: FONT.size.lg,
    fontWeight: FONT.weight.bold,
    color: COLORS.text,
  },
  shareButton: {
    fontSize: FONT.size.sm,
    color: COLORS.primary,
    fontWeight: FONT.weight.medium,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingTop: SPACING.sm,
  },
  statusHero: {
    alignItems: 'center',
    padding: SPACING.xl,
    borderRadius: RADIUS.xxl,
    marginBottom: SPACING.md,
  },
  statusIcon: {
    fontSize: 36,
    marginBottom: SPACING.sm,
  },
  statusLabel: {
    fontSize: FONT.size.lg,
    fontWeight: FONT.weight.bold,
    marginBottom: SPACING.xs,
  },
  statusAmount: {
    fontSize: FONT.size.xxl,
    fontWeight: FONT.weight.black,
    color: COLORS.text,
  },
  detailCard: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.xxl,
    padding: SPACING.md,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  detailRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  detailLabel: {
    fontSize: FONT.size.sm,
    color: COLORS.textSecondary,
    flex: 1,
  },
  detailValue: {
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.semibold,
    color: COLORS.text,
    textAlign: 'right',
    flex: 1.5,
  },
  actions: {
    gap: SPACING.sm,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  retryIcon: {
    fontSize: 16,
  },
  retryLabel: {
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.bold,
    color: COLORS.textInverse,
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  supportIcon: {
    fontSize: 16,
  },
  supportLabel: {
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.semibold,
    color: COLORS.text,
  },
  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFoundText: {
    fontSize: FONT.size.md,
    color: COLORS.textTertiary,
  },
});
