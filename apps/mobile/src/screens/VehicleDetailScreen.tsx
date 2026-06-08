import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVehicleStore } from '@punto-park-u/shared-stores';
import type { Vehicle } from '@punto-park-u/shared-types';
import ConfirmDialog from '../components/ConfirmDialog';

// ── Helpers ────────────────────────────────────────────────────────

const VEHICLE_TYPE_LABELS: Record<string, string> = {
  car: 'Automóvil',
  moto: 'Motocicleta',
  bike: 'Bicicleta',
};

const VEHICLE_TYPE_ICONS: Record<string, string> = {
  car: '🚗',
  moto: '🏍️',
  bike: '🚲',
};

// ── VehicleDetailScreen ────────────────────────────────────────────

export default function VehicleDetailScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { vehicle: initialVehicle } = route.params || {};
  const { vehicles, deleteVehicle } = useVehicleStore();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Get fresh vehicle data from store
  const vehicle = vehicles.find((v: Vehicle) => v.id === initialVehicle?.id) || initialVehicle;

  // ── Handlers ──

  const handleEdit = useCallback(() => {
    navigation?.navigate('VehicleForm', { mode: 'edit', vehicle });
  }, [navigation, vehicle]);

  const handleDelete = useCallback(async () => {
    if (!vehicle) return;
    const success = await deleteVehicle(vehicle.id);
    setShowDeleteDialog(false);
    if (success) {
      Alert.alert('Eliminado', 'Vehículo eliminado correctamente');
      navigation?.goBack();
    } else {
      Alert.alert('Error', 'No se pudo eliminar el vehículo');
    }
  }, [vehicle, deleteVehicle, navigation]);

  // ── Guard ──

  if (!vehicle) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation?.goBack()}>
            <Text style={styles.backButton}>← Volver</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Vehículo no encontrado</Text>
        </View>
      </View>
    );
  }

  const typeIcon = VEHICLE_TYPE_ICONS[vehicle.type] || '🚗';
  const typeLabel = VEHICLE_TYPE_LABELS[vehicle.type] || vehicle.type;

  // ── Detail Fields ──

  const details = [
    { label: 'Placa', value: vehicle.plate },
    { label: 'Tipo', value: typeLabel },
    { label: 'Marca', value: vehicle.brand || '—' },
    { label: 'Modelo', value: vehicle.model || '—' },
    { label: 'Color', value: vehicle.color || '—' },
    { label: 'Estado', value: vehicle.isActive ? 'Activo' : 'Inactivo' },
  ];

  // ── Render ──

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()}>
          <Text style={styles.backButton}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Detalle</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Vehicle Icon & Plate */}
        <View style={styles.heroSection}>
          <View style={styles.heroIconContainer}>
            <Text style={styles.heroIcon}>{typeIcon}</Text>
          </View>
          <Text style={styles.plate}>{vehicle.plate}</Text>
        </View>

        {/* Detail Card */}
        <View style={styles.detailCard}>
          {details.map((d, index) => (
            <View
              key={d.label}
              style={[
                styles.detailRow,
                index < details.length - 1 && styles.detailRowBorder,
              ]}
            >
              <Text style={styles.detailLabel}>{d.label}</Text>
              <Text style={styles.detailValue}>{d.value}</Text>
            </View>
          ))}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEdit}
            activeOpacity={0.7}
          >
            <Text style={styles.editIcon}>✏️</Text>
            <Text style={styles.editLabel}>Editar Vehículo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => setShowDeleteDialog(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.deleteIcon}>🗑️</Text>
            <Text style={styles.deleteLabel}>Eliminar Vehículo</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Delete Confirmation */}
      <ConfirmDialog
        visible={showDeleteDialog}
        title="Eliminar Vehículo"
        message={`¿Estás seguro de eliminar ${vehicle.plate}? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteDialog(false)}
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
    paddingVertical: 12,
  },
  backButton: {
    fontSize: 16,
    color: '#1a73e8',
    fontWeight: '500',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 8,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  heroIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#1a73e815',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroIcon: {
    fontSize: 42,
  },
  plate: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a2e',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  detailCard: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  detailRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  detailLabel: {
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a2e',
    textTransform: 'capitalize',
  },
  actions: {
    gap: 12,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a73e8',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#1a73e8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  editIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  editLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#e53935',
  },
  deleteIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  deleteLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e53935',
  },
  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFoundText: {
    fontSize: 16,
    color: '#888',
  },
});
