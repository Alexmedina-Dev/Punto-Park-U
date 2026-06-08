import React from 'react';
import {
  View,
  TextInput as RNTextInput,
  Text,
  StyleSheet,
  TextInputProps as RNTextInputProps,
  Animated,
} from 'react-native';
import { COLORS, SPACING, RADIUS, FONT } from '../constants/auth';

// ── Types ──────────────────────────────────────────────────────────────

export interface AuthInputProps extends RNTextInputProps {
  label: string;
  error?: string;
  containerStyle?: object;
}

// ── Component ──────────────────────────────────────────────────────────

export default function AuthInput({
  label,
  error,
  containerStyle,
  style,
  ...props
}: AuthInputProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <RNTextInput
        style={[
          styles.input,
          error ? styles.inputError : null,
          style,
        ]}
        placeholderTextColor={COLORS.outline}
        autoCorrect={false}
        {...props}
      />
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
  input: {
    backgroundColor: COLORS.surfaceContainer,
    borderWidth: 1,
    borderColor: COLORS.outlineVar,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    fontSize: FONT.sizes.md,
    color: COLORS.onSurface,
    fontFamily: undefined, // use system default
  },
  inputError: {
    borderColor: COLORS.error,
    borderWidth: 1.5,
  },
  error: {
    fontSize: FONT.sizes.xs,
    color: COLORS.error,
    marginTop: SPACING.xs,
    paddingLeft: SPACING.xs,
  },
});
