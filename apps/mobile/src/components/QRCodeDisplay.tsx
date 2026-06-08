import React from 'react';
import { View, Text, Image, StyleSheet, ActivityIndicator } from 'react-native';
import type { Ticket } from '@punto-park-u/shared-types';

// ── Types ──────────────────────────────────────────────────────────

export interface QRCodeDisplayProps {
  ticket: Ticket | null;
  imageUri: string | null;
  isLoading: boolean;
  error?: string | null;
  autoRefresh?: boolean;
}

// ── Component ──────────────────────────────────────────────────────

export default function QRCodeDisplay({
  ticket,
  imageUri,
  isLoading,
  error,
}: QRCodeDisplayProps) {
  // Loading state
  if (isLoading && !imageUri) {
    return (
      <View style={styles.container}>
        <View style={styles.qrFrame}>
          <ActivityIndicator size="large" color="#1a73e8" />
          <Text style={styles.loadingText}>Generando código QR...</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.container}>
        <View style={[styles.qrFrame, styles.qrFrameError]}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  // Empty / no ticket
  if (!ticket || !imageUri) {
    return (
      <View style={styles.container}>
        <View style={[styles.qrFrame, styles.qrFrameEmpty]}>
          <Text style={styles.emptyIcon}>📱</Text>
          <Text style={styles.emptyText}>Sin código QR disponible</Text>
          <Text style={styles.emptySubtext}>
            Creá una reserva para generar tu código QR
          </Text>
        </View>
      </View>
    );
  }

  // QR code display
  return (
    <View style={styles.container}>
      <View style={styles.qrFrame}>
        <Image
          source={{
            uri: imageUri.startsWith('file://') || imageUri.startsWith('data:')
              ? imageUri
              : `file://${imageUri}`,
          }}
          style={styles.qrImage}
          resizeMode="contain"
        />
      </View>

      {/* Ticket info */}
      <View style={styles.infoContainer}>
        {ticket.plate && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Placa</Text>
            <Text style={styles.infoValue}>{ticket.plate}</Text>
          </View>
        )}
        {ticket.reservationId && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Reserva</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              #{ticket.reservationId.slice(-8).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Estado</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>
              {ticket.validatedEntry
                ? ticket.validatedExit
                  ? 'Salida registrada'
                  : 'Estacionado'
                : 'Pendiente ingreso'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  qrFrame: {
    width: 260,
    height: 260,
    backgroundColor: '#fff',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    marginBottom: 20,
  },
  qrFrameError: {
    borderColor: '#e53935',
    borderWidth: 1.5,
  },
  qrFrameEmpty: {
    borderStyle: 'dashed',
    borderColor: '#bbb',
    borderWidth: 2,
  },
  qrImage: {
    width: 220,
    height: 220,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
  },
  errorIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#e53935',
    textAlign: 'center',
    fontWeight: '500',
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 4,
  },
  infoContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  infoLabel: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#1a1a2e',
    fontWeight: '600',
  },
  statusBadge: {
    backgroundColor: '#4caf5015',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 12,
    color: '#4caf50',
    fontWeight: '600',
  },
});
