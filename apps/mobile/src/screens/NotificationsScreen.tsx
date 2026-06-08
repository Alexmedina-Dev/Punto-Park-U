import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Switch,
  Alert,
  AppState,
  AppStateStatus,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotificationStore } from '@punto-park-u/shared-stores';
import NotificationItem from '../components/NotificationItem';
import type { NotificationData } from '../components/NotificationItem';
import EmptyState from '../components/EmptyState';
import { ListSkeleton } from '../components/LoadingSkeleton';
import { useRefreshControl } from '../hooks/useRefreshControl';
import { registerPushTokenWithBackend, unregisterPushToken } from '../services/pushNotifications';

// ── NotificationsScreen ────────────────────────────────────────────

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotificationStore();

  const { refreshing, onRefresh } = useRefreshControl(async () => {
    await fetchNotifications();
  });

  const [showSettings, setShowSettings] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const appState = useRef(AppState.currentState);

  // ── Load notifications on mount ──

  useEffect(() => {
    fetchNotifications();
  }, []);

  // ── Re-fetch on foreground ──

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        fetchNotifications();
      }
      appState.current = nextState;
    });
    return () => subscription.remove();
  }, []);

  // ── Handlers ──

  const handleNotificationPress = useCallback(
    (notification: NotificationData) => {
      // In production: navigate based on notification type + data
      Alert.alert(notification.title, notification.message);
    },
    []
  );

  const handleMarkAsRead = useCallback(
    async (notification: NotificationData) => {
      if (!notification.read) {
        await markAsRead(notification.id);
      }
    },
    [markAsRead]
  );

  const handleMarkAllAsRead = useCallback(async () => {
    Alert.alert(
      'Marcar todo como leído',
      '¿Marcar todas las notificaciones como leídas?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Marcar todo',
          onPress: () => markAllAsRead(),
        },
      ]
    );
  }, [markAllAsRead]);

  const handleRegisterPush = useCallback(async () => {
    const success = await registerPushTokenWithBackend();
    if (success) {
      setPushEnabled(true);
      Alert.alert('Activado', 'Notificaciones push activadas correctamente.');
    } else {
      Alert.alert(
        'Error',
        'No se pudieron activar las notificaciones push. Verificá los permisos.'
      );
    }
  }, []);

  const handleTogglePush = useCallback(
    async (value: boolean) => {
      if (value) {
        await handleRegisterPush();
      } else {
        const success = await unregisterPushToken();
        if (success) {
          setPushEnabled(false);
          Alert.alert('Desactivado', 'Notificaciones push desactivadas.');
        }
      }
    },
    [handleRegisterPush]
  );

  // ── Settings View ──

  if (showSettings) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => setShowSettings(false)}
            style={styles.headerBackBtn}
            activeOpacity={0.7}
          >
            <Text style={styles.headerBackIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Configuración</Text>
          <View style={styles.headerRight} />
        </View>

        <View style={styles.settingsSection}>
          <Text style={styles.settingsSectionTitle}>Notificaciones Push</Text>
          <View style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Notificaciones Push</Text>
                <Text style={styles.settingDescription}>
                  Recibí alertas de reservas, pagos y actividad del parqueadero
                </Text>
              </View>
              <Switch
                value={pushEnabled}
                onValueChange={handleTogglePush}
                trackColor={{ false: '#ddd', true: '#1a73e860' }}
                thumbColor={pushEnabled ? '#1a73e8' : '#f4f3f4'}
              />
            </View>
          </View>
        </View>

        <View style={styles.settingsSection}>
          <Text style={styles.settingsSectionTitle}>Tipos de Notificación</Text>
          <View style={styles.settingsCard}>
            <SettingRow
              icon="📅"
              label="Recordatorio de Reservas"
              description="30 minutos antes de tu reserva"
              defaultEnabled
            />
            <SettingRow
              icon="💰"
              label="Confirmación de Pagos"
              description="Cuando un pago se procese"
              defaultEnabled
            />
            <SettingRow
              icon="🚗"
              label="Alertas de Ingreso/Salida"
              description="Cuando entrés o salgas del parqueadero"
              defaultEnabled
            />
            <SettingRow
              icon="⚙️"
              label="Alertas del Sistema"
              description="Mantenimiento, cambios de horario, etc."
              defaultEnabled
            />
          </View>
        </View>
      </View>
    );
  }

  // ── Main List View ──

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notificaciones</Text>
        <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <TouchableOpacity
              onPress={handleMarkAllAsRead}
              style={styles.markAllButton}
              activeOpacity={0.7}
            >
              <Text style={styles.markAllText}>Leer todo</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => setShowSettings(true)}
            style={styles.settingsButton}
            activeOpacity={0.7}
          >
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Badge */}
      {unreadCount > 0 && (
        <View style={styles.badgeContainer}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {unreadCount} notificación{unreadCount !== 1 ? 'es' : ''} sin leer
            </Text>
          </View>
        </View>
      )}

      {/* Loading */}
      {isLoading && notifications.length === 0 ? (
        <ListSkeleton count={5} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NotificationItem
              notification={item as unknown as NotificationData}
              onPress={handleNotificationPress}
              onMarkAsRead={handleMarkAsRead}
            />
          )}
          contentContainerStyle={[
            styles.listContent,
            notifications.length === 0 && styles.listEmpty,
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#1a73e8"
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="🔔"
              title="Sin notificaciones"
              message="No tenés notificaciones por ahora. Activá las notificaciones push para recibir alertas."
              actionLabel="Configurar notificaciones"
              onAction={() => setShowSettings(true)}
            />
          }
        />
      )}
    </View>
  );
}

// ── Setting Row Sub-component ──────────────────────────────────────

function SettingRow({
  icon,
  label,
  description,
  defaultEnabled,
}: {
  icon: string;
  label: string;
  description: string;
  defaultEnabled?: boolean;
}) {
  const [enabled, setEnabled] = useState(defaultEnabled ?? true);
  return (
    <View style={styles.settingRow}>
      <Text style={styles.settingIcon}>{icon}</Text>
      <View style={styles.settingInfo}>
        <Text style={styles.settingLabel}>{label}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <Switch
        value={enabled}
        onValueChange={setEnabled}
        trackColor={{ false: '#ddd', true: '#1a73e860' }}
        thumbColor={enabled ? '#1a73e8' : '#f4f3f4'}
      />
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  headerBackIcon: {
    fontSize: 26,
    color: '#1a1a2e',
    fontWeight: '300',
    marginTop: -2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  headerRight: {
    width: 36,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  markAllButton: {
    backgroundColor: '#1a73e815',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  markAllText: {
    fontSize: 13,
    color: '#1a73e8',
    fontWeight: '600',
  },
  settingsButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsIcon: {
    fontSize: 18,
  },
  badgeContainer: {
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  badge: {
    backgroundColor: '#1a73e815',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 12,
    color: '#1a73e8',
    fontWeight: '600',
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 24,
  },
  listEmpty: {
    flex: 1,
  },
  // ── Settings Styles ──
  settingsSection: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  settingsSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  settingsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  settingIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    color: '#999',
    lineHeight: 16,
  },
});
