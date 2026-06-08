import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
} from 'react-native';
import { COLORS, SPACING, RADIUS, FONT } from '../constants/auth';

// ── Types ──────────────────────────────────────────────────────────────

export interface GoogleOAuthButtonProps {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

// ── Component ──────────────────────────────────────────────────────────

export default function GoogleOAuthButton({
  onPress,
  loading = false,
  disabled = false,
}: GoogleOAuthButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[styles.button, isDisabled ? styles.disabled : null]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel="Continuar con Google"
    >
      <View style={styles.iconContainer}>
        <Text style={styles.googleIcon}>G</Text>
      </View>
      <Text style={styles.text}>
        {loading ? 'Conectando...' : 'Continuar con Google'}
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
    backgroundColor: COLORS.googleBg,
    paddingVertical: 14,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    width: '100%',
    minHeight: 52,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  disabled: {
    opacity: 0.5,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.googleText,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  googleIcon: {
    fontSize: 16,
    fontWeight: FONT.weights.bold,
    color: COLORS.googleBg,
  },
  text: {
    fontSize: FONT.sizes.md,
    fontWeight: FONT.weights.medium,
    color: COLORS.googleText,
    letterSpacing: 0.3,
  },
});
