import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import type { ParkingSpot } from '@punto-park-u/shared-types';

// ── Types ──────────────────────────────────────────────────────────

export interface MapMarkerProps {
  spot: ParkingSpot;
  onPress?: (spot: ParkingSpot) => void;
}

// ── Color Map ──────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  libre: '#4caf50',
  ocupado: '#e53935',
  reservado: '#ff9800',
};

const ZONE_COLORS: Record<string, string> = {
  A: '#1a73e8',
  B: '#7b1fa2',
  C: '#00897b',
};

// ── Component ──────────────────────────────────────────────────────

export default function MapMarker({ spot, onPress }: MapMarkerProps) {
  const statusColor = STATUS_COLORS[spot.status] || '#888';
  const zoneColor = ZONE_COLORS[spot.zone] || '#888';

  // Generate coordinates based on zone position
  // In a real app, these would come from the backend
  const baseLat = 4.7110;
  const baseLng = -74.0721;
  const zoneOffset = spot.zone === 'A' ? -0.003 : spot.zone === 'C' ? 0.003 : 0;
  const indexOffset = (parseInt(spot.id.replace(/[A-Z]/g, ''), 10) || 0) * 0.0003;
  const coordinate = {
    latitude: baseLat + zoneOffset + indexOffset * 0.5,
    longitude: baseLng + indexOffset,
  };

  return (
    <Marker
      coordinate={coordinate}
      onPress={() => onPress?.(spot)}
      tracksViewChanges={false}
    >
      <View style={[styles.marker, { borderColor: zoneColor }]}>
        <View style={[styles.dot, { backgroundColor: statusColor }]} />
        <Text style={styles.label}>{spot.id}</Text>
      </View>
    </Marker>
  );
}

// ── Styles ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  marker: {
    width: 38,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  label: {
    fontSize: 9,
    fontWeight: '700',
    color: '#333',
  },
});
