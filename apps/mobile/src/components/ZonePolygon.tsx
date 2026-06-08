import React from 'react';
import { Polygon } from 'react-native-maps';

// ── Zone Config ────────────────────────────────────────────────────

interface ZoneConfig {
  id: string;
  label: string;
  coordinates: { latitude: number; longitude: number }[];
  color: string;
}

const ZONE_COLORS: Record<string, string> = {
  A: '#1a73e8',
  B: '#7b1fa2',
  C: '#00897b',
};

/**
 * Generate zone polygons relative to the parking base coordinates.
 * In production, these would come from the backend or a GeoJSON config.
 */
function getZoneCoordinates(
  baseLat: number,
  baseLng: number,
  zone: string
): { latitude: number; longitude: number }[] {
  const offset = 0.004;
  switch (zone) {
    case 'A':
      return [
        { latitude: baseLat - offset - 0.002, longitude: baseLng - offset },
        { latitude: baseLat - offset - 0.002, longitude: baseLng },
        { latitude: baseLat - 0.002, longitude: baseLng },
        { latitude: baseLat - 0.002, longitude: baseLng - offset },
      ];
    case 'B':
      return [
        { latitude: baseLat - 0.001, longitude: baseLng - offset },
        { latitude: baseLat - 0.001, longitude: baseLng },
        { latitude: baseLat + 0.001, longitude: baseLng },
        { latitude: baseLat + 0.001, longitude: baseLng - offset },
      ];
    case 'C':
      return [
        { latitude: baseLat + 0.002, longitude: baseLng - offset },
        { latitude: baseLat + 0.002, longitude: baseLng },
        { latitude: baseLat + offset + 0.002, longitude: baseLng },
        { latitude: baseLat + offset + 0.002, longitude: baseLng - offset },
      ];
    default:
      return [];
  }
}

// ── Types ──────────────────────────────────────────────────────────

export interface ZonePolygonProps {
  zone: 'A' | 'B' | 'C';
  baseLatitude?: number;
  baseLongitude?: number;
  opacity?: number;
}

// ── Component ──────────────────────────────────────────────────────

export default function ZonePolygon({
  zone,
  baseLatitude = 4.7110,
  baseLongitude = -74.0721,
  opacity = 0.15,
}: ZonePolygonProps) {
  const coordinates = getZoneCoordinates(baseLatitude, baseLongitude, zone);
  const color = ZONE_COLORS[zone] || '#888';

  if (coordinates.length === 0) return null;

  return (
    <Polygon
      coordinates={coordinates}
      fillColor={`${color}${Math.round(opacity * 255)
        .toString(16)
        .padStart(2, '0')}`}
      strokeColor={color}
      strokeWidth={1.5}
    />
  );
}
