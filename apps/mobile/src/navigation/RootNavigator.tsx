import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';

import AuthNavigator from './AuthNavigator';
import MainTabNavigator from './MainTabNavigator';
import { useAuthStore } from '@punto-park-u/shared-stores';

// ── Types ──────────────────────────────────────────────────────────

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// ── Deep linking configuration ─────────────────────────────────────

const linking = {
  prefixes: ['puntoparku://', Linking.createURL('/')],
  config: {
    screens: {
      Auth: {
        screens: {
          Login: 'auth/login',
          Register: 'auth/register',
          ForgotPassword: 'auth/forgot-password',
          TwoFactor: 'auth/2fa',
          OAuthCallback: 'auth/callback',
        },
      },
      Main: {
        screens: {
          HomeTab: {
            screens: {
              Dashboard: 'home',
            },
          },
          VehiclesTab: {
            screens: {
              VehicleList: 'vehicles',
              VehicleDetail: 'vehicles/:id',
              VehicleForm: 'vehicles/new',
            },
          },
          ReservationsTab: {
            screens: {
              ReservationList: 'reservations',
              ReservationDetail: 'reservations/:id',
              ReservationForm: 'reservations/new',
            },
          },
          PaymentsTab: {
            screens: {
              PaymentList: 'payments',
              PaymentDetail: 'payments/:id',
              Checkout: 'payments/checkout',
              PaymentSuccess: 'payments/success',
              PaymentFailure: 'payments/failure',
            },
          },
          ProfileTab: 'profile',
        },
      },
    },
  },
};

// ── Root Navigator ─────────────────────────────────────────────────

export default function RootNavigator() {
  const { isAuthenticated } = useAuthStore();

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainTabNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
