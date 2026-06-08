import React, { useState, useCallback } from 'react';
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
import { useVehicleStore } from '@punto-park-u/shared-stores';
import type { Vehicle } from '@punto-park-u/shared-types';

// ── Vehicle Types ──────────────────────────────────────────────────

const VEHICLE_TYPES = [
  { key: 'car', label: 'Automóvil', icon: '🚗' },
  { key: 'moto', label: 'Motocicleta', icon: '🏍️' },
  { key: 'bike', label: 'Bicicleta', icon: '🚲' },
] as const;

// ── VehicleFormScreen ──────────────────────────────────────────────

export default function VehicleFormScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { mode, vehicle } = route.params || {};
  const isEditing = mode === 'edit';
  const { createVehicle, updateVehicle, isLoading } = useVehicleStore();

  // ── Form State ──

  const [plate, setPlate] = useState((vehicle as Vehicle)?.plate || '');
  const [type, setType] = useState<string>((vehicle as Vehicle)?.type || 'car');
  const [brand, setBrand] = useState((vehicle as Vehicle)?.brand || '');
  const [model, setModel] = useState((vehicle as Vehicle)?.model || '');
  const [color, setColor] = useState((vehicle as Vehicle)?.color || '');

  // ── Validation ──

  const isValid = plate.trim().length >= 2;

  // ── Submit ──

  const handleSubmit = useCallback(async () => {
    if (!isValid) {
      Alert.alert('Validación', 'La placa debe tener al menos 2 caracteres');
      return;
    }

    const data = {
      plate: plate.trim().toUpperCase(),
      type,
      brand: brand.trim() || undefined,
      model: model.trim() || undefined,
      color: color.trim() || undefined,
    };

    let success: boolean;

    if (isEditing && vehicle) {
      success = await updateVehicle((vehicle as Vehicle).id, data);
    } else {
      success = await createVehicle(data);
    }

    if (success) {
      Alert.alert(
        isEditing ? 'Actualizado' : 'Creado',
        isEditing
          ? 'Vehículo actualizado correctamente'
          : 'Vehículo registrado correctamente',
        [{ text: 'OK', onPress: () => navigation?.goBack() }]
      );
    } else {
      Alert.alert(
        'Error',
        isEditing
          ? 'No se pudo actualizar el vehículo'
          : 'No se pudo crear el vehículo'
      );
    }
  }, [isValid, plate, type, brand, model, color, isEditing, vehicle, createVehicle, updateVehicle, navigation]);

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
        <Text style={styles.title}>{isEditing ? 'Editar' : 'Nuevo'} Vehículo</Text>
        <View style={{ width: 70 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Vehicle Type Selector */}
        <Text style={styles.fieldLabel}>Tipo de Vehículo</Text>
        <View style={styles.typeGrid}>
          {VEHICLE_TYPES.map((vt) => (
            <TouchableOpacity
              key={vt.key}
              style={[
                styles.typeOption,
                type === vt.key && styles.typeOptionSelected,
              ]}
              onPress={() => setType(vt.key)}
              activeOpacity={0.7}
            >
              <Text style={styles.typeIcon}>{vt.icon}</Text>
              <Text
                style={[
                  styles.typeLabel,
                  type === vt.key && styles.typeLabelSelected,
                ]}
              >
                {vt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Plate */}
        <Text style={styles.fieldLabel}>Placa *</Text>
        <TextInput
          style={styles.input}
          value={plate}
          onChangeText={setPlate}
          placeholder="ABC-123"
          placeholderTextColor="#bbb"
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={10}
        />

        {/* Brand */}
        <Text style={styles.fieldLabel}>Marca</Text>
        <TextInput
          style={styles.input}
          value={brand}
          onChangeText={setBrand}
          placeholder="Ej: Toyota, Honda, Specialized"
          placeholderTextColor="#bbb"
        />

        {/* Model */}
        <Text style={styles.fieldLabel}>Modelo</Text>
        <TextInput
          style={styles.input}
          value={model}
          onChangeText={setModel}
          placeholder="Ej: Corolla, CB500, Rockhopper"
          placeholderTextColor="#bbb"
        />

        {/* Color */}
        <Text style={styles.fieldLabel}>Color</Text>
        <TextInput
          style={styles.input}
          value={color}
          onChangeText={setColor}
          placeholder="Ej: Rojo, Azul, Negro"
          placeholderTextColor="#bbb"
        />

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitButton, !isValid && styles.submitDisabled]}
          onPress={handleSubmit}
          disabled={!isValid || isLoading}
          activeOpacity={0.7}
        >
          <Text style={styles.submitLabel}>
            {isLoading
              ? 'Guardando...'
              : isEditing
              ? 'Guardar Cambios'
              : 'Registrar Vehículo'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────

const COLOR_VALUES: Record<string, string> = {
  rojo: '#e53935',
  azul: '#1a73e8',
  negro: '#1a1a2e',
  blanco: '#fff',
  gris: '#888',
  plateado: '#ccc',
  verde: '#4caf50',
  amarillo: '#ffeb3b',
  naranja: '#ff9800',
};

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
  typeGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  typeOption: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeOptionSelected: {
    backgroundColor: '#1a73e815',
    borderColor: '#1a73e8',
  },
  typeIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  typeLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#888',
  },
  typeLabelSelected: {
    color: '#1a73e8',
    fontWeight: '700',
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
