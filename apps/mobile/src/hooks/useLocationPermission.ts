import { useState, useEffect, useCallback } from 'react';
import { Alert, Linking } from 'react-native';
import * as Location from 'expo-location';

// ── Types ──────────────────────────────────────────────────────────

export type LocationPermissionStatus = 'granted' | 'denied' | 'undetermined' | 'blocked';

export interface UseLocationPermissionReturn {
  permission: LocationPermissionStatus;
  requestPermission: () => Promise<boolean>;
  openSettings: () => void;
  isLoading: boolean;
}

// ── Hook ───────────────────────────────────────────────────────────

export default function useLocationPermission(): UseLocationPermissionReturn {
  const [permission, setPermission] = useState<LocationPermissionStatus>('undetermined');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    try {
      const { status, canAskAgain } = await Location.getForegroundPermissionsAsync();
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
      const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
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
      'Permiso de Ubicación',
      'Necesitamos acceso a tu ubicación para mostrarte el mapa del parqueadero y encontrar lugares disponibles.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Abrir Configuración', onPress: () => Linking.openSettings() },
      ]
    );
  }, []);

  return { permission, requestPermission, openSettings, isLoading };
}
