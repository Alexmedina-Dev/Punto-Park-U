import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useReservationStore } from '@punto-park-u/shared-stores';
import type { Reservation } from '@punto-park-u/shared-types';
import ReservationCard from '../components/ReservationCard';
import EmptyState from '../components/EmptyState';
import { ListSkeleton } from '../components/LoadingSkeleton';
import SwipeableItem from '../components/SwipeableItem';
import ConfirmDialog from '../components/ConfirmDialog';
import { useRefreshControl } from '../hooks/useRefreshControl';

// ── ReservationListScreen ──────────────────────────────────────────

export default function ReservationListScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { reservations, isLoading, fetchReservations, cancelReservation } =
    useReservationStore();
  const [cancelTarget, setCancelTarget] = useState<Reservation | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  const { refreshing, onRefresh } = useRefreshControl(async () => {
    await fetchReservations();
  });

  useEffect(() => {
    fetchReservations();
  }, []);

  // ── Filtering ──

  const filtered = filterStatus
    ? reservations.filter((r: Reservation) => r.status === filterStatus)
    : reservations;

  // ── Handlers ──

  const handleCreate = useCallback(() => {
    navigation?.navigate('ReservationForm');
  }, [navigation]);

  const handlePress = useCallback(
    (reservation: Reservation) => {
      navigation?.navigate('ReservationDetail', { reservation });
    },
    [navigation]
  );

  const handleCancel = useCallback(async () => {
    if (!cancelTarget) return;
    const success = await cancelReservation(cancelTarget.id);
    if (success) {
      Alert.alert('Cancelada', 'Reserva cancelada correctamente');
    } else {
      Alert.alert('Error', 'No se pudo cancelar la reserva');
    }
    setCancelTarget(null);
  }, [cancelTarget, cancelReservation]);

  // ── Filter Tabs ──

  const filters = [
    { key: null, label: 'Todas' },
    { key: 'active', label: 'Activas' },
    { key: 'pending', label: 'Pendientes' },
    { key: 'completed', label: 'Completadas' },
  ];

  // ── Render ──

  const renderItem = useCallback(
    ({ item }: { item: Reservation }) => {
      const canCancel = item.status === 'pending' || item.status === 'active';
      return (
        <SwipeableItem
          actions={
            canCancel
              ? [
                  {
                    label: 'Cancelar',
                    icon: '❌',
                    color: '#e53935',
                    onPress: () => setCancelTarget(item),
                  },
                ]
              : []
          }
        >
          <ReservationCard
            reservation={item}
            onPress={() => handlePress(item)}
            onLongPress={
              canCancel ? () => setCancelTarget(item) : undefined
            }
          />
        </SwipeableItem>
      );
    },
    [handlePress]
  );

  const keyExtractor = useCallback((item: Reservation) => item.id, []);

  if (isLoading && reservations.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Mis Reservas</Text>
          <TouchableOpacity style={styles.addButton} onPress={handleCreate} activeOpacity={0.7}>
            <Text style={styles.addIcon}>+</Text>
          </TouchableOpacity>
        </View>
        <ListSkeleton count={4} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Mis Reservas</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleCreate} activeOpacity={0.7}>
          <Text style={styles.addIcon}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f.key ?? 'all'}
            style={[
              styles.filterChip,
              filterStatus === f.key && styles.filterChipActive,
            ]}
            onPress={() => setFilterStatus(f.key)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterLabel,
                filterStatus === f.key && styles.filterLabelActive,
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={[
          styles.listContent,
          filtered.length === 0 && styles.listEmpty,
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
            icon="📋"
            title={
              filterStatus
                ? `Sin reservas ${filterStatus === 'active' ? 'activas' : filterStatus === 'pending' ? 'pendientes' : 'completadas'}`
                : 'Sin reservas'
            }
            message="Creá tu primera reserva para asegurar un lugar."
            actionLabel="Nueva Reserva"
            onAction={handleCreate}
          />
        }
      />

      {/* Cancel Confirmation */}
      <ConfirmDialog
        visible={!!cancelTarget}
        title="Cancelar Reserva"
        message="¿Estás seguro de cancelar esta reserva?"
        confirmLabel="Cancelar Reserva"
        cancelLabel="Volver"
        destructive
        onConfirm={handleCancel}
        onCancel={() => setCancelTarget(null)}
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
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1a73e8',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1a73e8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  addIcon: {
    fontSize: 26,
    color: '#fff',
    fontWeight: '300',
    marginTop: -2,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 8,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  filterChipActive: {
    backgroundColor: '#1a73e8',
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#888',
  },
  filterLabelActive: {
    color: '#fff',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingTop: 4,
  },
  listEmpty: {
    flex: 1,
  },
});
