import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { verify2FAService, verifyBackupCodeService } from '@punto-park-u/shared-api';
import { useAuthStore } from '@punto-park-u/shared-stores';
import type { AuthStackParamList } from '../navigation/AuthNavigator';

import AuthButton from '../components/AuthButton';
import { COLORS, SPACING, RADIUS, FONT, LABELS } from '../constants/auth';

// ── Types ──────────────────────────────────────────────────────────────

type Props = NativeStackScreenProps<AuthStackParamList, 'TwoFactor'>;

// ── Screen ─────────────────────────────────────────────────────────────

export default function TwoFactorScreen({ navigation, route }: Props) {
  const { tempToken } = route.params;
  const { complete2FALogin, clearTwoFactorState } = useAuthStore();

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showBackup, setShowBackup] = useState(false);
  const [backupCode, setBackupCode] = useState('');

  const inputRef = useRef<TextInput>(null);

  // ── Verify TOTP ──
  const handleVerify = useCallback(async () => {
    setError(null);

    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      setError('El código debe tener exactamente 6 dígitos');
      return;
    }

    setIsLoading(true);

    try {
      const response = await verify2FAService(tempToken, code);
      complete2FALogin(response.user, response.token, response.refreshToken);
      // Navigation is handled by RootNavigator (switches to Main)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Código inválido. Intenta de nuevo.';
      setError(message);
      setCode('');
      inputRef.current?.focus();
    } finally {
      setIsLoading(false);
    }
  }, [code, tempToken, complete2FALogin]);

  // ── Verify backup code ──
  const handleBackupVerify = useCallback(async () => {
    setError(null);

    if (!backupCode.trim()) {
      setError('Ingresa tu código de respaldo');
      return;
    }

    setIsLoading(true);

    try {
      const response = await verifyBackupCodeService(tempToken, backupCode.trim());
      complete2FALogin(response.user, response.token, response.refreshToken);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Código de respaldo inválido';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [backupCode, tempToken, complete2FALogin]);

  // ── Go back ──
  const handleBack = useCallback(() => {
    clearTwoFactorState();
    navigation.goBack();
  }, [clearTwoFactorState, navigation]);

  const lbl = LABELS.twoFactor;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Decorative */}
        <View style={styles.decorCircle1} pointerEvents="none" />
        <View style={styles.decorCircle2} pointerEvents="none" />

        {/* Shield icon area */}
        <View style={styles.iconContainer}>
          <View style={styles.shieldCircle}>
            <Text style={styles.shieldIcon}>🔐</Text>
          </View>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{lbl.title}</Text>
          <Text style={styles.subtitle}>{lbl.subtitle}</Text>
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
          {!showBackup ? (
            <>
              {/* TOTP Code Input (6 digits) */}
              <Text style={styles.codeLabel}>{lbl.codeLabel}</Text>
              <TextInput
                ref={inputRef}
                style={[styles.codeInput, error ? styles.codeInputError : null]}
                value={code}
                onChangeText={(text) => {
                  const digits = text.replace(/[^0-9]/g, '').slice(0, 6);
                  setCode(digits);
                  if (error) setError(null);
                }}
                keyboardType="number-pad"
                maxLength={6}
                placeholder={lbl.codePlaceholder}
                placeholderTextColor={COLORS.outline}
                autoFocus
                editable={!isLoading}
              />

              {/* Dots indicator */}
              <View style={styles.dotsRow}>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <View
                    key={i}
                    style={[
                      styles.dot,
                      code.length > i ? styles.dotFilled : null,
                    ]}
                  />
                ))}
              </View>

              {error ? (
                <Text style={styles.error}>{error}</Text>
              ) : null}

              <AuthButton
                title={lbl.verifyButton}
                onPress={handleVerify}
                loading={isLoading}
                disabled={code.length !== 6 || isLoading}
                variant="primary"
                style={styles.verifyButton}
              />

              <TouchableOpacity
                style={styles.backupLink}
                onPress={() => {
                  setShowBackup(true);
                  setError(null);
                }}
                disabled={isLoading}
              >
                <Text style={styles.backupLinkText}>{lbl.backupCodeLink}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.codeLabel}>Código de respaldo</Text>
              <TextInput
                style={[styles.codeInput, styles.backupInput, error ? styles.codeInputError : null]}
                value={backupCode}
                onChangeText={(text) => {
                  setBackupCode(text);
                  if (error) setError(null);
                }}
                placeholder="XXXXX-XXXXX"
                placeholderTextColor={COLORS.outline}
                autoCapitalize="characters"
                editable={!isLoading}
              />

              {error ? (
                <Text style={styles.error}>{error}</Text>
              ) : null}

              <AuthButton
                title="Verificar código"
                onPress={handleBackupVerify}
                loading={isLoading}
                disabled={!backupCode.trim() || isLoading}
                variant="primary"
                style={styles.verifyButton}
              />

              <TouchableOpacity
                style={styles.backupLink}
                onPress={() => {
                  setShowBackup(false);
                  setBackupCode('');
                  setError(null);
                }}
                disabled={isLoading}
              >
                <Text style={styles.backupLinkText}>Usar código de verificación</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Back link */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          disabled={isLoading}
        >
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xxl,
  },

  // ── Decorative ──
  decorCircle1: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#0074d9',
    opacity: 0.06,
  },
  decorCircle2: {
    position: 'absolute',
    bottom: 120,
    left: -80,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: COLORS.secondary,
    opacity: 0.04,
  },

  // ── Icon ──
  iconContainer: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  shieldCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(167, 200, 255, 0.15)',
  },
  shieldIcon: {
    fontSize: 36,
  },

  // ── Header ──
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: FONT.sizes.xl,
    fontWeight: FONT.weights.bold,
    color: COLORS.onSurface,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FONT.sizes.md,
    color: COLORS.onSurfaceVar,
    textAlign: 'center',
  },

  // ── Form Card ──
  formCard: {
    backgroundColor: COLORS.surfaceLow,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
    width: '100%',
    alignItems: 'center',
  },

  codeLabel: {
    fontSize: FONT.sizes.sm,
    fontWeight: FONT.weights.medium,
    color: COLORS.onSurfaceVar,
    marginBottom: SPACING.md,
    letterSpacing: 0.5,
    alignSelf: 'flex-start',
  },

  codeInput: {
    width: '100%',
    backgroundColor: COLORS.surfaceContainer,
    borderWidth: 1,
    borderColor: COLORS.outlineVar,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 16,
    fontSize: 28,
    fontWeight: FONT.weights.bold,
    color: COLORS.onSurface,
    textAlign: 'center',
    letterSpacing: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  codeInputError: {
    borderColor: COLORS.error,
    borderWidth: 1.5,
  },
  backupInput: {
    fontSize: FONT.sizes.lg,
    letterSpacing: 4,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    textTransform: 'uppercase',
  },

  // ── Dots indicator ──
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.outlineVar,
  },
  dotFilled: {
    backgroundColor: COLORS.primary,
  },

  error: {
    fontSize: FONT.sizes.sm,
    color: COLORS.error,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },

  verifyButton: {
    marginTop: SPACING.lg,
  },

  backupLink: {
    marginTop: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  backupLinkText: {
    fontSize: FONT.sizes.sm,
    color: COLORS.primary,
    fontWeight: FONT.weights.medium,
    textAlign: 'center',
  },

  // ── Back ──
  backButton: {
    alignSelf: 'center',
    marginTop: SPACING.xl,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  backButtonText: {
    fontSize: FONT.sizes.sm,
    color: COLORS.onSurfaceVar,
  },
});
