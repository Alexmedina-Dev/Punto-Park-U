import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { COLORS, RADIUS, SPACING, FONT, EPAYCO } from '../constants/app';
import { formatCurrency } from '../utils/formatters';
import { useScaleIn } from '../hooks/useAnimation';

// ── Types ─────────────────────────────────────────────────────────────

export interface PriceBreakdown {
  label: string;
  amount: number;
}

export interface CheckoutFormProps {
  reservationDetails: Array<{ label: string; value: string }>;
  priceBreakdown: PriceBreakdown[];
  total: number;
  selectedMethod: string;
  onMethodSelect: (methodId: string) => void;
  onPay: () => void;
  onCancel: () => void;
  isProcessing: boolean;
  error?: string | null;
  onDismissError?: () => void;
}

// ── Payment Method Option ─────────────────────────────────────────────

function MethodOption({
  method,
  selected,
  onSelect,
}: {
  method: (typeof EPAYCO.methods)[number];
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.methodCard,
        selected && styles.methodCardSelected,
      ]}
      onPress={onSelect}
      activeOpacity={0.7}
    >
      <View style={styles.methodRadio}>
        {selected && <View style={styles.methodRadioInner} />}
      </View>
      <Text style={styles.methodIcon}>{method.icon}</Text>
      <View style={styles.methodInfo}>
        <Text
          style={[
            styles.methodLabel,
            selected && styles.methodLabelSelected,
          ]}
        >
          {method.label}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ── Component ─────────────────────────────────────────────────────────

export default function CheckoutForm({
  reservationDetails,
  priceBreakdown,
  total,
  selectedMethod,
  onMethodSelect,
  onPay,
  onCancel,
  isProcessing,
  error,
  onDismissError,
}: CheckoutFormProps) {
  const { opacity, animateIn } = useScaleIn(0.95);

  // ── Pay handler ──

  const handlePay = useCallback(() => {
    if (!selectedMethod) return;
    onPay();
  }, [selectedMethod, onPay]);

  // ── Render ──

  return (
    <Animated.View
      style={[styles.container, { opacity, transform: [{ scale: opacity }] }]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Reservation Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumen de reserva</Text>
          <View style={styles.detailCard}>
            {reservationDetails.map((detail) => (
              <View key={detail.label} style={styles.detailRow}>
                <Text style={styles.detailLabel}>{detail.label}</Text>
                <Text style={styles.detailValue}>{detail.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Price Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalle del pago</Text>
          <View style={styles.detailCard}>
            {priceBreakdown.map((item) => (
              <View key={item.label} style={styles.detailRow}>
                <Text style={styles.detailLabel}>{item.label}</Text>
                <Text style={styles.detailValue}>
                  {formatCurrency(item.amount)}
                </Text>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
            </View>
          </View>
        </View>

        {/* Payment Method Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Método de pago</Text>
          {EPAYCO.methods.map((method) => (
            <MethodOption
              key={method.id}
              method={method}
              selected={selectedMethod === method.id}
              onSelect={() => onMethodSelect(method.id)}
            />
          ))}
        </View>

        {/* Error */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <View style={styles.errorContent}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
            {onDismissError && (
              <TouchableOpacity onPress={onDismissError} activeOpacity={0.7}>
                <Text style={styles.errorDismiss}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancel}
          disabled={isProcessing}
          activeOpacity={0.7}
        >
          <Text style={styles.cancelLabel}>Cancelar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.payButton,
            (!selectedMethod || isProcessing) && styles.payButtonDisabled,
          ]}
          onPress={handlePay}
          disabled={!selectedMethod || isProcessing}
          activeOpacity={0.8}
        >
          <Text style={styles.payButtonIcon}>💳</Text>
          <Text style={styles.payButtonLabel}>
            {isProcessing ? 'Procesando...' : `Pagar ${formatCurrency(total)}`}
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 120,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.semibold,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailCard: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  detailLabel: {
    fontSize: FONT.size.sm,
    color: COLORS.textSecondary,
  },
  detailValue: {
    fontSize: FONT.size.sm,
    color: COLORS.text,
    fontWeight: FONT.weight.medium,
    textAlign: 'right',
    maxWidth: '50%',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.md,
    marginTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  totalLabel: {
    fontSize: FONT.size.lg,
    fontWeight: FONT.weight.bold,
    color: COLORS.text,
  },
  totalValue: {
    fontSize: FONT.size.lg,
    fontWeight: FONT.weight.bold,
    color: COLORS.primary,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  methodCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}08`,
  },
  methodRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.textTertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  methodRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  methodIcon: {
    fontSize: 24,
    marginRight: SPACING.md,
  },
  methodInfo: {
    flex: 1,
  },
  methodLabel: {
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.medium,
    color: COLORS.text,
  },
  methodLabelSelected: {
    color: COLORS.primary,
    fontWeight: FONT.weight.semibold,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.errorLight,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  errorIcon: {
    fontSize: 16,
    marginRight: SPACING.sm,
  },
  errorContent: {
    flex: 1,
  },
  errorText: {
    fontSize: FONT.size.sm,
    color: COLORS.error,
    lineHeight: 18,
  },
  errorDismiss: {
    fontSize: 14,
    color: COLORS.error,
    padding: SPACING.xs,
    opacity: 0.6,
  },
  bottomActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  cancelLabel: {
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.semibold,
    color: COLORS.textSecondary,
  },
  payButton: {
    flex: 2,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.success,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  payButtonDisabled: {
    opacity: 0.5,
  },
  payButtonIcon: {
    fontSize: 18,
    marginRight: SPACING.sm,
  },
  payButtonLabel: {
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.bold,
    color: COLORS.textInverse,
  },
});
