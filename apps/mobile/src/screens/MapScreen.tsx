import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Region, PROVIDER_GOOGLE, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import type { ParkingSpot } from '@punto-park-u/shared-types';
import { getParkingSpotsService } from '@punto-park-u/shared-api';
import ZonePolygon from '../components/ZonePolygon';
import MapMarker from '../components/MapMarker';
import PermissionDenied from '../components/PermissionDenied';
import useLocationPermission from '../hooks/useLocationPermission';
import { getCurrentLocation, DEFAULT_REGION } from '../services/locationService';

// ── Constants ──────────────────────────────────────────────────────

const SCREEN_HEIGHT = Dimensions.get('window').height;
const BOTTOM_SHEET_MIN_HEIGHT = 120;
const INITIAL_REGION: Region = {
  latitude: 4.7110,
  longitude: -74.0721,
  latitudeDelta: 0.012,
  longitudeDelta: 0.012,
};

// ── Zone Info ──────────────────────────────────────────────────────

const ZONE_INFO: Record<string, { label: string; color: string; description: string }> = {
  A: {
    label: 'Zona A',
    color: '#1a73e8',
    description: 'Cubierta — Entrada principal',
  },
  B: {
    label: 'Zona B',
    color: '#7b1fa2',
    description: 'Descubierta — Costado este',
  },
  C: {
    label: 'Zona C',
    color: '#00897b',
    description: 'Cubierta — Costado oeste',
  },
};

// ── Spot Detail Panel ──────────────────────────────────────────────

function SpotDetailPanel({
  spot,
  onClose,
}: {
  spot: ParkingSpot;
  onClose: () => void;
}) {
  const zoneInfo = ZONE_INFO[spot.zone] || { label: 'Zona', color: '#888', description: '' };
  const statusLabel =
    spot.status === 'libre'
      ? 'Disponible'
      : spot.status === 'ocupado'
      ? 'Ocupado'
      : 'Reservado';

  const statusColor =
    spot.status === 'libre'
      ? '#4caf50'
      : spot.status === 'ocupado'
      ? '#e53935'
      : '#ff9800';

  return (
    <View style={styles.spotDetail}>
      <View style={styles.spotDetailHeader}>
        <View style={styles.spotDetailTitleRow}>
          <View style={[styles.zoneIndicator, { backgroundColor: zoneInfo.color }]} />
          <Text style={styles.spotDetailTitle}>
            {spot.id} — {zoneInfo.label}
          </Text>
        </View>
        <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.spotDetailBody}>
        <View style={styles.spotStatusRow}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.spotStatusText, { color: statusColor }]}>
            {statusLabel}
          </Text>
        </View>
        {spot.plate && (
          <Text style={styles.spotPlate}>Placa: {spot.plate}</Text>
        )}
        {spot.vehicleType && (
          <Text style={styles.spotDetailText}>
            Tipo: {spot.vehicleType === 'car' ? 'Auto' : spot.vehicleType === 'moto' ? 'Moto' : 'Bici'}
          </Text>
        )}
        <Text style={styles.spotDetailText}>{zoneInfo.description}</Text>
      </View>
    </View>
  );
}

// ── MapScreen ──────────────────────────────────────────────────────

