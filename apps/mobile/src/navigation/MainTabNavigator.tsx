import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// ── Screens ────────────────────────────────────────────────────────

import DashboardScreen from '../screens/DashboardScreen';
import VehicleListScreen from '../screens/VehicleListScreen';
import VehicleDetailScreen from '../screens/VehicleDetailScreen';
import VehicleFormScreen from '../screens/VehicleFormScreen';
import ReservationListScreen from '../screens/ReservationListScreen';
import ReservationDetailScreen from '../screens/ReservationDetailScreen';
import ReservationFormScreen from '../screens/ReservationFormScreen';
import PaymentListScreen from '../screens/PaymentListScreen';
import PaymentDetailScreen from '../screens/PaymentDetailScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import PaymentSuccessScreen from '../screens/PaymentSuccessScreen';
import PaymentFailureScreen from '../screens/PaymentFailureScreen';
import ProfileScreen from '../screens/ProfileScreen';
import NotificationsScreen from '../screens/NotificationsScreen';

// ── Types ──────────────────────────────────────────────────────────

export type MainTabParamList = {
  HomeTab: undefined;
  VehiclesTab: { screen?: string; params?: object };
  ReservationsTab: { screen?: string; params?: object };
  PaymentsTab: { screen?: string; params?: object };
  ProfileTab: undefined;
};

export type VehicleStackParamList = {
  VehicleList: undefined;
  VehicleDetail: { vehicle: any };
  VehicleForm: { mode: 'create' | 'edit'; vehicle?: any };
};

export type ReservationStackParamList = {
  ReservationList: undefined;
  ReservationDetail: { reservation: any };
  ReservationForm: undefined;
};

export type PaymentStackParamList = {
  PaymentList: undefined;
  PaymentDetail: { payment: any };
  Checkout: { reservation: any; amount: number };
  PaymentSuccess: {
    reservation?: any;
    amount: number;
    reference: string;
    epaycoRef?: string;
    vehiclePlate?: string;
  };
  PaymentFailure: {
    reservation?: any;
    amount?: number;
    error?: string;
    retryable?: boolean;
  };
};

// ── Tab Navigator ──────────────────────────────────────────────────

const Tab = createBottomTabNavigator<MainTabParamList>();

// ── Stack Navigators ───────────────────────────────────────────────

const VehicleStack = createNativeStackNavigator<VehicleStackParamList>();
const ReservationStack = createNativeStackNavigator<ReservationStackParamList>();
const PaymentStack = createNativeStackNavigator<PaymentStackParamList>();

function VehicleStackNavigator() {
  return (
    <VehicleStack.Navigator screenOptions={{ headerShown: false }}>
      <VehicleStack.Screen name="VehicleList" component={VehicleListScreen} />
      <VehicleStack.Screen name="VehicleDetail" component={VehicleDetailScreen} />
      <VehicleStack.Screen name="VehicleForm" component={VehicleFormScreen} />
    </VehicleStack.Navigator>
  );
}

function ReservationStackNavigator() {
  return (
    <ReservationStack.Navigator screenOptions={{ headerShown: false }}>
      <ReservationStack.Screen name="ReservationList" component={ReservationListScreen} />
      <ReservationStack.Screen name="ReservationDetail" component={ReservationDetailScreen} />
      <ReservationStack.Screen name="ReservationForm" component={ReservationFormScreen} />
    </ReservationStack.Navigator>
  );
}

function PaymentStackNavigator() {
  return (
    <PaymentStack.Navigator screenOptions={{ headerShown: false }}>
      <PaymentStack.Screen name="PaymentList" component={PaymentListScreen} />
      <PaymentStack.Screen name="PaymentDetail" component={PaymentDetailScreen} />
      <PaymentStack.Screen name="Checkout" component={CheckoutScreen} />
      <PaymentStack.Screen name="PaymentSuccess" component={PaymentSuccessScreen} />
      <PaymentStack.Screen name="PaymentFailure" component={PaymentFailureScreen} />
    </PaymentStack.Navigator>
  );
}

// ── Tab Icon ───────────────────────────────────────────────────────

const TAB_ICONS: Record<string, { active: string; inactive: string }> = {
  HomeTab: { active: '🏠', inactive: '🏡' },
  VehiclesTab: { active: '🚗', inactive: '🚙' },
  ReservationsTab: { active: '📋', inactive: '📄' },
  PaymentsTab: { active: '💳', inactive: '💵' },
  ProfileTab: { active: '👤', inactive: '👤' },
};

function TabIcon({ routeName, focused }: { routeName: string; focused: boolean }): React.JSX.Element {
  const icons = TAB_ICONS[routeName] || { active: '•', inactive: '•' };
  return (
    <Text style={{ fontSize: focused ? 24 : 20, opacity: focused ? 1 : 0.5 }}>
      {focused ? icons.active : icons.inactive}
    </Text>
  );
}

// ── Main Tab Navigator ─────────────────────────────────────────────

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }: any) => ({
        headerShown: false,
        tabBarIcon: ({ focused }: { focused: boolean }) => (
          <TabIcon routeName={route.name} focused={focused} />
        ),
        tabBarActiveTintColor: '#1a73e8',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
      })}
      backBehavior="history"
    >
      <Tab.Screen
        name="HomeTab"
        component={DashboardScreen}
        options={{ tabBarLabel: 'Inicio' }}
      />
      <Tab.Screen
        name="VehiclesTab"
        component={VehicleStackNavigator}
        options={{ tabBarLabel: 'Vehículos' }}
      />
      <Tab.Screen
        name="ReservationsTab"
        component={ReservationStackNavigator}
        options={{ tabBarLabel: 'Reservas' }}
      />
      <Tab.Screen
        name="PaymentsTab"
        component={PaymentStackNavigator}
        options={{ tabBarLabel: 'Pagos' }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Perfil' }}
      />
    </Tab.Navigator>
  );
}

// ── Styles ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
    paddingBottom: 6,
    paddingTop: 6,
    height: 60,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
});
