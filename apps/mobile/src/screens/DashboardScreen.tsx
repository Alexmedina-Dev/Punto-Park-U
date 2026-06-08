import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useAppStore,
  useVehicleStore,
  useReservationStore,
  useAuthStore,
} from '@punto-park-u/shared-stores';
import StatCard from '../components/StatCard';
import { StatsSkeleton } from '../components/LoadingSkeleton';
import { useRefreshControl } from '../hooks/useRefreshControl';

// ── Quick Action Config ────────────────────────────────────────────

const QUICK_ACTIONS = [
  { id: 'reserve', icon: '📋', label: 'Nueva Reserva', color: '#1a73e8' },
  { id: 'addVehicle', icon: '🚗', label: 'Agregar Vehículo', color: '#4caf50' },
  { id: 'payments', icon: '💳', label: 'Pagos', color: '#ff9800' },
];

// ── DashboardScreen ────────────────────────────────────────────────

export default function DashboardScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { availability, fetchAvailability, isLoading: appLoading } = useAppStore();
  const { vehicles, fetchVehicles } = useVehicleStore();
  const { reservations, fetchReservations, stats, fetchStats } = useReservationStore();

  const { refreshing, onRefresh } = useRefreshControl(async () => {
    await Promise.all([
      fetchAvailability(),
      fetchVehicles(),
      fetchReservations(),
      fetchStats(),
    ]);
  });

  useEffect(() => {
    fetchAvailability();
    fetchVehicles();
    fetchReservations();
    fetchStats();
  }, []);

  // ── Quick Action Handler ──

  const handleQuickAction = useCallback(
    (actionId: string) => {
      switch (actionId) {
        case 'reserve':
          navigation?.navigate('ReservationsTab', { screen: 'ReservationForm' });
          break;
        case 'addVehicle':
          navigation?.navigate('VehiclesTab', { screen: 'VehicleForm' });
          break;
        case 'payments':
          navigation?.navigate('PaymentsTab');
          break;
        default:
          break;
      }
    },
    [navigation]
  );

  // ── Live Occupancy Section ──

  const renderOccupancy = () => {
    const statsData = availability?.stats;
    if (!statsData) return null;

    const vehicleTypes = [
      { key: 'cars', label: 'Autos', icon: '🚗', data: statsData.cars },
      { key: 'motos', label: 'Motos', icon: '🏍️', data: statsData.motos },
      { key: 'bikes', label: 'Bicis', icon: '🚲', data: statsData.bikes },
    ];

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ocupación en Vivo</Text>
        <View style={styles.occupancyGrid}>
          {vehicleTypes.map((vt) => {
            const used = vt.data?.used ?? 0;
            const total = vt.data?.total ?? 1;
            const pct = Math.round((used / total) * 100);
            const barColor = pct > 80 ? '#e53935' : pct > 50 ? '#ff9800' : '#4caf50';

            return (
              <View key={vt.key} style={styles.occupancyCard}>
                <Text style={styles.occupancyIcon}>{vt.icon}</Text>
                <Text style={styles.occupancyValue}>
                  {used}/{total}
                </Text>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      { width: `${pct}%`, backgroundColor: barColor },
                    ]}
                  />
                </View>
                <Text style={styles.occupancyLabel}>{vt.label}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  // ── Recent Activity ──

  const renderRecentActivity = () => {
    const recentReservations = reservations.slice(0, 3);
    if (recentReservations.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actividad Reciente</Text>
        {recentReservations.map((res) => (
          <View key={res.id} style={styles.activityItem}>
            <View style={styles.activityDot} />
            <View style={styles.activityContent}>
              <Text style={styles.activityText}>
                {res.status === 'active'
                  ? 'Reserva activa'
                  : res.status === 'completed'
                  ? 'Reserva completada'
                  : res.status === 'cancelled'
                  ? 'Reserva cancelada'
                  : 'Nueva reserva'}
              </Text>
              <Text style={styles.activityDate}>
                {res.date || res.entryTime || ''}
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  // ── Loading ──

  if (appLoading && !refreshing) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Hola, {user?.nombres || user?.username || 'Usuario'}</Text>
          <Text style={styles.subtitle}>Panel de Control</Text>
        </View>
        <StatsSkeleton />
      </View>
    );
  }

  // ── Render ──

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#1a73e8"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              Hola, {user?.nombres || user?.username || 'Usuario'}
            </Text>
            <Text style={styles.subtitle}>Panel de Control</Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation?.navigate('ProfileTab')}
            activeOpacity={0.7}
          >
            <Text style={styles.profileIcon}>👤</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <StatCard
            icon="🚗"
            label="Mis Vehículos"
            value={vehicles.length}
            color="#1a73e8"
          />
          <StatCard
            icon="📋"
            label="Reservas"
            value={stats?.total ?? reservations.length}
            color="#4caf50"
          />
          <StatCard
            icon="🅿️"
            label="Disponibles"
            value={
              (availability?.stats?.cars?.total ?? 0) +
              (availability?.stats?.motos?.total ?? 0) +
              (availability?.stats?.bikes?.total ?? 0)
            }
            color="#ff9800"
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
          <View style={styles.quickActions}>
            {QUICK_ACTIONS.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={[styles.quickAction, { borderLeftColor: action.color }]}
                onPress={() => handleQuickAction(action.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.quickActionIcon}>{action.icon}</Text>
                <Text style={styles.quickActionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Live Occupancy */}
        {renderOccupancy()}

        {/* Recent Activity */}
        {renderRecentActivity()}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  profileIcon: {
    fontSize: 22,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 8,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 14,
  },
  quickActions: {
    gap: 10,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  quickActionIcon: {
    fontSize: 22,
    marginRight: 14,
  },
  quickActionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  occupancyGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  occupancyCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  occupancyIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  occupancyValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 10,
  },
  barTrack: {
    width: '100%',
    height: 6,
    backgroundColor: '#e8eaed',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  occupancyLabel: {
    fontSize: 11,
    color: '#888',
    fontWeight: '500',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1a73e8',
    marginTop: 6,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a2e',
  },
  activityDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
});
