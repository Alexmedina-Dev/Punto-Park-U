import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useReservationStore,
  useVehicleStore,
} from '@punto-park-u/shared-stores';
import type { Vehicle } from '@punto-park-u/shared-types';
import { ListSkeleton } from '../components/LoadingSkeleton';

// ── ReservationFormScreen ──────────────────────────────────────────

export default function ReservationFormScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { vehicles, fetchVehicles, isLoading: vehiclesLoading } = useVehicleStore();
  const { createReservation, isLoading } = useReservationStore();

  // ── Form State ──

  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchVehicles();
  }, []);

  // ── Validation ──

  const isValid =
    date.trim().length > 0 &&
    startTime.trim().length > 0 &&
    endTime.trim().length > 0 &&
    selectedVehicleId.length > 0;

  // ── Submit ──

  const handleSubmit = useCallback(async () => {
    if (!isValid) {
      Alert.alert('Validación', 'Completá todos los campos requeridos');
      return;
    }

    const success = await createReservation({
      vehicle: selectedVehicleId,
      spot: '', // Will be assigned by backend
      entryTime: `${date}T${startTime}`,
      date,
      startTime,
      endTime,
      notes: notes.trim() || undefined,
    });

    if (success) {
      Alert.alert('Reserva Creada', 'Tu reserva fue registrada correctamente', [
        { text: 'OK', onPress: () => navigation?.goBack() },
      ]);
    } else {
      Alert.alert('Error', 'No se pudo crear la reserva');
    }
  }, [isValid, date, startTime, endTime, selectedVehicleId, notes, createReservation, navigation]);

  // ── Render ──

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()}>
          <Text style={styles.backButton}>← Cancelar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Nueva Reserva</Text>
        <View style={{ width: 70 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Vehicle Selector */}
        <Text style={styles.fieldLabel}>Vehículo *</Text>
        {vehiclesLoading && vehicles.length === 0 ? (
          <ListSkeleton count={2} />
        ) : vehicles.length === 0 ? (
          <View style={styles.noVehicles}>
            <Text style={styles.noVehiclesText}>
              No tenés vehículos registrados.
            </Text>
            <TouchableOpacity
              onPress={() => navigation?.navigate('VehiclesTab', { screen: 'VehicleForm', params: { mode: 'create' } })}
            >
              <Text style={styles.addVehicleLink}>Agregar vehículo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.vehicleList}>
            {vehicles.map((v: Vehicle) => (
              <TouchableOpacity
                key={v.id}
                style={[
                  styles.vehicleOption,
                  selectedVehicleId === v.id && styles.vehicleOptionSelected,
                ]}
                onPress={() => setSelectedVehicleId(v.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.vehicleIcon}>
                  {v.type === 'car' ? '🚗' : v.type === 'moto' ? '🏍️' : '🚲'}
                </Text>
                <View style={styles.vehicleInfo}>
                  <Text style={styles.vehiclePlate}>{v.plate}</Text>
                  <Text style={styles.vehicleDetail}>
                    {v.brand} {v.model}
                  </Text>
                </View>
                {selectedVehicleId === v.id && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Date */}
        <Text style={styles.fieldLabel}>Fecha *</Text>
        <TextInput
          style={styles.input}
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#bbb"
          autoCapitalize="none"
        />

        {/* Start Time */}
        <Text style={styles.fieldLabel}>Hora de inicio *</Text>
        <TextInput
          style={styles.input}
          value={startTime}
          onChangeText={setStartTime}
          placeholder="HH:MM (ej: 14:00)"
          placeholderTextColor="#bbb"
          autoCapitalize="none"
        />

        {/* End Time */}
        <Text style={styles.fieldLabel}>Hora de fin *</Text>
        <TextInput
          style={styles.input}
          value={endTime}
          onChangeText={setEndTime}
          placeholder="HH:MM (ej: 16:00)"
          placeholderTextColor="#bbb"
          autoCapitalize="none"
        />

        {/* Notes */}
        <Text style={styles.fieldLabel}>Notas</Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Alguna observación (opcional)"
          placeholderTextColor="#bbb"
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitButton, !isValid && styles.submitDisabled]}
          onPress={handleSubmit}
          disabled={!isValid || isLoading || vehicles.length === 0}
          activeOpacity={0.7}
        >
          <Text style={styles.submitLabel}>
            {isLoading ? 'Creando...' : 'Crear Reserva'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
    paddingBottom: 40,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    color: '#1a1a2e',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  notesInput: {
    minHeight: 80,
  },
  vehicleList: {
    gap: 8,
  },
  vehicleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  vehicleOptionSelected: {
    borderColor: '#1a73e8',
    backgroundColor: '#1a73e808',
  },
  vehicleIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehiclePlate: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a2e',
    textTransform: 'uppercase',
  },
  vehicleDetail: {
    fontSize: 12,
    color: '#888',
    marginTop: 1,
  },
  checkmark: {
    fontSize: 18,
    color: '#1a73e8',
    fontWeight: '700',
  },
  noVehicles: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
  },
  noVehiclesText: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  addVehicleLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a73e8',
  },
  submitButton: {
    backgroundColor: '#1a73e8',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 28,
    shadowColor: '#1a73e8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  submitDisabled: {
    opacity: 0.5,
  },
  submitLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
