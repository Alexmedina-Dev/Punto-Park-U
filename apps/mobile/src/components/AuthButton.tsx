import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { COLORS, SPACING, RADIUS, FONT } from '../constants/auth';

// ── Types ──────────────────────────────────────────────────────────────

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'text';

export interface AuthButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: ButtonVariant;
  style?: ViewStyle;
}

// ── Variant styles ─────────────────────────────────────────────────────

function getVariantStyles(variant: ButtonVariant) {
  switch (variant) {
    case 'primary':
      return {
        button: {
          backgroundColor: COLORS.primary,
          borderWidth: 0,
        } as ViewStyle,
        text: { color: COLORS.onPrimary } as const,
        loader: COLORS.onPrimary,
      };
    case 'secondary':
      return {
        button: {
          backgroundColor: COLORS.surfaceHigh,
          borderWidth: 1,
          borderColor: COLORS.outlineVar,
        } as ViewStyle,
        text: { color: COLORS.onSurface } as const,
        loader: COLORS.onSurface,
      };
    case 'outline':
      return {
        button: {
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: COLORS.primary,
        } as ViewStyle,
        text: { color: COLORS.primary } as const,
        loader: COLORS.primary,
      };
    case 'text':
      return {
        button: {
          backgroundColor: 'transparent',
          borderWidth: 0,
        } as ViewStyle,
        text: { color: COLORS.primary } as const,
        loader: COLORS.primary,
      };
  }
}

// ── Component ──────────────────────────────────────────────────────────

export default function AuthButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  style,
}: AuthButtonProps) {
  const variantStyles = getVariantStyles(variant);
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        variantStyles.button,
        isDisabled ? styles.disabled : null,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variantStyles.loader}
          style={styles.loader}
        />
      ) : null}
      <Text
        style={[
          styles.text,
          variantStyles.text,
          loading ? styles.textWithLoader : null,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    width: '100%',
    minHeight: 52,
  },
  disabled: {
    opacity: 0.5,
  },
  loader: {
    marginRight: SPACING.sm,
  },
  text: {
    fontSize: FONT.sizes.md,
    fontWeight: FONT.weights.semibold,
    letterSpacing: 0.5,
  },
  textWithLoader: {
    marginLeft: SPACING.sm,
  },
});
