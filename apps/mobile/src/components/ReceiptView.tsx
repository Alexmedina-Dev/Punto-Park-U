import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  Dimensions,
} from 'react-native';
import { COLORS, RADIUS, SPACING, FONT } from '../constants/app';
import { formatCurrency, formatDate, formatDateTime, formatReference } from '../utils/formatters';

// ── Types ─────────────────────────────────────────────────────────────

export interface ReceiptData {
  id: string;
  reference: string;
  amount: number;
  date: string;
  method: string;
  status: string;
  epaycoRef?: string | null;
  customerName?: string;
  customerEmail?: string;
  description?: string;
  reservationId?: string;
  vehiclePlate?: string;
}

export interface ReceiptViewProps {
  receipt: ReceiptData;
  onShare?: () => void;
  onDownload?: () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────

const METHOD_LABELS: Record<string, string> = {
  credit_card: 'Tarjeta de crédito',
  debit_card: 'Tarjeta débito',
  pse: 'PSE',
  cash: 'Efectivo',
  epayco: 'ePayco',
};

// ── Component ─────────────────────────────────────────────────────────

export default function ReceiptView({
  receipt,
  onShare,
  onDownload,
}: ReceiptViewProps) {
  const receiptItems = [
    { label: 'Referencia', value: receipt.reference },
    { label: 'Fecha', value: formatDateTime(receipt.date) },
    { label: 'Método', value: METHOD_LABELS[receipt.method] || receipt.method },
    { label: 'Estado', value: receipt.status === 'completed' ? 'Pagado' : receipt.status },
  ];

  if (receipt.epaycoRef) {
    receiptItems.push({
      label: 'Transacción ePayco',
      value: formatReference(receipt.epaycoRef),
    });
  }

  if (receipt.customerName) {
    receiptItems.push({ label: 'Cliente', value: receipt.customerName });
  }

  if (receipt.vehiclePlate) {
    receiptItems.push({ label: 'Vehículo', value: receipt.vehiclePlate });
  }

  if (receipt.description) {
    receiptItems.push({ label: 'Descripción', value: receipt.description });
  }

  return (
    <View style={styles.container}>
      {/* Receipt Card */}
      <View style={styles.receiptCard}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>Ⓟ</Text>
          <Text style={styles.brand}>Punto Park U</Text>
          <Text style={styles.receiptLabel}>COMPROBANTE DE PAGO</Text>
        </View>

        {/* Divider */}
        <View style={styles.divider}>
          <Text style={styles.dividerDash}>- - - - - - - - - - - - - - - - -</Text>
        </View>

        {/* Amount Hero */}
        <View style={styles.amountHero}>
          <Text style={styles.amountLabel}>Total pagado</Text>
          <Text style={styles.amountValue}>{formatCurrency(receipt.amount)}</Text>
        </View>

        {/* Divider */}
        <View style={styles.divider}>
          <Text style={styles.dividerDash}>- - - - - - - - - - - - - - - - -</Text>
        </View>

        {/* Details */}
        <View style={styles.details}>
          {receiptItems.map((item, index) => (
            <View
              key={item.label}
              style={[
                styles.detailRow,
                index < receiptItems.length - 1 && styles.detailRowBorder,
              ]}
            >
              <Text style={styles.detailLabel}>{item.label}</Text>
              <Text style={styles.detailValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.divider}>
          <Text style={styles.dividerDash}>- - - - - - - - - - - - - - - - -</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Gracias por tu pago. Este comprobante es válido como soporte de
            tu transacción.
          </Text>
          <Text style={styles.footerId}>ID: {receipt.id}</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={onShare}
          activeOpacity={0.7}
        >
          <Text style={styles.shareIcon}>📤</Text>
          <Text style={styles.shareLabel}>Compartir</Text>
        </TouchableOpacity>

        {onDownload && (
          <TouchableOpacity
            style={styles.downloadButton}
            onPress={onDownload}
            activeOpacity={0.7}
          >
            <Text style={styles.downloadIcon}>📥</Text>
            <Text style={styles.downloadLabel}>Descargar PDF</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
  },
  receiptCard: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xxl,
    padding: SPACING.lg,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  logo: {
    fontSize: 36,
    fontWeight: FONT.weight.black,
    color: COLORS.primary,
  },
  brand: {
    fontSize: FONT.size.lg,
    fontWeight: FONT.weight.bold,
    color: COLORS.text,
    marginTop: SPACING.xs,
  },
  receiptLabel: {
    fontSize: FONT.size.xs,
    fontWeight: FONT.weight.semibold,
    color: COLORS.textTertiary,
    marginTop: SPACING.xs,
    letterSpacing: 1,
  },
  divider: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  dividerDash: {
    fontSize: 16,
    color: COLORS.border,
    letterSpacing: -1,
  },
  amountHero: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  amountLabel: {
    fontSize: FONT.size.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  amountValue: {
    fontSize: FONT.size.xxl,
    fontWeight: FONT.weight.black,
    color: COLORS.success,
  },
  details: {
    paddingVertical: SPACING.sm,
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
  footer: {
    alignItems: 'center',
    paddingTop: SPACING.sm,
  },
  footerText: {
    fontSize: FONT.size.xs,
    color: COLORS.textTertiary,
    textAlign: 'center',
    lineHeight: 16,
  },
  footerId: {
    fontSize: FONT.size.xs,
    color: COLORS.textTertiary,
    marginTop: SPACING.sm,
    fontFamily: 'monospace',
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
    width: '100%',
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  shareIcon: {
    fontSize: 16,
  },
  shareLabel: {
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.semibold,
    color: COLORS.textInverse,
  },
  downloadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  downloadIcon: {
    fontSize: 16,
  },
  downloadLabel: {
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.semibold,
    color: COLORS.text,
  },
});
