import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Vibration,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera, CameraType } from 'expo-camera';
import QRScannerOverlay from '../components/QRScannerOverlay';
import PermissionDenied from '../components/PermissionDenied';
import useCameraPermission from '../hooks/useCameraPermission';
import { validateQRScan } from '../services/qrService';
import type { QRValidationResult } from '@punto-park-u/shared-types';

// ── Types ──────────────────────────────────────────────────────────

type ScanMode = 'entry' | 'exit';

interface ScanResult {
  success: boolean;
  message: string;
  data?: QRValidationResult;
}

// ── QRScanScreen ───────────────────────────────────────────────────

export default function QRScanScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const { permission, requestPermission, openSettings } = useCameraPermission();
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [isScanning, setIsScanning] = useState(true);
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Default mode: entry. Can be overridden via route params
  const scanMode: ScanMode = route?.params?.mode || 'entry';

  // ── Barcode scanner ref ──

  const hasScanned = useRef(false);

  // ── Reset scanner after a delay ──

  const resetScanner = useCallback(() => {
    setTimeout(() => {
      hasScanned.current = false;
      setIsScanning(true);
      setLastResult(null);
    }, 3000);
  }, []);

  // ── Handle barcode detection ──

  const handleBarCodeScanned = useCallback(
    async ({ data }: { type: string; data: string }) => {
      if (hasScanned.current || isProcessing) return;

      hasScanned.current = true;
      setIsScanning(false);
      setIsProcessing(true);
      Vibration.vibrate(200);

      try {
        const result = await validateQRScan(data, scanMode);
        setLastResult({
          success: true,
          message:
            scanMode === 'entry'
              ? '✅ Ingreso registrado correctamente'
              : '✅ Salida registrada correctamente',
          data: result,
        });

        Alert.alert(
          scanMode === 'entry' ? 'Ingreso Registrado' : 'Salida Registrada',
          result.message || 'Operación exitosa',
          [{ text: 'OK', onPress: resetScanner }]
        );
      } catch (err) {
        console.error('[QRScanScreen] Validation failed:', err);
        setLastResult({
          success: false,
          message: '❌ Error al validar el código QR',
        });

        Alert.alert('Error', 'No se pudo validar el código QR. Intentá de nuevo.', [
          { text: 'Reintentar', onPress: resetScanner },
        ]);
      } finally {
        setIsProcessing(false);
      }
    },
    [scanMode, isProcessing, resetScanner]
  );

  // ── Torch toggle ──

  const handleTorchToggle = useCallback(() => {
    setTorchEnabled((prev) => !prev);
  }, []);

  // ── Mode switch ──

  const handleModeSwitch = useCallback(() => {
    // Navigate with new mode
    navigation?.setParams({ mode: scanMode === 'entry' ? 'exit' : 'entry' });
  }, [navigation, scanMode]);

  // ── Manual code entry ──

  const handleManualEntry = useCallback(() => {
    Alert.prompt?.(
      'Ingreso Manual',
      `Ingresá el código QR para registrar ${scanMode === 'entry' ? 'ingreso' : 'salida'}:`,
      async (text: string) => {
        if (text) {
          hasScanned.current = true;
          setIsScanning(false);
          setIsProcessing(true);
          try {
            const result = await validateQRScan(text, scanMode);
            setLastResult({ success: true, message: '✅ Operación exitosa', data: result });
            Alert.alert('Éxito', result.message || 'Operación exitosa', [
              { text: 'OK', onPress: resetScanner },
            ]);
          } catch {
            setLastResult({ success: false, message: '❌ Error en la validación' });
            Alert.alert('Error', 'Código inválido', [{ text: 'OK', onPress: resetScanner }]);
          } finally {
            setIsProcessing(false);
          }
        }
      }
    );
  }, [scanMode, resetScanner]);

  // ── Render: Permission Denied ──

  if (permission === 'denied' || permission === 'blocked') {
    return (
      <PermissionDenied
        icon={permission === 'blocked' ? '🔒' : '📷'}
        title="Acceso a la Cámara"
        message={
          permission === 'blocked'
            ? 'El permiso de cámara está desactivado. Habilitalo desde Configuración para escanear códigos QR.'
            : 'Necesitamos acceso a la cámara para escanear códigos QR de ingreso y salida.'
        }
        buttonLabel="Abrir Configuración"
        onOpenSettings={openSettings}
        onRetry={requestPermission}
      />
    );
  }

  // ── Render: Awaiting Permission ──

  if (permission === 'undetermined') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a73e8" />
        <Text style={styles.loadingText}>Solicitando permiso de cámara...</Text>
        <TouchableOpacity
          style={styles.requestButton}
          onPress={requestPermission}
          activeOpacity={0.7}
        >
          <Text style={styles.requestLabel}>Permitir Acceso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Render: Scanner ──

  return (
    <View style={styles.container}>
      {/* Camera */}
      <Camera
        style={styles.camera}
        type={CameraType.back}
        onBarCodeScanned={isScanning ? handleBarCodeScanned : undefined}
        barCodeScannerSettings={{
          barCodeTypes: ['qr'],
        }}
        flashMode={torchEnabled ? 'torch' : 'off'}
      >
        {/* Scanner Overlay */}
        <QRScannerOverlay
          title={scanMode === 'entry' ? 'Escanear Ingreso' : 'Escanear Salida'}
          subtitle="Posicioná el código QR dentro del marco"
        />
      </Camera>

      {/* Bottom Controls */}
      <View style={[styles.bottomControls, { paddingBottom: insets.bottom + 16 }]}>
        {/* Torch */}
        <TouchableOpacity
          style={styles.controlButton}
          onPress={handleTorchToggle}
          activeOpacity={0.7}
        >
          <Text style={styles.controlIcon}>{torchEnabled ? '🔦' : '💡'}</Text>
          <Text style={styles.controlLabel}>
            {torchEnabled ? 'Apagar' : 'Linterna'}
          </Text>
        </TouchableOpacity>

        {/* Mode indicator */}
        <TouchableOpacity
          style={[styles.modeButton, scanMode === 'exit' && styles.modeButtonExit]}
          onPress={handleModeSwitch}
          activeOpacity={0.7}
        >
          <Text style={styles.modeIcon}>
            {scanMode === 'entry' ? '🚗' : '🚪'}
          </Text>
          <Text style={styles.modeLabel}>
            {scanMode === 'entry' ? 'Modo Ingreso' : 'Modo Salida'}
          </Text>
        </TouchableOpacity>

        {/* Manual entry */}
        <TouchableOpacity
          style={styles.controlButton}
          onPress={handleManualEntry}
          activeOpacity={0.7}
        >
          <Text style={styles.controlIcon}>⌨️</Text>
          <Text style={styles.controlLabel}>Manual</Text>
        </TouchableOpacity>
      </View>

      {/* Processing overlay */}
      {isProcessing && (
        <View style={styles.processingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.processingText}>Procesando...</Text>
        </View>
      )}

      {/* Back button */}
      <TouchableOpacity
        style={[styles.backButton, { top: insets.top + 12 }]}
        onPress={() => navigation?.goBack()}
        activeOpacity={0.7}
      >
        <Text style={styles.backIcon}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
    padding: 24,
  },
  loadingText: {
    fontSize: 16,
    color: '#888',
    marginTop: 16,
    marginBottom: 20,
  },
  requestButton: {
    backgroundColor: '#1a73e8',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
  },
  requestLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  camera: {
    flex: 1,
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.9)',
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  controlButton: {
    alignItems: 'center',
    padding: 8,
  },
  controlIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  controlLabel: {
    fontSize: 11,
    color: '#ccc',
    fontWeight: '500',
  },
  modeButton: {
    alignItems: 'center',
    backgroundColor: '#1a73e8',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  modeButtonExit: {
    backgroundColor: '#e53935',
  },
  modeIcon: {
    fontSize: 22,
    marginBottom: 2,
  },
  modeLabel: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '700',
  },
});
