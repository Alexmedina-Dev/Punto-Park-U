import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { COLORS, RADIUS, SPACING, FONT } from '../constants/app';

// ── Types ─────────────────────────────────────────────────────────────

export interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  cancelable?: boolean;
  onCancel?: () => void;
  cancelLabel?: string;
  progress?: number; // 0-1 optional progress
  progressLabel?: string;
}

// ── Component ─────────────────────────────────────────────────────────

export default function LoadingOverlay({
  visible,
  message = 'Procesando...',
  cancelable = false,
  onCancel,
  cancelLabel = 'Cancelar',
  progress,
  progressLabel,
}: LoadingOverlayProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [visible, opacity]);

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none">
      <Animated.View style={[styles.overlay, { opacity }]}>
        <View style={styles.card}>
          <ActivityIndicator size="large" color={COLORS.primary} />

          <Text style={styles.message}>{message}</Text>

          {progress != null && (
            <View style={styles.progressContainer}>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressBar,
                    { width: `${Math.min(progress * 100, 100)}%` },
                  ]}
                />
              </View>
              {progressLabel && (
                <Text style={styles.progressLabel}>{progressLabel}</Text>
              )}
            </View>
          )}

          {cancelable && onCancel && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancel}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelLabel}>{cancelLabel}</Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.modalOverlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    minWidth: 240,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  message: {
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.semibold,
    color: COLORS.text,
    marginTop: SPACING.lg,
    textAlign: 'center',
  },
  progressContainer: {
    width: '100%',
    marginTop: SPACING.md,
  },
  progressTrack: {
    height: 4,
    backgroundColor: COLORS.skeleton,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
  },
  progressLabel: {
    fontSize: FONT.size.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  cancelButton: {
    marginTop: SPACING.lg,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  cancelLabel: {
    fontSize: FONT.size.sm,
    color: COLORS.error,
    fontWeight: FONT.weight.semibold,
  },
});
