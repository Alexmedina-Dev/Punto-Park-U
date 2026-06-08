import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { Vehicle } from '@punto-park-u/shared-types';

// ── Helpers ────────────────────────────────────────────────────────

const VEHICLE_ICONS: Record<string, string> = {
  car: '🚗',
  moto: '🏍️',
  bike: '🚲',
};

const VEHICLE_TYPE_LABELS: Record<string, string> = {
  car: 'Automóvil',
  moto: 'Motocicleta',
  bike: 'Bicicleta',
};

// ── Types ──────────────────────────────────────────────────────────

export interface VehicleCardProps {
  vehicle: Vehicle;
  onPress?: () => void;
  onLongPress?: () => void;
  showActions?: boolean;
}

// ── Component ──────────────────────────────────────────────────────

export default function VehicleCard({
  vehicle,
  onPress,
  onLongPress,
}: VehicleCardProps) {
  const icon = VEHICLE_ICONS[vehicle.type] || '🚗';
  const typeLabel = VEHICLE_TYPE_LABELS[vehicle.type] || vehicle.type;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
      delayLongPress={500}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{icon}</Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.plate}>{vehicle.plate}</Text>
        <Text style={styles.details}>
          {vehicle.brand || typeLabel}
          {vehicle.model ? ` · ${vehicle.model}` : ''}
        </Text>
        {vehicle.color && (
          <View style={styles.colorRow}>
            <View style={[styles.colorDot, { backgroundColor: vehicle.color.toLowerCase() }]} />
            <Text style={styles.colorText}>{vehicle.color}</Text>
          </View>
        )}
      </View>

      {!vehicle.isActive && (
        <View style={styles.inactiveBadge}>
          <Text style={styles.inactiveText}>Inactivo</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ── Styles ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#1a73e815',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  icon: {
    fontSize: 24,
  },
  info: {
    flex: 1,
  },
  plate: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a2e',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  details: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  colorText: {
    fontSize: 12,
    color: '#888',
    textTransform: 'capitalize',
  },
  inactiveBadge: {
    backgroundColor: '#e5393515',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  inactiveText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#e53935',
  },
});
