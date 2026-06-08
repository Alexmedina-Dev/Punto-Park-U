import * as Location from 'expo-location';
import { Platform } from 'react-native';

// ── Types ──────────────────────────────────────────────────────────

export interface UserLocation {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

// ── Constants ──────────────────────────────────────────────────────

/**
 * Default region centered on the parking lot (Punto Park U).
 * Approximate coordinates for a generic location — override in production.
 */
export const DEFAULT_REGION: Region = {
  latitude: 4.7110,
  longitude: -74.0721,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

// ── Get current user location ──────────────────────────────────────

export async function getCurrentLocation(): Promise<UserLocation | null> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') {
      return null;
    }

    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  } catch (err) {
    console.error('[locationService] Failed to get current location:', err);
    return null;
  }
}

// ── Watch user position ────────────────────────────────────────────

export function watchUserPosition(
  onLocation: (location: UserLocation) => void,
  onError?: (error: Error) => void
): Location.LocationSubscription | null {
  try {
    const subscription = Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 10,
      },
      (loc) => {
        onLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }
    );

    // Since watchPositionAsync returns a Promise, we handle it differently
    return null; // The caller should use a ref to manage unsubscription
  } catch (err) {
    console.error('[locationService] Failed to watch position:', err);
    onError?.(err as Error);
    return null;
  }
}

// ── Geocode parking address ────────────────────────────────────────

export async function getParkingAddress(
  latitude: number,
  longitude: number
): Promise<string | null> {
  try {
    const addresses = await Location.reverseGeocodeAsync({
      latitude,
      longitude,
    });

    if (addresses.length > 0) {
      const addr = addresses[0];
      const parts = [
        addr.street,
        addr.name,
        addr.district,
        addr.city,
        addr.region,
      ].filter(Boolean);
      return parts.join(', ');
    }
    return null;
  } catch (err) {
    console.error('[locationService] Reverse geocode failed:', err);
    return null;
  }
}

// ── Calculate distance between two points (Haversine) ──────────────

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
