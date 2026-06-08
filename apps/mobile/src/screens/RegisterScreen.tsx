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
import PasswordInput from '../components/PasswordInput';
import AuthButton from '../components/AuthButton';
import { useAuthForm, validators } from '../hooks/useAuthForm';
import { COLORS, SPACING, RADIUS, FONT, LABELS } from '../constants/auth';

// ── Types ──────────────────────────────────────────────────────────────

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;
type RegisterFormValues = {
  nombres: string;
  apellidos: string;
  email: string;
  cedula: string;
  username: string;
  password: string;
  confirmPassword: string;
};

// ── Screen ─────────────────────────────────────────────────────────────

export default function RegisterScreen({ navigation }: Props) {
  const { register, isLoading, error: storeError, clearError } = useAuthStore();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsError, setTermsError] = useState<string | null>(null);

  const {
    values,
    errors,
    handleChange,
    handleBlur,
    validateAll,
    isSubmitting,
    setSubmitting,
    setServerError,
  } = useAuthForm<RegisterFormValues>({
    initialValues: {
      nombres: '',
      apellidos: '',
      email: '',
      cedula: '',
      username: '',
      password: '',
      confirmPassword: '',
    },
    validationRules: {
      nombres: [validators.required('Nombres')],
      apellidos: [validators.required('Apellidos')],
      email: [
        validators.required('Correo electrónico'),
        validators.email(),
      ],
      cedula: [
        validators.required('Cédula'),
        validators.cedula(),
      ],
      username: [
        validators.required('Usuario'),
        validators.username(),
      ],
      password: [
        validators.required('Contraseña'),
        validators.password(),
      ],
      confirmPassword: [
        validators.required('Confirmar contraseña'),
        validators.passwordMatch<RegisterFormValues>('password'),
      ],
    },
  });

  // ── Handle register ──
  const handleRegister = useCallback(async () => {
    clearError();
    setTermsError(null);

    if (!validateAll()) return;

    if (!termsAccepted) {
      setTermsError('Debes aceptar los términos y condiciones');
      return;
    }

    setSubmitting(true);

    try {
      const result = await register({
        nombres: values.nombres,
        apellidos: values.apellidos,
        cedula: values.cedula,
        fechaNacimiento: '',
        username: values.username,
        password: values.password,
        confirmPassword: values.confirmPassword,
        email: values.email,
      });

      if (result && typeof result === 'object' && 'needsVerification' in result) {
        // Show success — account created, needs email verification
        // For now, navigate back to login with a success message
        navigation.navigate('Login');
      }
    } catch {
      // Error handled by store
    } finally {
      setSubmitting(false);
    }
  }, [values, validateAll, termsAccepted, setSubmitting, clearError, register, navigation]);

  // ── Show store-level error ──
  React.useEffect(() => {
    if (storeError) {
      // Try to map server errors to specific fields
      const lowerError = storeError.toLowerCase();
      if (lowerError.includes('email') || lowerError.includes('correo')) {
        setServerError('email', storeError);
      } else if (lowerError.includes('usuario') || lowerError.includes('username')) {
        setServerError('username', storeError);
      } else if (lowerError.includes('cédula') || lowerError.includes('cedula')) {
        setServerError('cedula', storeError);
      } else {
        setServerError('password', storeError);
      }
    }
  }, [storeError, setServerError]);

  const lbl = LABELS.register;

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

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{lbl.title}</Text>
          <Text style={styles.subtitle}>{lbl.subtitle}</Text>
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
          {/* Row: Nombres + Apellidos */}
          <View style={styles.row}>
            <View style={styles.halfField}>
              <AuthInput
                label={lbl.nombresLabel}
                placeholder={lbl.nombresPlaceholder}
                value={values.nombres}
                onChangeText={handleChange('nombres')}
                onBlur={handleBlur('nombres')}
                error={errors.nombres}
                autoCapitalize="words"
                editable={!isSubmitting}
              />
            </View>
            <View style={styles.halfField}>
              <AuthInput
                label={lbl.apellidosLabel}
                placeholder={lbl.apellidosPlaceholder}
                value={values.apellidos}
                onChangeText={handleChange('apellidos')}
                onBlur={handleBlur('apellidos')}
                error={errors.apellidos}
                autoCapitalize="words"
                editable={!isSubmitting}
              />
            </View>
          </View>

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

          {/* Row: Cédula + Username */}
          <View style={styles.row}>
            <View style={styles.halfField}>
              <AuthInput
                label={lbl.cedulaLabel}
                placeholder={lbl.cedulaPlaceholder}
                value={values.cedula}
                onChangeText={handleChange('cedula')}
                onBlur={handleBlur('cedula')}
                error={errors.cedula}
                keyboardType="numeric"
                maxLength={10}
                editable={!isSubmitting}
              />
            </View>
            <View style={styles.halfField}>
              <AuthInput
                label={lbl.usernameLabel}
                placeholder={lbl.usernamePlaceholder}
                value={values.username}
                onChangeText={handleChange('username')}
                onBlur={handleBlur('username')}
                error={errors.username}
                autoCapitalize="none"
                autoComplete="username"
                editable={!isSubmitting}
              />
            </View>
          </View>

          <PasswordInput
            label={lbl.passwordLabel}
            placeholder={lbl.passwordPlaceholder}
            value={values.password}
            onChangeText={handleChange('password')}
            onBlur={handleBlur('password')}
            error={errors.password}
            autoComplete="new-password"
            editable={!isSubmitting}
          />

          <PasswordInput
            label={lbl.confirmPasswordLabel}
            placeholder={lbl.confirmPasswordPlaceholder}
            value={values.confirmPassword}
            onChangeText={handleChange('confirmPassword')}
            onBlur={handleBlur('confirmPassword')}
            error={errors.confirmPassword}
            autoComplete="new-password"
            editable={!isSubmitting}
          />

          {/* Terms checkbox */}
          <TouchableOpacity
            style={styles.termsRow}
            onPress={() => {
              setTermsAccepted(!termsAccepted);
              if (termsError) setTermsError(null);
            }}
            disabled={isSubmitting}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: termsAccepted }}
          >
            <View
              style={[
                styles.checkbox,
                termsAccepted ? styles.checkboxChecked : null,
              ]}
            >
              {termsAccepted ? (
                <Text style={styles.checkmark}>✓</Text>
              ) : null}
            </View>
            <Text style={styles.termsText}>{lbl.termsText}</Text>
          </TouchableOpacity>
          {termsError ? (
            <Text style={styles.termsErrorText}>{termsError}</Text>
          ) : null}

          <AuthButton
            title={lbl.registerButton}
            onPress={handleRegister}
            loading={isSubmitting}
            disabled={isSubmitting}
            variant="primary"
            style={styles.registerButton}
          />
        </View>

        {/* Login link */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>{lbl.hasAccount}</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            disabled={isSubmitting}
          >
            <Text style={styles.footerLink}>{lbl.loginLink}</Text>
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
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
  },

  // ── Decorative ──
  decorCircle1: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: COLORS.primaryContainer,
    opacity: 0.06,
  },
  decorCircle2: {
    position: 'absolute',
    bottom: 80,
    left: -60,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: COLORS.secondary,
    opacity: 0.04,
  },

  // ── Header ──
  header: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
    marginTop: SPACING.lg,
  },
  title: {
    fontSize: FONT.sizes.xl,
    fontWeight: FONT.weights.bold,
    color: COLORS.onSurface,
    marginBottom: SPACING.xs,
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
  },

  // ── Row layout ──
  row: {
    flexDirection: 'row',
    marginHorizontal: -SPACING.xs,
  },
  halfField: {
    flex: 1,
    marginHorizontal: SPACING.xs,
  },

  // ── Register button ──
  registerButton: {
    marginTop: SPACING.md,
  },

  // ── Terms ──
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: RADIUS.sm,
    borderWidth: 2,
    borderColor: COLORS.outlineVar,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkmark: {
    fontSize: 14,
    color: COLORS.onPrimary,
    fontWeight: FONT.weights.bold,
  },
  termsText: {
    fontSize: FONT.sizes.sm,
    color: COLORS.onSurfaceVar,
    flex: 1,
  },
  termsErrorText: {
    fontSize: FONT.sizes.xs,
    color: COLORS.error,
    marginBottom: SPACING.sm,
    paddingLeft: SPACING.xs,
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
