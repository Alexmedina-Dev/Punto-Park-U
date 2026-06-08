import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuthStore } from '@punto-park-u/shared-stores';
import type { AuthStackParamList } from '../navigation/AuthNavigator';

import AuthInput from '../components/AuthInput';
import AuthButton from '../components/AuthButton';
import { useAuthForm, validators } from '../hooks/useAuthForm';
import { COLORS, SPACING, FONT, LABELS } from '../constants/auth';

// ── Types ──────────────────────────────────────────────────────────────

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;
type ForgotFormValues = {
  email: string;
};

// ── Screen ─────────────────────────────────────────────────────────────

export default function ForgotPasswordScreen({ navigation }: Props) {
  const { forgotPassword, isLoading, error: storeError, clearError } = useAuthStore();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    values,
    errors,
    handleChange,
    handleBlur,
    validateAll,
    isSubmitting,
    setSubmitting,
  } = useAuthForm<ForgotFormValues>({
    initialValues: { email: '' },
    validationRules: {
      email: [
        validators.required('Correo electrónico'),
        validators.email(),
      ],
    },
  });

  // ── Handle send reset link ──
  const handleSend = useCallback(async () => {
    clearError();
    setSuccessMessage(null);

    if (!validateAll()) return;

    setSubmitting(true);

    try {
      const result = await forgotPassword(values.email);
      if (result.success) {
        setSuccessMessage(LABELS.forgotPassword.successMessage);
      }
    } catch {
      // Error handled by store
    } finally {
      setSubmitting(false);
    }
  }, [values, validateAll, setSubmitting, clearError, forgotPassword]);

  const lbl = LABELS.forgotPassword;

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

        {/* Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>🔑</Text>
          </View>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{lbl.title}</Text>
          <Text style={styles.subtitle}>{lbl.subtitle}</Text>
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
          {successMessage ? (
            <View style={styles.successContainer}>
              <Text style={styles.successIcon}>✓</Text>
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          ) : (
            <>
              <AuthInput
                label={lbl.emailLabel}
                placeholder={lbl.emailPlaceholder}
                value={values.email}
                onChangeText={handleChange('email')}
                onBlur={handleBlur('email')}
                error={errors.email || storeError || undefined}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!isSubmitting}
              />

              <AuthButton
                title={lbl.sendButton}
                onPress={handleSend}
                loading={isSubmitting}
                disabled={isSubmitting}
                variant="primary"
              />
            </>
          )}

          {/* Back to login */}
          <TouchableOpacity
            style={styles.backLink}
            onPress={() => navigation.navigate('Login')}
            disabled={isSubmitting}
          >
            <Text style={styles.backLinkText}>{lbl.backToLogin}</Text>
          </TouchableOpacity>
        </View>
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
    bottom: 100,
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
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  iconText: {
    fontSize: 32,
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
    lineHeight: 22,
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
  },

  // ── Success ──
  successContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  successIcon: {
    fontSize: 40,
    color: COLORS.success,
    fontWeight: FONT.weights.bold,
    marginBottom: SPACING.md,
  },
  successText: {
    fontSize: FONT.sizes.md,
    color: COLORS.onSurfaceVar,
    textAlign: 'center',
    lineHeight: 22,
  },

  // ── Back link ──
  backLink: {
    alignSelf: 'center',
    marginTop: SPACING.xl,
    paddingVertical: SPACING.sm,
  },
  backLinkText: {
    fontSize: FONT.sizes.sm,
    color: COLORS.primary,
    fontWeight: FONT.weights.medium,
  },
});
