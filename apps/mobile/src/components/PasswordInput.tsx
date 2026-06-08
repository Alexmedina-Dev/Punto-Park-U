import React, { useState } from 'react';
import {
  View,
  TextInput as RNTextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInputProps as RNTextInputProps,
} from 'react-native';
import { COLORS, SPACING, RADIUS, FONT } from '../constants/auth';

// ── Types ──────────────────────────────────────────────────────────────

export interface PasswordInputProps extends RNTextInputProps {
  label: string;
  error?: string;
  containerStyle?: object;
}

// ── Component ──────────────────────────────────────────────────────────

export default function PasswordInput({
  label,
  error,
  containerStyle,
  style,
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.inputWrapper,
          error ? styles.inputWrapperError : null,
        ]}
      >
        <RNTextInput
          style={[styles.input, style]}
          placeholderTextColor={COLORS.outline}
          secureTextEntry={!visible}
          autoCorrect={false}
          autoCapitalize="none"
          {...props}
        />
        <TouchableOpacity
          onPress={() => setVisible(!visible)}
          style={styles.toggleButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          accessibilityRole="button"
        >
          <Text style={styles.toggleIcon}>
            {visible ? '🙈' : '👁️'}
          </Text>
        </TouchableOpacity>
      </View>
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : null}
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
    width: '100%',
  },
  label: {
    fontSize: FONT.sizes.sm,
    fontWeight: FONT.weights.medium,
    color: COLORS.onSurfaceVar,
    marginBottom: SPACING.xs,
    letterSpacing: 0.3,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainer,
    borderWidth: 1,
    borderColor: COLORS.outlineVar,
    borderRadius: RADIUS.md,
  },
  inputWrapperError: {
    borderColor: COLORS.error,
    borderWidth: 1.5,
  },
  input: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    fontSize: FONT.sizes.md,
    color: COLORS.onSurface,
  },
  toggleButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleIcon: {
    fontSize: 18,
  },
  error: {
    fontSize: FONT.sizes.xs,
    color: COLORS.error,
    marginTop: SPACING.xs,
    paddingLeft: SPACING.xs,
  },
});
