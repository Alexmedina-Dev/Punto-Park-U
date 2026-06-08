import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  BackHandler,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import type { WebViewNavigation } from 'react-native-webview';
import { useReservationStore } from '@punto-park-u/shared-stores';
import type { Reservation } from '@punto-park-u/shared-types';
import CheckoutForm from '../components/CheckoutForm';
import LoadingOverlay from '../components/LoadingOverlay';
import { usePayment } from '../hooks/usePayment';
import { useFadeIn } from '../hooks/useAnimation';
import { COLORS, RADIUS, SPACING, FONT, EPAYCO } from '../constants/app';
import { formatCurrency, formatDate, formatTime } from '../utils/formatters';

// ── Types ─────────────────────────────────────────────────────────────

export interface CheckoutScreenParams {
  reservation: Reservation;
  amount: number;
}

// ── CheckoutScreen ────────────────────────────────────────────────────

export default function CheckoutScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { reservation, amount } = route.params || {};
  const { opacity } = useFadeIn(0);

  const {
    createCheckout,
    pollPaymentStatus,
    isProcessing,
    checkoutUrl,
    error,
    clearError,
  } = usePayment();

  const webViewRef = useRef<WebView>(null);

  const [selectedMethod, setSelectedMethod] = useState<string>('credit_card');
  const [showWebView, setShowWebView] = useState(false);
  const [webViewLoading, setWebViewLoading] = useState(true);
  const [webViewError, setWebViewError] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string>('idle');
  const [processError, setProcessError] = useState<string | null>(null);

  // ── Reservation Details ──

  const reservationDetails = [
    { label: 'Spot', value: reservation?.spotId || '—' },
    { label: 'Fecha', value: reservation?.date ? formatDate(reservation.date) : '—' },
    { label: 'Hora inicio', value: reservation?.startTime || '—' },
    { label: 'Hora fin', value: reservation?.endTime || '—' },
  ];

  const priceBreakdown = [
    { label: 'Tarifa base', amount: amount },
  ];

  // ── Handle Pay (opens WebView) ──

  const handlePay = useCallback(async () => {
    if (!reservation?.vehicleId) {
      setProcessError('No se encontró el vehículo asociado a la reserva.');
      return;
    }

    setProcessError(null);
    setWebViewLoading(true);
    setWebViewError(false);

    const url = await createCheckout({
      vehicle: reservation.vehicleId,
      reservation: reservation.id,
      amount,
    });

    if (url) {
      setShowWebView(true);
    } else {
      setProcessError(error || 'No se pudo crear la transacción. Intenta de nuevo.');
    }
  }, [reservation, amount, createCheckout, error]);

  // ── WebView Navigation Handler ──

  const handleNavigationStateChange = useCallback(
    (navState: WebViewNavigation) => {
      const { url } = navState;

      // Detect ePayco callback
      if (
        url.includes(`${EPAYCO.callbackScheme}://`) ||
        url.includes('epayco.co/respuesta') ||
        url.includes('epayco.com/respuesta') ||
        url.includes('response=')
      ) {
        setShowWebView(false);

        // Parse success from URL
        const isSuccess =
          url.includes('success=true') ||
          url.includes('estado=Aceptada') ||
          url.includes('ref_payco=') ||
          url.includes('response=Aceptada');

        const isFailure =
          url.includes('success=false') ||
          url.includes('estado=Rechazada') ||
          url.includes('response=Rechazada') ||
          url.includes('error=');

        if (isSuccess) {
          setPaymentStatus('completed');

          // Start polling for status confirmation
          if (reservation?.id) {
            pollPaymentStatus(reservation.id).then(() => {
              navigation?.replace('PaymentSuccess', {
                reservation,
                amount,
                reference: `${reservation.id}-${Date.now()}`,
              });
            });
          } else {
            navigation?.replace('PaymentSuccess', {
              reservation,
              amount,
              reference: `${Date.now()}`,
            });
          }
        } else if (isFailure) {
          setPaymentStatus('failed');
          navigation?.replace('PaymentFailure', {
            reservation,
            amount,
            error: 'La transacción fue rechazada. Intenta con otro método de pago.',
          });
        }
      }
    },
    [navigation, reservation, amount, pollPaymentStatus]
  );

  // ── WebView Error Handler ──

  const handleWebViewError = useCallback(() => {
    setWebViewError(true);
    setWebViewLoading(false);
  }, []);

  // ── Handle Cancel ──

  const handleCancel = useCallback(() => {
    if (showWebView) {
      Alert.alert(
        'Cancelar pago',
        '¿Estás seguro de cancelar el pago?',
        [
          { text: 'Seguir pagando', style: 'cancel' },
          {
            text: 'Cancelar pago',
            style: 'destructive',
            onPress: () => {
              setShowWebView(false);
              setWebViewLoading(true);
              setWebViewError(false);
              navigation?.goBack();
            },
          },
        ]
      );
    } else {
      navigation?.goBack();
    }
  }, [showWebView, navigation]);

  // ── Handle Back Button (Android) ──

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (showWebView) {
        handleCancel();
        return true;
      }
      return false;
    });
    return () => backHandler.remove();
  }, [showWebView, handleCancel]);

  // ── Render WebView ──

  if (showWebView && checkoutUrl) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* WebView Header */}
        <View style={styles.webViewHeader}>
          <TouchableOpacity onPress={handleCancel} activeOpacity={0.7}>
            <Text style={styles.closeButton}>✕ Cerrar</Text>
          </TouchableOpacity>
          <Text style={styles.webViewTitle}>Pago ePayco</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* WebView Error */}
        {webViewError && (
          <View style={styles.webViewError}>
            <Text style={styles.webViewErrorIcon}>⚠️</Text>
            <Text style={styles.webViewErrorMessage}>
              No se pudo cargar la pasarela de pago.
            </Text>
            <TouchableOpacity
              style={styles.webViewRetry}
              onPress={() => {
                setWebViewError(false);
                setWebViewLoading(true);
                webViewRef.current?.reload();
              }}
            >
              <Text style={styles.webViewRetryLabel}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Loading */}
        {webViewLoading && !webViewError && (
          <View style={styles.webViewLoading}>
            <LoadingOverlay
              visible
              message="Cargando pasarela de pago..."
              cancelable
              onCancel={handleCancel}
            />
          </View>
        )}

        {/* WebView */}
        {!webViewError && (
          <WebView
            ref={webViewRef}
            source={{ uri: checkoutUrl }}
            style={styles.webView}
            onNavigationStateChange={handleNavigationStateChange}
            onError={handleWebViewError}
            onLoad={() => setWebViewLoading(false)}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState
            renderLoading={() => null}
            sharedCookiesEnabled
            thirdPartyCookiesEnabled
          />
        )}
      </View>
    );
  }

  // ── Render Checkout Form ──

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} activeOpacity={0.7}>
          <Text style={styles.backButton}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pagar reserva</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Checkout Form */}
      <CheckoutForm
        reservationDetails={reservationDetails}
        priceBreakdown={priceBreakdown}
        total={amount}
        selectedMethod={selectedMethod}
        onMethodSelect={setSelectedMethod}
        onPay={handlePay}
        onCancel={handleCancel}
        isProcessing={isProcessing}
        error={processError}
        onDismissError={() => setProcessError(null)}
      />

      {/* Loading overlay for initial processing */}
      <LoadingOverlay
        visible={isProcessing && !showWebView}
        message="Preparando pago..."
        cancelable
        onCancel={handleCancel}
      />
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
  headerTitle: {
    fontSize: FONT.size.lg,
    fontWeight: FONT.weight.bold,
    color: COLORS.text,
  },
  headerSpacer: {
    width: 60,
  },
  backButton: {
    fontSize: FONT.size.md,
    color: COLORS.primary,
    fontWeight: FONT.weight.medium,
  },
  closeButton: {
    fontSize: FONT.size.md,
    color: COLORS.error,
    fontWeight: FONT.weight.semibold,
  },
  // ── WebView Styles ──
  webViewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  webViewTitle: {
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.semibold,
    color: COLORS.text,
  },
  webView: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webViewLoading: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  webViewError: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.bg,
  },
  webViewErrorIcon: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  webViewErrorMessage: {
    fontSize: FONT.size.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  webViewRetry: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
  },
  webViewRetryLabel: {
    color: COLORS.textInverse,
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.semibold,
  },
});
