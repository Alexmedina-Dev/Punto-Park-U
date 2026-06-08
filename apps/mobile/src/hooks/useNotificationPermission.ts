import { useState, useEffect, useCallback } from 'react';
import { Alert, Linking } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

// ── Types ──────────────────────────────────────────────────────────

export type NotificationPermissionStatus = 'granted' | 'denied' | 'undetermined' | 'blocked';

export interface UseNotificationPermissionReturn {
  permission: NotificationPermissionStatus;
  requestPermission: () => Promise<boolean>;
  openSettings: () => void;
  isLoading: boolean;
  expoPushToken: string | null;
}

// ── Hook ───────────────────────────────────────────────────────────

export default function useNotificationPermission(): UseNotificationPermissionReturn {
  const [permission, setPermission] = useState<NotificationPermissionStatus>('undetermined');
  const [isLoading, setIsLoading] = useState(false);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    try {
      const { status, canAskAgain } = await Notifications.getPermissionsAsync();
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

  const getToken = async (): Promise<string | null> => {
    try {
      if (!Device.isDevice) {
        console.warn('[useNotificationPermission] Must use a physical device for push notifications');
        return null;
      }
      const tokenData = await Notifications.getExpoPushTokenAsync();
      return tokenData.data;
    } catch (err) {
      console.error('[useNotificationPermission] Failed to get Expo push token:', err);
      return null;
    }
  };

  const requestPermission = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { status, canAskAgain } = await Notifications.requestPermissionsAsync();
      if (status === 'granted') {
        setPermission('granted');
        const token = await getToken();
        if (token) setExpoPushToken(token);
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
      'Permiso de Notificaciones',
      'Necesitamos acceso a las notificaciones para enviarte alertas de reservas, pagos y actividad del parqueadero.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Abrir Configuración', onPress: () => Linking.openSettings() },
      ]
    );
  }, []);

  return { permission, requestPermission, openSettings, isLoading, expoPushToken };
}
