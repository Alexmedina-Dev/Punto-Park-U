import React, { useCallback, useEffect } from 'react';
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
import { useVehicleStore } from '@punto-park-u/shared-stores';
import type { Vehicle } from '@punto-park-u/shared-types';
import VehicleCard from '../components/VehicleCard';
import EmptyState from '../components/EmptyState';
import { ListSkeleton } from '../components/LoadingSkeleton';
import SwipeableItem from '../components/SwipeableItem';
import ConfirmDialog from '../components/ConfirmDialog';
import { useRefreshControl } from '../hooks/useRefreshControl';

// ── VehicleListScreen ──────────────────────────────────────────────

export default function VehicleListScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { vehicles, isLoading, fetchVehicles, deleteVehicle } = useVehicleStore();
  const [deleteTarget, setDeleteTarget] = React.useState<Vehicle | null>(null);

  const { refreshing, onRefresh } = useRefreshControl(async () => {
    await fetchVehicles();
  });

  useEffect(() => {
    fetchVehicles();
  }, []);

  // ── Handlers ──

  const handleAdd = useCallback(() => {
    navigation?.navigate('VehicleForm', { mode: 'create' });
  }, [navigation]);

  const handlePress = useCallback(
    (vehicle: Vehicle) => {
      navigation?.navigate('VehicleDetail', { vehicle });
    },
    [navigation]
  );

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    const success = await deleteVehicle(deleteTarget.id);
    if (success) {
      Alert.alert('Eliminado', 'Vehículo eliminado correctamente');
    } else {
      Alert.alert('Error', 'No se pudo eliminar el vehículo');
    }
    setDeleteTarget(null);
  }, [deleteTarget, deleteVehicle]);

  // ── Render Item ──

  const renderItem = useCallback(
    ({ item }: { item: Vehicle }) => (
      <SwipeableItem
        actions={[
          {
            label: 'Eliminar',
            icon: '🗑️',
            color: '#e53935',
            onPress: () => setDeleteTarget(item),
          },
        ]}
      >
        <VehicleCard
          vehicle={item}
          onPress={() => handlePress(item)}
          onLongPress={() => setDeleteTarget(item)}
        />
      </SwipeableItem>
    ),
    [handlePress]
  );

  const keyExtractor = useCallback((item: Vehicle) => item.id, []);

  // ── Loading ──

  if (isLoading && vehicles.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Mis Vehículos</Text>
        </View>
        <ListSkeleton count={4} />
      </View>
    );
  }

  // ── Render ──

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Mis Vehículos</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAdd}
          activeOpacity={0.7}
        >
          <Text style={styles.addIcon}>+</Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={vehicles}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={[
          styles.listContent,
          vehicles.length === 0 && styles.listEmpty,
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
            icon="🚗"
            title="Sin vehículos"
            message="Agregá tu primer vehículo para empezar a usar el estacionamiento."
            actionLabel="Agregar Vehículo"
            onAction={handleAdd}
          />
        }
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        visible={!!deleteTarget}
        title="Eliminar Vehículo"
        message={`¿Estás seguro de eliminar el vehículo ${deleteTarget?.plate}?`}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
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
  listContent: {
    padding: 16,
    paddingTop: 4,
  },
  listEmpty: {
    flex: 1,
  },
});