export default function MapScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { permission, requestPermission, openSettings } = useLocationPermission();
  const mapRef = useRef<MapView>(null);
  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  const [region, setRegion] = useState<Region>(INITIAL_REGION);
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<Region | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  // ── Load parking spots ──

  const loadSpots = useCallback(async () => {
    try {
      const data = await getParkingSpotsService();
      setSpots(data);
    } catch (err) {
      console.error('[MapScreen] Failed to load spots:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSpots();
  }, [loadSpots]);

  // ── Get user location ──

  const handleGoToUserLocation = useCallback(async () => {
    const loc = await getCurrentLocation();
    if (loc) {
      setUserLocation(loc);
      mapRef.current?.animateToRegion(loc, 500);
    }
  }, []);

  useEffect(() => {
    if (permission === 'granted') {
      handleGoToUserLocation();
    }
  }, [permission, handleGoToUserLocation]);

  // ── Zoom controls ──

  const handleZoomIn = useCallback(() => {
    const newDelta = Math.max(region.latitudeDelta * 0.5, 0.001);
    mapRef.current?.animateToRegion(
      {
        ...region,
        latitudeDelta: newDelta,
        longitudeDelta: newDelta,
      },
      300
    );
  }, [region]);

  const handleZoomOut = useCallback(() => {
    const newDelta = Math.min(region.latitudeDelta * 2, 0.1);
    mapRef.current?.animateToRegion(
      {
        ...region,
        latitudeDelta: newDelta,
        longitudeDelta: newDelta,
      },
      300
    );
  }, [region]);

  // ── Spot press ──

  const handleSpotPress = useCallback((spot: ParkingSpot) => {
    setSelectedSpot(spot);
  }, []);

  // ── Filters ──

  const filteredSpots = activeFilter
    ? spots.filter((s) => s.status === activeFilter || s.zone === activeFilter)
    : spots;

  const handleFilterPress = useCallback((filter: string | null) => {
    setActiveFilter((prev) => (prev === filter ? null : filter));
  }, []);

  // ── Legend ──

  const legendItems = [
    { label: 'Libre', color: '#4caf50' },
    { label: 'Ocupado', color: '#e53935' },
    { label: 'Reservado', color: '#ff9800' },
  ];

  // ── Render: Permission Denied ──

  if (permission === 'denied' || permission === 'blocked') {
    return (
      <PermissionDenied
        icon="📍"
        title="Ubicación"
        message="Necesitamos acceso a tu ubicación para mostrarte el mapa del parqueadero y los lugares disponibles cerca de vos."
        buttonLabel="Abrir Configuración"
        onOpenSettings={openSettings}
        onRetry={requestPermission}
      />
    );
  }

  // ── Render: Loading ──

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a73e8" />
        <Text style={styles.loadingText}>Cargando mapa...</Text>
      </View>
    );
  }

  // ── Render ──

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={INITIAL_REGION}
        onRegionChangeComplete={setRegion}
        showsUserLocation={permission === 'granted'}
        showsMyLocationButton={false}
        showsCompass
        rotateEnabled
        zoomEnabled
        scrollEnabled
      >
        {/* Zone Polygons */}
        <ZonePolygon zone="A" />
        <ZonePolygon zone="B" />
        <ZonePolygon zone="C" />

        {/* Spot Markers */}
        {filteredSpots.map((spot) => (
          <MapMarker key={spot.id} spot={spot} onPress={handleSpotPress} />
        ))}
      </MapView>

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.headerBack}
          onPress={() => navigation?.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.headerBackIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mapa del Parqueadero</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Legend */}
      <View style={styles.legendContainer}>
        {legendItems.map((item) => (
          <View key={item.label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
            <Text style={styles.legendLabel}>{item.label}</Text>
          </View>
        ))}
      </View>

      {/* Filter chips */}
      <View style={styles.filterRow}>
        {[
          { key: null, label: 'Todas' },
          { key: 'libre', label: 'Libres' },
          { key: 'A', label: 'Zona A' },
          { key: 'B', label: 'Zona B' },
          { key: 'C', label: 'Zona C' },
        ].map((filter) => (
          <TouchableOpacity
            key={filter.key ?? 'all'}
            style={[
              styles.filterChip,
              activeFilter === filter.key && styles.filterChipActive,
            ]}
            onPress={() => handleFilterPress(filter.key)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterChipText,
                activeFilter === filter.key && styles.filterChipTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* FABs */}
      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={styles.fab}
          onPress={handleZoomIn}
          activeOpacity={0.7}
        >
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.fab}
          onPress={handleZoomOut}
          activeOpacity={0.7}
        >
          <Text style={styles.fabIcon}>−</Text>
        </TouchableOpacity>
        {permission === 'granted' && (
          <TouchableOpacity
            style={[styles.fab, styles.fabLocation]}
            onPress={handleGoToUserLocation}
            activeOpacity={0.7}
          >
            <Text style={styles.fabIcon}>📍</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Bottom Sheet: Spot Detail */}
      {selectedSpot && (
        <View style={[styles.bottomSheet, { paddingBottom: insets.bottom + 16 }]}>
          <SpotDetailPanel
            spot={selectedSpot}
            onClose={() => setSelectedSpot(null)}
          />
        </View>
      )}

      {/* Stats bar */}
      <View style={[styles.statsBar, { paddingBottom: insets.bottom + 8 }]}>
        <Text style={styles.statsText}>
          {spots.filter((s) => s.status === 'libre').length} disponibles ·{' '}
          {spots.length} totales
        </Text>
      </View>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
  },
  loadingText: {
    fontSize: 16,
    color: '#888',
    marginTop: 16,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  headerBack: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f2f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBackIcon: {
    fontSize: 26,
    color: '#1a1a2e',
    fontWeight: '300',
    marginTop: -2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  headerRight: {
    width: 36,
  },
  legendContainer: {
    position: 'absolute',
    top: 100,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 12,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  legendLabel: {
    fontSize: 12,
    color: '#555',
    fontWeight: '500',
  },
  filterRow: {
    position: 'absolute',
    top: 148,
    left: 12,
    right: 12,
    flexDirection: 'row',
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  filterChipActive: {
    backgroundColor: '#1a73e8',
    borderColor: '#1a73e8',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 80,
    right: 12,
    gap: 8,
  },
  fab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  fabLocation: {
    backgroundColor: '#1a73e8',
  },
  fabIcon: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
    minHeight: BOTTOM_SHEET_MIN_HEIGHT,
  },
  spotDetail: {
    padding: 20,
  },
  spotDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  spotDetailTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  zoneIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  spotDetailTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  closeIcon: {
    fontSize: 18,
    color: '#999',
    fontWeight: '700',
    padding: 4,
  },
  spotDetailBody: {},
  spotStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  spotStatusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  spotPlate: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  spotDetailText: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  statsBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.04)',
    paddingTop: 8,
    alignItems: 'center',
  },
  statsText: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
  },
});
