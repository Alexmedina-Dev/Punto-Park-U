import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Linking,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, RADIUS, SPACING, FONT, APP_METADATA } from '../constants/app';
import { formatCurrency } from '../utils/formatters';
import { createShakeAnim } from '../utils/animations';
import { useFadeIn } from '../hooks/useAnimation';

// ── Types ─────────────────────────────────────────────────────────────

export interface PaymentFailureParams {
  amount?: number;
  reference?: string;
  error?: string;
  reservationId?: string;
  retryable?: boolean;
}

// ── PaymentFailureScreen ──────────────────────────────────────────────

export default function PaymentFailureScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const params: PaymentFailureParams = route.params || {};

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(0)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const { opacity: contentOpacity } = useFadeIn(0);

  // ── Animations ──

  useEffect(() => {
    // Icon pop in
    Animated.parallel([
      Animated.spring(iconScale, {
        toValue: 1,
        friction: 4,
        tension: 120,
        useNativeDriver: true,
      }),
      Animated.timing(iconOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [iconScale, iconOpacity]);

  // ── Handlers ──

  const handleRetry = useCallback(() => {
    if (params.reservationId) {
      navigation?.replace('Checkout', {
        reservation: { id: params.reservationId },
        amount: params.amount || 0,
      });
    } else {
      navigation?.goBack();
    }
  }, [navigation, params]);

  const handleCancel = useCallback(() => {
    navigation?.navigate('Main', {
      screen: 'ReservationsTab',
    });
  }, [navigation]);

  const handleContactSupport = useCallback(async () => {
    try {
      await Linking.openURL(`mailto:${APP_METADATA.supportEmail}`);
    } catch {
      Alert.alert(
        'Contactar soporte',
        `Puedes escribirnos a ${APP_METADATA.supportEmail}`
      );
    }
  }, []);

  // ── Retryable check ──

  const isRetryable = params.retryable !== false;

  // ── Error Messages ──

  const errorMessage =
    params.error ||
    'No se pudo procesar el pago. Esto puede deberse a:\n\n' +
    '• Fondos insuficientes\n' +
    '• Tarjeta no autorizada\n' +
    '• Error de conexión con la pasarela de pago\n' +
    '• Tiempo de espera agotado';

  // ── Render ──

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Error Hero */}
        <View style={styles.heroSection}>
          <Animated.View
            style={[
              styles.errorCircle,
              {
                transform: [{ scale: iconScale }],
                opacity: iconOpacity,
              },
            ]}
          >
            <Animated.View
              style={{
                transform: [{ translateX: shakeAnim }],
              }}
            >
              <Text style={styles.errorIcon}>✕</Text>
            </Animated.View>
          </Animated.View>

          <Animated.View style={{ opacity: contentOpacity }}>
            <Text style={styles.title}>Pago no procesado</Text>
            <Text style={styles.subtitle}>
              El pago no pudo ser completado.
            </Text>
          </Animated.View>
        </View>

        {/* Amount (if any) */}
        {params.amount != null && params.amount > 0 && (
          <Animated.View
            style={[
              styles.amountSection,
              { opacity: contentOpacity },
            ]}
          >
            <Text style={styles.amountLabel}>Monto intentado</Text>
            <Text style={styles.amountValue}>
              {formatCurrency(params.amount)}
            </Text>
          </Animated.View>
        )}

        {/* Error Details */}
        <Animated.View
          style={[
            styles.errorCard,
            { opacity: contentOpacity },
          ]}
        >
          <Text style={styles.errorTitle}>Detalles del error</Text>
          <Text style={styles.errorMessage}>{errorMessage}</Text>
        </Animated.View>

        {/* Suggestions */}
        <Animated.View
          style={[
            styles.suggestions,
            { opacity: contentOpacity },
          ]}
        >
          <Text style={styles.suggestionTitle}>Sugerencias</Text>
          <View style={styles.suggestionItem}>
            <Text style={styles.suggestionIcon}>💳</Text>
            <Text style={styles.suggestionText}>
              Verifica que tu tarjeta tenga fondos suficientes
            </Text>
          </View>
          <View style={styles.suggestionItem}>
            <Text style={styles.suggestionIcon}>📶</Text>
            <Text style={styles.suggestionText}>
              Revisa tu conexión a internet
            </Text>
          </View>
          <View style={styles.suggestionItem}>
            <Text style={styles.suggestionIcon}>🔄</Text>
            <Text style={styles.suggestionText}>
              Intenta con otro método de pago
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Bottom Actions */}
      <Animated.View
        style={[
          styles.bottomActions,
          { opacity: contentOpacity },
        ]}
      >
        {isRetryable && (
          <TouchableOpacity
            style={styles.retryButton}
            onPress={handleRetry}
            activeOpacity={0.8}
          >
            <Text style={styles.retryIcon}>🔄</Text>
            <Text style={styles.retryLabel}>Intentar de nuevo</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.supportButton}
          onPress={handleContactSupport}
          activeOpacity={0.7}
        >
          <Text style={styles.supportIcon}>📧</Text>
          <Text style={styles.supportLabel}>Contactar soporte</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancel}
          activeOpacity={0.7}
        >
          <Text style={styles.cancelLabel}>Volver al inicio</Text>
        </TouchableOpacity>
      </Animated.View>
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
    paddingBottom: 160,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  errorCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    shadowColor: COLORS.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  errorIcon: {
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
    backgroundColor: `${COLORS.error}08`,
    borderRadius: RADIUS.xxl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: `${COLORS.error}15`,
  },
  amountLabel: {
    fontSize: FONT.size.sm,
    color: COLORS.error,
    fontWeight: FONT.weight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amountValue: {
    fontSize: FONT.size.xxl,
    fontWeight: FONT.weight.black,
    color: COLORS.error,
    marginTop: SPACING.xs,
  },
  errorCard: {
    backgroundColor: COLORS.errorLight,
    borderRadius: RADIUS.xxl,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  errorTitle: {
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.semibold,
    color: COLORS.error,
    marginBottom: SPACING.sm,
  },
  errorMessage: {
    fontSize: FONT.size.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  suggestions: {
    marginBottom: SPACING.md,
  },
  suggestionTitle: {
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.semibold,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  suggestionIcon: {
    fontSize: 18,
  },
  suggestionText: {
    fontSize: FONT.size.sm,
    color: COLORS.textSecondary,
    flex: 1,
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.sm,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.error,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
    shadowColor: COLORS.error,
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
  cancelButton: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  cancelLabel: {
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.medium,
    color: COLORS.textTertiary,
  },
});
