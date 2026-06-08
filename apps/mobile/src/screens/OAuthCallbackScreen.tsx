import React, { useEffect, useCallback, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';
import { useAuthStore } from '@punto-park-u/shared-stores';
import type { AuthStackParamList } from '../navigation/AuthNavigator';

import AuthButton from '../components/AuthButton';
import { COLORS, SPACING, FONT, LABELS } from '../constants/auth';

// ── Types ──────────────────────────────────────────────────────────────

type Props = NativeStackScreenProps<AuthStackParamList, 'OAuthCallback'>;

// ── Screen ─────────────────────────────────────────────────────────────

export default function OAuthCallbackScreen({ navigation, route }: Props) {
  const { provider } = route.params;
  const { handleOAuthCallback } = useAuthStore();

  const [status, setStatus] = useState<'processing' | 'error' | 'done'>('processing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const processedRef = useRef(false);

  // ── Parse deep link for OAuth tokens ──
  const processUrl = useCallback(async (url: string | null) => {
    if (!url || processedRef.current) return;
    processedRef.current = true;

    try {
      const parsed = Linking.parse(url);

      // Expected URLs:
      // puntoparku://auth/callback?token=xxx&refreshToken=yyy&user=base64json
      // puntoparku://auth/callback?error=access_denied
      if (parsed.path === 'auth/callback' && parsed.queryParams) {
        const params = parsed.queryParams as Record<string, string>;

        // Check for error
        if (params.error) {
          setStatus('error');
          setErrorMessage(params.error_description || 'Autenticación cancelada');
          return;
        }

        const { token, refreshToken, user: userEncoded } = params;

        if (token && userEncoded) {
          let user;
          try {
            user = JSON.parse(
              typeof atob === 'function'
                ? atob(userEncoded)
                : Buffer.from(userEncoded, 'base64').toString('utf-8')
            );
          } catch {
            setStatus('error');
            setErrorMessage('Error al procesar los datos del usuario');
            return;
          }

          // Store auth data
          handleOAuthCallback(token, refreshToken || '', user);
          setStatus('done');
          // Navigation switches to Main automatically via RootNavigator
          return;
        }
      }

      // If we navigated here manually (e.g., from LoginScreen button tap)
      // Try to open the OAuth URL in the browser
      if (parsed.path === 'auth/google' || provider === 'google') {
        const apiUrl = Linking.createURL('/auth/google');
        // Open browser for OAuth flow
        const result = await Linking.openURL(apiUrl);
        // On return, deep link handler picks up the callback
        // If we get back here without token, show loading
        return;
      }

      // No valid data found
      setStatus('error');
      setErrorMessage('No se recibieron datos de autenticación');
    } catch (err) {
      setStatus('error');
      setErrorMessage(
        err instanceof Error ? err.message : 'Error de autenticación'
      );
    }
  }, [handleOAuthCallback, provider]);

  // ── Start processing ──
  useEffect(() => {
    // Try to get the URL that brought us here
    Linking.getInitialURL().then(processUrl);

    // Also listen for URL events (in case app was already open)
    const subscription = Linking.addEventListener('url', (event) => {
      processUrl(event.url);
    });

    // If after 5 seconds we're still processing, show error
    const timeout = setTimeout(() => {
      if (status === 'processing') {
        setStatus('error');
        setErrorMessage('Tiempo de espera agotado. Intenta de nuevo.');
      }
    }, 10000);

    return () => {
      subscription.remove();
      clearTimeout(timeout);
    };
  }, [processUrl, status]);

  const lbl = LABELS.oauthCallback;

  return (
    <View style={styles.root}>
      {/* Decorative */}
      <View style={styles.decorCircle1} pointerEvents="none" />
      <View style={styles.decorCircle2} pointerEvents="none" />

      {/* Content */}
      <View style={styles.content}>
        {/* Status icon */}
        {status === 'processing' ? (
          <View style={styles.statusCircle}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : status === 'error' ? (
          <View style={[styles.statusCircle, styles.errorCircle]}>
            <Text style={styles.errorIcon}>!</Text>
          </View>
        ) : (
          <View style={[styles.statusCircle, styles.successCircle]}>
            <Text style={styles.successIcon}>✓</Text>
          </View>
        )}

        {/* Text */}
        <Text style={styles.title}>
          {status === 'processing'
            ? lbl.title
            : status === 'error'
            ? lbl.errorText
            : 'Inicio de sesión exitoso'}
        </Text>

        {status === 'processing' ? (
          <Text style={styles.subtitle}>{lbl.loadingText}</Text>
        ) : status === 'error' ? (
          <>
            {errorMessage ? (
              <Text style={styles.errorText}>{errorMessage}</Text>
            ) : null}
            <AuthButton
              title={lbl.retryButton}
              onPress={() => {
                setStatus('processing');
                setErrorMessage(null);
                processedRef.current = false;
                // Re-trigger OAuth
                if (provider === 'google') {
                  Linking.openURL(Linking.createURL('/auth/google'));
                }
              }}
              variant="primary"
              style={styles.retryButton}
            />
            <AuthButton
              title="Volver al inicio"
              onPress={() => navigation.navigate('Login')}
              variant="text"
            />
          </>
        ) : null}
      </View>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Decorative ──
  decorCircle1: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#0074d9',
    opacity: 0.06,
  },
  decorCircle2: {
    position: 'absolute',
    bottom: 60,
    left: -80,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: COLORS.secondary,
    opacity: 0.04,
  },

  // ── Content ──
  content: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    width: '100%',
  },

  statusCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  errorCircle: {
    borderColor: COLORS.error,
  },
  successCircle: {
    borderColor: COLORS.success,
  },
  errorIcon: {
    fontSize: 32,
    fontWeight: FONT.weights.bold,
    color: COLORS.error,
  },
  successIcon: {
    fontSize: 32,
    fontWeight: FONT.weights.bold,
    color: COLORS.success,
  },

  title: {
    fontSize: FONT.sizes.lg,
    fontWeight: FONT.weights.semibold,
    color: COLORS.onSurface,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FONT.sizes.md,
    color: COLORS.onSurfaceVar,
    textAlign: 'center',
  },
  errorText: {
    fontSize: FONT.sizes.sm,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    lineHeight: 20,
  },

  retryButton: {
    marginBottom: SPACING.md,
  },
});
