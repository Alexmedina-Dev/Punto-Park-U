import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { getApiClient } from '@punto-park-u/shared-api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Configuration ───────────────────────────────────────────────────

const PUSH_TOKEN_STORAGE_KEY = 'expo_push_token';

// ── Request permissions ─────────────────────────────────────────────

export async function requestPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    console.warn('[pushNotifications] Must use a physical device for push notifications');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('[pushNotifications] Push notification permissions not granted');
    return false;
  }

  return true;
}

// ── Get Expo push token ─────────────────────────────────────────────

export async function getExpoPushToken(): Promise<string | null> {
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync();
    return tokenData.data;
  } catch (err) {
    console.error('[pushNotifications] Failed to get Expo push token:', err);
    return null;
  }
}

// ── Register push token with backend ────────────────────────────────

export async function registerPushTokenWithBackend(): Promise<boolean> {
  try {
    // Check if we already registered this token
    const existingToken = await AsyncStorage.getItem(PUSH_TOKEN_STORAGE_KEY);
    if (existingToken) {
      return true; // Already registered
    }

    const hasPermission = await requestPermissions();
    if (!hasPermission) return false;

    const expoPushToken = await getExpoPushToken();
    if (!expoPushToken) return false;

    const platform = Platform.OS as 'ios' | 'android';

    const api = getApiClient();
    await api.post('/notifications/push-token', {
      expoPushToken,
      platform,
    });

    // Store locally so we don't re-register
    await AsyncStorage.setItem(PUSH_TOKEN_STORAGE_KEY, expoPushToken);

    console.log('[pushNotifications] Push token registered successfully');
    return true;
  } catch (err) {
    console.error('[pushNotifications] Failed to register push token:', err);
    return false;
  }
}

// ── Unregister push token ───────────────────────────────────────────

export async function unregisterPushToken(): Promise<boolean> {
  try {
    const expoPushToken = await AsyncStorage.getItem(PUSH_TOKEN_STORAGE_KEY);

    if (expoPushToken) {
      const api = getApiClient();
      await api.delete('/notifications/push-token', {
        data: { expoPushToken },
      });

      await AsyncStorage.removeItem(PUSH_TOKEN_STORAGE_KEY);
      console.log('[pushNotifications] Push token unregistered');
    }

    return true;
  } catch (err) {
    console.error('[pushNotifications] Failed to unregister push token:', err);
    return false;
  }
}

// ── Configure notification handler ──────────────────────────────────

export function configureNotificationHandler(): void {
  // Set up the handler that runs when a notification is received while app is foregrounded
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

// ── Configure Android notification channel ──────────────────────────

export async function configureAndroidChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Notificaciones',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1a73e8',
    });
  }
}
