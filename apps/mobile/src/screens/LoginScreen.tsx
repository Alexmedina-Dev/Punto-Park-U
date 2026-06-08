import React, { useCallback } from 'react';
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
import PasswordInput from '../components/PasswordInput';
import AuthButton from '../components/AuthButton';
import AuthCard from '../components/AuthCard';
import GoogleOAuthButton from '../components/GoogleOAuthButton';
import { useAuthForm, validators } from '../hooks/useAuthForm';
import { COLORS, SPACING, FONT, LABELS } from '../constants/auth';

// ── Types ──────────────────────────────────────────────────────────────

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;
type LoginFormValues = {
  email: string;
  password: string;
};

// ── Screen ─────────────────────────────────────────────────────────────

export default function LoginScreen({ navigation }: Props) {
  const { login, isLoading, error: storeError, clearError } = useAuthStore();

  const {
    values,
    errors,
    handleChange,
    handleBlur,
    validateAll,
    isSubmitting,
    setSubmitting,
    setServerError,
    setFieldTouched,
  } = useAuthForm<LoginFormValues>({
    initialValues: { email: '', password: '' },
    validationRules: {
      email: [
        validators.required('Correo electrónico'),
        validators.email(),
      ],
      password: [validators.required('Contraseña')],
    },
  });

  // ── Handle login ──
  const handleLogin = useCallback(async () => {
    clearError();

    if (!validateAll()) return;

    setSubmitting(true);

    try {
      const result = await login({
        username: values.email,
        password: values.password,
      });

      if (result && typeof result === 'object' && 'requiresTwoFactor' in result) {
        // Navigate to 2FA screen
        navigation.navigate('TwoFactor', {
          tempToken: result.tempToken,
        });
      }
    } catch {
      // Error is handled by the store
    } finally {
      setSubmitting(false);
    }
  }, [values, validateAll, setSubmitting, clearError, login, navigation]);

  // ── Handle Google OAuth ──
  const handleGoogleOAuth = useCallback(() => {
    // The deep linking service handles OAuth callbacks via puntoparku:// scheme
    // For web-based OAuth, we'd open a browser — the backend redirects back
    // with token in the URL. The OAuthCallbackScreen handles the deep link.
    navigation.navigate('OAuthCallback', { provider: 'google' });
  }, [navigation]);

  // ── Show store-level error ──
  React.useEffect(() => {
    if (storeError) {
      setServerError('password', storeError);
    }
  }, [storeError, setServerError]);

  const lbl = LABELS.login;

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
        {/* Decorative elements */}
        <View style={styles.decorCircle1} pointerEvents="none" />
        <View style={styles.decorCircle2} pointerEvents="none" />
        <View style={styles.decorCircle3} pointerEvents="none" />

        {/* Logo / Brand */}
        <View style={styles.brandContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>P</Text>
          </View>
          <Text style={styles.brandTitle}>{lbl.title}</Text>
          <Text style={styles.brandSubtitle}>{lbl.subtitle}</Text>
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
          <AuthInput
            label={lbl.emailLabel}
            placeholder={lbl.emailPlaceholder}
            value={values.email}
            onChangeText={handleChange('email')}
            onBlur={handleBlur('email')}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            editable={!isSubmitting}
          />

          <PasswordInput
            label={lbl.passwordLabel}
            placeholder={lbl.passwordPlaceholder}
            value={values.password}
            onChangeText={handleChange('password')}
            onBlur={handleBlur('password')}
            error={errors.password}
            autoComplete="password"
            editable={!isSubmitting}
          />

          {/* Forgot password link */}
          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={() => navigation.navigate('ForgotPassword')}
            disabled={isSubmitting}
          >
            <Text style={styles.forgotPasswordText}>{lbl.forgotPassword}</Text>
          </TouchableOpacity>

          <AuthButton
            title={lbl.loginButton}
            onPress={handleLogin}
            loading={isSubmitting}
            disabled={isSubmitting}
            variant="primary"
            style={styles.loginButton}
          />

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>o</Text>
            <View style={styles.dividerLine} />
          </View>

          <GoogleOAuthButton
            onPress={handleGoogleOAuth}
            loading={isSubmitting}
            disabled={isSubmitting}
          />
        </View>

        {/* Register link */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>{lbl.noAccount}</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Register')}
            disabled={isSubmitting}
          >
            <Text style={styles.footerLink}>{lbl.registerLink}</Text>
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
    top: -100,
    right: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: COLORS.primaryContainer,
    opacity: 0.06,
  },
  decorCircle2: {
    position: 'absolute',
    bottom: 120,
    left: -100,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: COLORS.secondary,
    opacity: 0.05,
  },
  decorCircle3: {
    position: 'absolute',
    top: '40%',
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primary,
    opacity: 0.03,
  },

  // ── Brand ──
  brandContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  logoText: {
    fontSize: 32,
    fontWeight: FONT.weights.black,
    color: COLORS.onPrimaryContainer,
  },
  brandTitle: {
    fontSize: FONT.sizes.xxl,
    fontWeight: FONT.weights.black,
    color: COLORS.onSurface,
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: FONT.sizes.md,
    color: COLORS.onSurfaceVar,
    marginTop: SPACING.xs,
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

  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: SPACING.lg,
    marginTop: -SPACING.sm,
  },
  forgotPasswordText: {
    fontSize: FONT.sizes.sm,
    color: COLORS.primary,
    fontWeight: FONT.weights.medium,
  },

  loginButton: {
    marginBottom: SPACING.md,
  },

  // ── Divider ──
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.outlineVar,
  },
  dividerText: {
    marginHorizontal: SPACING.md,
    color: COLORS.outline,
    fontSize: FONT.sizes.sm,
  },

  // ── Footer ──
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.xl,
    gap: SPACING.xs,
  },
  footerText: {
    fontSize: FONT.sizes.sm,
    color: COLORS.onSurfaceVar,
  },
  footerLink: {
    fontSize: FONT.sizes.sm,
    color: COLORS.primary,
    fontWeight: FONT.weights.semibold,
  },
});
