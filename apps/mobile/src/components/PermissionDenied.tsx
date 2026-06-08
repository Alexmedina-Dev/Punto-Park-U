import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';

// ── Types ──────────────────────────────────────────────────────────

export interface PermissionDeniedProps {
  icon?: string;
  title: string;
  message: string;
  buttonLabel?: string;
  onOpenSettings?: () => void;
  onRetry?: () => void;
}

// ── Component ──────────────────────────────────────────────────────

export default function PermissionDenied({
  icon = '🔒',
  title,
  message,
  buttonLabel = 'Abrir Configuración',
  onOpenSettings,
  onRetry,
}: PermissionDeniedProps) {
  const handleSettings = () => {
    if (onOpenSettings) {
      onOpenSettings();
    } else {
      Linking.openSettings();
    }
  };

  return (
    <View style={styles.container}>
      {/* Illustration Area */}
      <View style={styles.illustrationContainer}>
        <Text style={styles.icon}>{icon}</Text>
      </View>

      {/* Title */}
      <Text style={styles.title}>{title}</Text>

      {/* Message */}
      <Text style={styles.message}>{message}</Text>

      {/* Open Settings Button */}
      <TouchableOpacity
        style={styles.settingsButton}
        onPress={handleSettings}
        activeOpacity={0.7}
      >
        <Text style={styles.settingsIcon}>⚙️</Text>
        <Text style={styles.settingsLabel}>{buttonLabel}</Text>
      </TouchableOpacity>

      {/* Retry */}
      {onRetry && (
        <TouchableOpacity
          style={styles.retryButton}
          onPress={onRetry}
          activeOpacity={0.7}
        >
          <Text style={styles.retryLabel}>Intentar de nuevo</Text>
        </TouchableOpacity>
      )}

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsTitle}>¿Cómo habilitarlo?</Text>
        <View style={styles.instructionStep}>
          <Text style={styles.stepNumber}>1</Text>
          <Text style={styles.stepText}>
            Andá a Configuración del dispositivo
          </Text>
        </View>
        <View style={styles.instructionStep}>
          <Text style={styles.stepNumber}>2</Text>
          <Text style={styles.stepText}>Buscá "Punto Park U"</Text>
        </View>
        <View style={styles.instructionStep}>
          <Text style={styles.stepNumber}>3</Text>
          <Text style={styles.stepText}>Activá el permiso correspondiente</Text>
        </View>
      </View>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f0f2f5',
  },
  illustrationContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  icon: {
    fontSize: 48,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a2e',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
    paddingHorizontal: 16,
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a73e8',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 12,
    shadowColor: '#1a73e8',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  settingsIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  settingsLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  retryLabel: {
    fontSize: 14,
    color: '#1a73e8',
    fontWeight: '600',
  },
  instructionsContainer: {
    marginTop: 32,
    width: '100%',
    maxWidth: 300,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 16,
    textAlign: 'center',
  },
  instructionStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1a73e8',
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 24,
    marginRight: 12,
  },
  stepText: {
    flex: 1,
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
  },
});
