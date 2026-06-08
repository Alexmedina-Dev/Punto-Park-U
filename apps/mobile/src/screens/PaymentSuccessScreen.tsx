import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  Animated,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ConfettiCannon from 'react-native-confetti-cannon';
import { COLORS, RADIUS, SPACING, FONT } from '../constants/app';
import { formatCurrency, formatReference } from '../utils/formatters';
import { createCheckmarkAnimation } from '../utils/animations';

// ── Types ─────────────────────────────────────────────────────────────

export interface PaymentSuccessParams {
  amount: number;
  reference: string;
  epaycoRef?: string;
  reservationId?: string;
  date?: string;
  vehiclePlate?: string;
  customerName?: string;
  customerEmail?: string;
}

// ── PaymentSuccessScreen ──────────────────────────────────────────────

export default function PaymentSuccessScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const params: PaymentSuccessParams = route.params || {};

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslate = useRef(new Animated.Value(20)).current;
  const confettiRef = useRef<any>(null);

  // ── Animations ──

  useEffect(() => {
    // Checkmark animation
    createCheckmarkAnimation(scaleAnim, opacityAnim).start(() => {
      // Content appears after checkmark
      Animated.parallel([
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(contentTranslate, {
          toValue: 0,
          friction: 8,
          tension: 60,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [scaleAnim, opacityAnim, contentOpacity, contentTranslate]);

  // ── Handlers ──

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message:
          `Pago realizado en Punto Park U\n\n` +
          `💰 Monto: ${formatCurrency(params.amount)}\n` +
          `📄 Referencia: ${params.reference}\n` +
          `${params.epaycoRef ? `🔗 ePayco: ${formatReference(params.epaycoRef)}\n` : ''}` +
          `\nGracias por tu pago.`,
      });
    } catch {
      // User cancelled
    }
  }, [params]);

  const handleDownload = useCallback(() => {
    // PDF download will be implemented in a follow-up
    Alert.alert(
      'Descarga de PDF',
      'La descarga del comprobante en PDF estará disponible próximamente.'
    );
  }, []);

  const handleDone = useCallback(() => {
    // Navigate to payments list or back to reservations
    navigation?.navigate('Main', {
      screen: 'PaymentsTab',
    });
  }, [navigation]);

  // ── Receipt Items ──

  const receiptItems = [
    { label: 'Referencia', value: params.reference },
    ...(params.epaycoRef
      ? [{ label: 'Transacción ePayco', value: formatReference(params.epaycoRef) }]
      : []),
    ...(params.vehiclePlate
      ? [{ label: 'Vehículo', value: params.vehiclePlate }]
      : []),
    ...(params.reservationId
      ? [{ label: 'Reserva', value: params.reservationId }]
      : []),
  ];

  // ── Render ──

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Confetti */}
      {params.amount > 0 && (
        <ConfettiCannon
          ref={confettiRef}
          count={50}
          origin={{ x: 200, y: -20 }}
          fadeOut
          autoStart
          colors={['#22c55e', '#1a73e8', '#f59e0b', '#3b82f6']}
        />
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Checkmark Hero */}
        <View style={styles.heroSection}>
          <Animated.View
            style={[
              styles.checkmarkCircle,
              {
                transform: [{ scale: scaleAnim }],
                opacity: opacityAnim,
              },
            ]}
          >
            <Text style={styles.checkmark}>✓</Text>
          </Animated.View>
          <Animated.View
            style={{
              opacity: contentOpacity,
              transform: [{ translateY: contentTranslate }],
            }}
          >
            <Text style={styles.title}>¡Pago exitoso!</Text>
            <Text style={styles.subtitle}>
              Tu pago ha sido procesado correctamente.
            </Text>
          </Animated.View>
        </View>

        {/* Amount */}
        <Animated.View
          style={[
            styles.amountSection,
            { opacity: contentOpacity, transform: [{ translateY: contentTranslate }] },
          ]}
        >
          <Text style={styles.amountLabel}>Total pagado</Text>
          <Text style={styles.amountValue}>
            {formatCurrency(params.amount)}
          </Text>
        </Animated.View>

        {/* Receipt Details */}
        <Animated.View
          style={[
            styles.receiptCard,
            { opacity: contentOpacity, transform: [{ translateY: contentTranslate }] },
          ]}
        >
          <Text style={styles.receiptTitle}>Detalle de la transacción</Text>
          {receiptItems.map((item, index) => (
            <View
              key={item.label}
              style={[
                styles.receiptRow,
                index < receiptItems.length - 1 && styles.receiptRowBorder,
              ]}
            >
              <Text style={styles.receiptLabel}>{item.label}</Text>
              <Text style={styles.receiptValue}>{item.value}</Text>
            </View>
          ))}
        </Animated.View>

        {/* Actions */}
        <Animated.View
          style={[
            styles.actions,
            { opacity: contentOpacity, transform: [{ translateY: contentTranslate }] },
          ]}
        >
          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShare}
            activeOpacity={0.7}
          >
            <Text style={styles.shareIcon}>📤</Text>
            <Text style={styles.shareLabel}>Compartir comprobante</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.downloadButton}
            onPress={handleDownload}
            activeOpacity={0.7}
          >
            <Text style={styles.downloadIcon}>📥</Text>
            <Text style={styles.downloadLabel}>Descargar PDF</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.doneButton}
            onPress={handleDone}
            activeOpacity={0.7}
          >
            <Text style={styles.doneLabel}>Ir a mis pagos</Text>
          </TouchableOpacity>
        </Animated.View>
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
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxxl,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  checkmarkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  checkmark: {
    fontSize: 40,
    color: COLORS.textInverse,
    fontWeight: FONT.weight.black,
  },
  title: {
    fontSize: FONT.size.xxl,
    fontWeight: FONT.weight.black,
    color: COLORS.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FONT.size.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  amountSection: {
    alignItems: 'center',
    backgroundColor: `${COLORS.success}10`,
    borderRadius: RADIUS.xxl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: `${COLORS.success}20`,
  },
  amountLabel: {
    fontSize: FONT.size.sm,
    color: COLORS.success,
    fontWeight: FONT.weight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amountValue: {
    fontSize: FONT.size.xxxl,
    fontWeight: FONT.weight.black,
    color: COLORS.success,
    marginTop: SPACING.xs,
  },
  receiptCard: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.xxl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  receiptTitle: {
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.semibold,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  receiptRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  receiptLabel: {
    fontSize: FONT.size.sm,
    color: COLORS.textSecondary,
  },
  receiptValue: {
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.semibold,
    color: COLORS.text,
    textAlign: 'right',
    flex: 1,
    marginLeft: SPACING.sm,
  },
  actions: {
    gap: SPACING.sm,
  },
  shareButton: {
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
  downloadIcon: {
    fontSize: 16,
  },
  downloadLabel: {
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.semibold,
    color: COLORS.text,
  },
  doneButton: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  doneLabel: {
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.medium,
    color: COLORS.textTertiary,
  },
});
