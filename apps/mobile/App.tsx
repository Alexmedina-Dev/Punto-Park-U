import React, { useEffect, useState, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  setStorageAdapter,
  createMobileStorageAdapter,
} from '@punto-park-u/shared-stores';
import { initApiClient } from '@punto-park-u/shared-api';

import RootNavigator from './src/navigation/RootNavigator';
import ErrorBoundary from './src/components/ErrorBoundary';
import Constants from 'expo-constants';

// ── Keep splash screen visible while loading ───────────────────────

SplashScreen.preventAutoHideAsync().catch(() => {
  // Silently ignore — splash may already be hidden
});

// ── Initialize shared packages for mobile ──────────────────────────

function initializeApp() {
  // Set mobile storage adapter (AsyncStorage vs localStorage on web)
  setStorageAdapter(createMobileStorageAdapter(AsyncStorage));

  // Initialize API client with mobile base URL
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
      // Navigate to login on 401 — stores can listen for this
      console.warn('[App] Auth failure — redirecting to login');
    },
  });
}

// ── App component ──────────────────────────────────────────────────

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        initializeApp();

        // Load custom fonts if available
        try {
          await Font.loadAsync({
            // Custom fonts can be loaded here
            // 'Inter-Regular': require('./src/assets/fonts/Inter-Regular.ttf'),
            // 'Inter-Bold': require('./src/assets/fonts/Inter-Bold.ttf'),
          });
        } catch {
          // Font loading is non-critical
        }
      } catch (e) {
        console.warn('[App] Error during initialization:', e);
      } finally {
        setAppIsReady(true);
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  const onError = useCallback(() => {
    setAppIsReady(true);
  }, []);

  if (!appIsReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a73e8" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <ErrorBoundary onError={onError}>
        <SafeAreaProvider>
          <StatusBar style="dark" />
          <RootNavigator />
        </SafeAreaProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a73e8',
  },
});
