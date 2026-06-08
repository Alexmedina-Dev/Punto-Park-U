import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { COLORS, RADIUS, SPACING, FONT } from '../constants/app';
import { getErrorTitle, getUserMessage } from '../utils/errors';

// ── Types ─────────────────────────────────────────────────────────────

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onRetry?: () => void;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// ── Component ─────────────────────────────────────────────────────────

export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
    this.props.onRetry?.();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <View style={styles.card}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.title}>Algo salió mal</Text>
            <Text style={styles.message}>
              {this.state.error
                ? getUserMessage(this.state.error)
                : 'Ha ocurrido un error inesperado.'}
            </Text>

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={this.handleRetry}
                activeOpacity={0.7}
              >
                <Text style={styles.retryLabel}>Intentar de nuevo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dismissButton}
                onPress={() => this.setState({ hasError: false })}
                activeOpacity={0.7}
              >
                <Text style={styles.dismissLabel}>Descartar</Text>
              </TouchableOpacity>
            </View>

            {__DEV__ && this.state.error && (
              <ScrollView style={styles.devInfo}>
                <Text style={styles.devLabel}>Error:</Text>
                <Text style={styles.devText}>
                  {this.state.error.name}: {this.state.error.message}
                </Text>
                {this.state.error.stack && (
                  <>
                    <Text style={styles.devLabel}>Stack:</Text>
                    <Text style={styles.devStack}>{this.state.error.stack}</Text>
                  </>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

// ── Inline Error Fallback ─────────────────────────────────────────────

export interface InlineErrorProps {
  error: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export function InlineError({ error, onRetry, onDismiss }: InlineErrorProps) {
  return (
    <View style={styles.inlineContainer}>
      <View style={styles.inlineContent}>
        <Text style={styles.inlineIcon}>⚠️</Text>
        <View style={styles.inlineText}>
          <Text style={styles.inlineTitle}>Error</Text>
          <Text style={styles.inlineMessage}>{error}</Text>
        </View>
      </View>
      <View style={styles.inlineActions}>
        {onRetry && (
          <TouchableOpacity onPress={onRetry} activeOpacity={0.7}>
            <Text style={styles.inlineRetry}>Reintentar</Text>
          </TouchableOpacity>
        )}
        {onDismiss && (
          <TouchableOpacity onPress={onDismiss} activeOpacity={0.7}>
            <Text style={styles.inlineDismiss}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    padding: SPACING.xl,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xxl,
    padding: SPACING.xl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONT.size.lg,
    fontWeight: FONT.weight.bold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  message: {
    fontSize: FONT.size.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  actions: {
    width: '100%',
    gap: SPACING.sm,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  retryLabel: {
    color: COLORS.textInverse,
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.semibold,
  },
  dismissButton: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  dismissLabel: {
    color: COLORS.textTertiary,
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.medium,
  },
  devInfo: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.bg,
    borderRadius: RADIUS.md,
    width: '100%',
    maxHeight: 200,
  },
  devLabel: {
    fontSize: FONT.size.xs,
    fontWeight: FONT.weight.bold,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  devText: {
    fontSize: FONT.size.xs,
    color: COLORS.error,
    fontFamily: 'monospace',
  },
  devStack: {
    fontSize: FONT.size.xs,
    color: COLORS.textTertiary,
    fontFamily: 'monospace',
  },
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.errorLight,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  inlineContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  inlineIcon: {
    fontSize: 16,
    marginRight: SPACING.sm,
  },
  inlineText: {
    flex: 1,
  },
  inlineTitle: {
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.semibold,
    color: COLORS.error,
  },
  inlineMessage: {
    fontSize: FONT.size.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  inlineActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginLeft: SPACING.sm,
  },
  inlineRetry: {
    fontSize: FONT.size.sm,
    color: COLORS.primary,
    fontWeight: FONT.weight.semibold,
  },
  inlineDismiss: {
    fontSize: FONT.size.sm,
    color: COLORS.textTertiary,
    padding: SPACING.xs,
  },
});
