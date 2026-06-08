import { initApiClient, getApiClient } from '@punto-park-u/shared-api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

/**
 * Initialize the shared API client for the mobile environment.
 * Call once during app startup (e.g., in App.tsx).
 */
export function initializeMobileApi(): void {
  const apiUrl = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000/api';

  initApiClient({
    baseURL: apiUrl,
    timeout: 15000,
    getToken: async () => {
      try {
        return await AsyncStorage.getItem('token');
      } catch {
        return null;
      }
    },
    onAuthFailure: () => {
      console.warn('[api] Auth failure detected');
    },
  });
}

export { getApiClient };
