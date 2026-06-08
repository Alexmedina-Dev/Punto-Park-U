import { useState, useEffect, useCallback } from 'react';
import { Alert, Linking } from 'react-native';
import { Camera } from 'expo-camera';

// ── Types ──────────────────────────────────────────────────────────

export type CameraPermissionStatus = 'granted' | 'denied' | 'undetermined' | 'blocked';

export interface UseCameraPermissionReturn {
  permission: CameraPermissionStatus;
  requestPermission: () => Promise<boolean>;
  openSettings: () => void;
  isLoading: boolean;
}

// ── Hook ───────────────────────────────────────────────────────────

export default function useCameraPermission(): UseCameraPermissionReturn {
  const [permission, setPermission] = useState<CameraPermissionStatus>('undetermined');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    try {
      const { status, canAskAgain } = await Camera.getCameraPermissionsAsync();
      if (status === 'granted') {
        setPermission('granted');
      } else if (!canAskAgain) {
        setPermission('blocked');
      } else {
        setPermission('denied');
      }
    } catch {
      setPermission('undetermined');
    }
  };

  const requestPermission = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { status, canAskAgain } = await Camera.requestCameraPermissionsAsync();
      if (status === 'granted') {
        setPermission('granted');
        return true;
      }
      if (!canAskAgain) {
        setPermission('blocked');
      } else {
        setPermission('denied');
      }
      return false;
    } catch {
      setPermission('undetermined');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const openSettings = useCallback(() => {
    Alert.alert(
      'Permiso de Cámara',
      'Necesitamos acceso a la cámara para escanear códigos QR. Podés habilitarlo desde Configuración.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Abrir Configuración', onPress: () => Linking.openSettings() },
      ]
    );
  }, []);

  return { permission, requestPermission, openSettings, isLoading };
}
