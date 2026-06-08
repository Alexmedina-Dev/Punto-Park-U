import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  AppState,
  AppStateStatus,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Ticket } from '@punto-park-u/shared-types';
import QRCodeDisplay from '../components/QRCodeDisplay';
import {
  fetchQRImage,
  saveQRToPhotos,
  shareQR,
  copyQRDataToClipboard,
} from '../services/qrService';

// ── Types ──────────────────────────────────────────────────────────

interface ActiveReservationTicket {
  id: string;
  reservationId: string;
  plate: string;
  qrCode: string;
  qrData: string;
  validatedEntry: boolean;
  validatedExit: boolean;
}

// ── Mock Ticket (will be replaced with real API data) ───────────────

function getMockTicket(): Ticket {
  return {
    id: 'ticket-001',
    reservationId: 'res-abc-123',
    qrCode: '',
    qrData: 'PUNTO_PARK_U|res-abc-123|ABC-123|2026-06-06T14:00:00Z',
    plate: 'ABC-123',
    validatedEntry: false,
    validatedExit: false,
    createdAt: new Date().toISOString(),
  };
}

// ── QRDisplayScreen ────────────────────────────────────────────────

export default function QRDisplayScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const appState = useRef(AppState.currentState);

  // In production, get reservationId from route params
  const reservationId = route?.params?.reservationId;

  // ── Load QR Code ──

  const loadQR = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // In production: replace with actual API call
      // const ticketData = await getQRTicketService(reservationId);
      const ticketData = getMockTicket();
      setTicket(ticketData);

      const uri = await fetchQRImage(ticketData);
      setImageUri(uri);
    } catch (err) {
      console.error('[QRDisplayScreen] Failed to load QR:', err);
      setError('No se pudo cargar el código QR. Intentá de nuevo.');
    } finally {
      setIsLoading(false);
    }
  }, [reservationId]);

  useEffect(() => {
    loadQR();
  }, [loadQR]);

  // ── Auto-refresh on app foreground ──

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        loadQR();
      }
      appState.current = nextState;
    });

    return () => subscription.remove();
  }, [loadQR]);

  // ── Action Handlers ──

  const handleShare = useCallback(async () => {
    if (!imageUri) return;
    await shareQR(imageUri);
  }, [imageUri]);

  const handleSaveToPhotos = useCallback(async () => {
    if (!imageUri) return;
    await saveQRToPhotos(imageUri);
  }, [imageUri]);

  const handleCopy = useCallback(async () => {
    if (!ticket) return;
    await copyQRDataToClipboard(ticket);
  }, [ticket]);

  const handleRefresh = useCallback(() => {
    loadQR();
  }, [loadQR]);

  // ── Render ──

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation?.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Mi Código QR</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Info card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <Text style={styles.infoText}>
            Mostrá este código QR al ingresar y salir del parqueadero. El
            operador lo escaneará para registrar tu entrada y salida.
          </Text>
        </View>

        {/* QR Code */}
        <QRCodeDisplay
          ticket={ticket}
          imageUri={imageUri}
          isLoading={isLoading}
          error={error}
        />

        {/* Action Buttons */}
        {ticket && imageUri && !isLoading && (
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleShare}
              activeOpacity={0.7}
            >
              <Text style={styles.actionIcon}>📤</Text>
              <Text style={styles.actionLabel}>Compartir</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleSaveToPhotos}
              activeOpacity={0.7}
            >
              <Text style={styles.actionIcon}>💾</Text>
              <Text style={styles.actionLabel}>Guardar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleCopy}
              activeOpacity={0.7}
            >
              <Text style={styles.actionIcon}>📋</Text>
              <Text style={styles.actionLabel}>Copiar</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Auto-refresh info */}
        <Text style={styles.autoRefreshText}>
          El código QR se actualiza automáticamente al abrir la app
        </Text>

        {/* Force refresh */}
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
          activeOpacity={0.7}
          disabled={isLoading}
        >
          <Text style={styles.refreshIcon}>🔄</Text>
          <Text style={styles.refreshLabel}>
            {isLoading ? 'Actualizando...' : 'Actualizar QR'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  backIcon: {
    fontSize: 28,
    color: '#1a1a2e',
    fontWeight: '300',
    marginTop: -2,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  headerRight: {
    width: 40,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff3e015',
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#ff980030',
  },
  infoIcon: {
    fontSize: 18,
    marginRight: 10,
    marginTop: 1,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#8d6e00',
    lineHeight: 18,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 24,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    minWidth: 90,
  },
  actionIcon: {
    fontSize: 22,
    marginBottom: 6,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#555',
  },
  autoRefreshText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#aaa',
    marginBottom: 16,
    paddingHorizontal: 40,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#1a73e830',
  },
  refreshIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  refreshLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a73e8',
  },
});
