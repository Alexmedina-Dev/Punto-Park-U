import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, RADIUS, SPACING, FONT } from '../constants/app';

// ── Types ─────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastConfig {
  message: string;
  type?: ToastType;
  duration?: number;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss?: () => void;
}

export interface ToastNotificationProps {
  config: ToastConfig | null;
  onComplete?: () => void;
}

// ── Theme ─────────────────────────────────────────────────────────────

const TOAST_THEME: Record<ToastType, { bg: string; icon: string; color: string }> = {
  success: { bg: '#dcfce7', icon: '✅', color: '#22c55e' },
  error: { bg: '#fce4ec', icon: '❌', color: '#ef4444' },
  warning: { bg: '#fef3c7', icon: '⚠️', color: '#f59e0b' },
  info: { bg: '#dbeafe', icon: 'ℹ️', color: '#3b82f6' },
};

const SCREEN_WIDTH = Dimensions.get('window').width;

// ── Component ─────────────────────────────────────────────────────────

export default function ToastNotification({
  config,
  onComplete,
}: ToastNotificationProps) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Show / Hide ──

  const show = useCallback(() => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        friction: 8,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [translateY, opacity]);

  const hide = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onComplete?.();
    });
  }, [translateY, opacity, onComplete]);

  // ── Effect ──

  useEffect(() => {
    if (config) {
      show();

      if (timerRef.current) clearTimeout(timerRef.current);

      timerRef.current = setTimeout(() => {
        hide();
      }, config.duration ?? 3000);

      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    } else {
      if (timerRef.current) clearTimeout(timerRef.current);
      opacity.setValue(0);
      translateY.setValue(-100);
    }
  }, [config, show, hide, opacity, translateY]);

  // ── Guard ──

  if (!config) return null;

  const theme = TOAST_THEME[config.type || 'info'];

  return (
    <Animated.View
      style={[
        styles.container,
        {
          paddingTop: insets.top + SPACING.sm,
          opacity,
          transform: [{ translateY }],
        },
      ]}
      pointerEvents="box-none"
    >
      <View style={[styles.toast, { backgroundColor: theme.bg }]}>
        <Text style={styles.icon}>{theme.icon}</Text>
        <Text style={[styles.message, { color: theme.color }]} numberOfLines={2}>
          {config.message}
        </Text>
        {config.actionLabel && config.onAction && (
          <TouchableOpacity
            style={styles.action}
            onPress={() => {
              config.onAction?.();
              hide();
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.actionLabel, { color: theme.color }]}>
              {config.actionLabel}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.dismiss}
          onPress={hide}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[styles.dismissIcon, { color: theme.color }]}>✕</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  icon: {
    fontSize: 18,
    marginRight: SPACING.sm,
  },
  message: {
    flex: 1,
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.medium,
    lineHeight: 18,
  },
  action: {
    marginLeft: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  actionLabel: {
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.semibold,
  },
  dismiss: {
    marginLeft: SPACING.xs,
    padding: SPACING.xs,
  },
  dismissIcon: {
    fontSize: 14,
    opacity: 0.6,
  },
});
