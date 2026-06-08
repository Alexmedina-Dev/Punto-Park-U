import React from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  Platform,
  ViewStyle,
} from 'react-native';
import { COLORS, SPACING, RADIUS, FONT } from '../constants/auth';

// ── Types ──────────────────────────────────────────────────────────────

export interface AuthCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
}

// ── Glass Card Component ───────────────────────────────────────────────

function GlassCard({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return (
    <View style={[styles.glassCard, style]}>
      {children}
    </View>
  );
}

// ── Main Component ─────────────────────────────────────────────────────

export default function AuthCard({
  title,
  subtitle,
  children,
  style,
  contentContainerStyle,
}: AuthCardProps) {
  return (
    <KeyboardAvoidingView
      style={[styles.root, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          contentContainerStyle,
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Backdrop decorative elements */}
        <View style={styles.decorCircle1} pointerEvents="none" />
        <View style={styles.decorCircle2} pointerEvents="none" />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? (
            <Text style={styles.subtitle}>{subtitle}</Text>
          ) : null}
        </View>

        {/* Glass Card with form content */}
        <GlassCard>
          {children}
        </GlassCard>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Styles (glassmorphism dark theme) ──────────────────────────────────

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

  // ── Decorative circles ──
  decorCircle1: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: COLORS.primaryContainer,
    opacity: 0.08,
  },
  decorCircle2: {
    position: 'absolute',
    bottom: 60,
    left: -80,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: COLORS.secondary,
    opacity: 0.06,
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

  // ── Glass Card ──
  glassCard: {
    backgroundColor: 'rgba(25, 27, 35, 0.85)',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
    // Shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 12,
    width: '100%',
  },
});
