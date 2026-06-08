import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import { Platform, Alert } from 'react-native';
import { getApiClient } from '@punto-park-u/shared-api';
import type { Ticket, QRValidationResult } from '@punto-park-u/shared-types';

// ── Fetch QR Code Image ───────────────────────────────────────────

/**
 * Downloads the QR code image from the backend and returns a local file URI.
 */
export async function fetchQRImage(ticket: Ticket): Promise<string | null> {
  try {
    if (!ticket.qrCode) return null;

    // qrCode could be a base64 data URL or a URL path
    if (ticket.qrCode.startsWith('data:image')) {
      return ticket.qrCode;
    }

    // If it's a URL, download it
    const api = getApiClient();
    const response = await api.get(ticket.qrCode, { responseType: 'arraybuffer' });
    const base64 = btoa(
      new Uint8Array(response.data).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ''
      )
    );

    const fileUri = `${FileSystem.cacheDirectory}qr-${ticket.reservationId}.png`;
    await FileSystem.writeAsStringAsync(fileUri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return fileUri;
  } catch (err) {
    console.error('[qrService] Failed to fetch QR image:', err);
    return null;
  }
}

// ── Save QR to Photos ─────────────────────────────────────────────

export async function saveQRToPhotos(imageUri: string): Promise<boolean> {
  try {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permiso requerido',
        'Necesitamos acceso a tu galería para guardar el código QR.'
      );
      return false;
    }

    await MediaLibrary.saveToLibraryAsync(imageUri);
    Alert.alert('Guardado', 'Código QR guardado en tu galería.');
    return true;
  } catch (err) {
    console.error('[qrService] Failed to save QR to photos:', err);
    Alert.alert('Error', 'No se pudo guardar el código QR.');
    return false;
  }
}

// ── Share QR ──────────────────────────────────────────────────────

export async function shareQR(imageUri: string): Promise<boolean> {
  try {
    if (!(await Sharing.isAvailableAsync())) {
      Alert.alert('No disponible', 'Compartir no está disponible en este dispositivo.');
      return false;
    }

    await Sharing.shareAsync(imageUri, {
      mimeType: 'image/png',
      dialogTitle: 'Compartir código QR',
    });
    return true;
  } catch (err) {
    console.error('[qrService] Failed to share QR:', err);
    return false;
  }
}

// ── Copy QR Data to Clipboard ─────────────────────────────────────

export async function copyQRDataToClipboard(ticket: Ticket): Promise<void> {
  try {
    await Clipboard.setStringAsync(ticket.qrData);
    Alert.alert('Copiado', 'Datos del QR copiados al portapapeles.');
  } catch (err) {
    console.error('[qrService] Failed to copy QR data:', err);
    Alert.alert('Error', 'No se pudo copiar el código QR.');
  }
}

// ── Validate QR entry/exit ────────────────────────────────────────

export async function validateQRScan(
  qrContent: string,
  mode: 'entry' | 'exit'
): Promise<QRValidationResult> {
  const api = getApiClient();

  if (mode === 'entry') {
    const { data } = await api.post('/qr/validate', { qrContent });
    const resp = data as { success: boolean; data: QRValidationResult };
    return resp.data;
  } else {
    const { data } = await api.post('/qr/exit', { qrContent });
    const resp = data as { success: boolean; data: QRValidationResult };
    return resp.data;
  }
}
