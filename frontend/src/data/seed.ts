import { Zone, Spot, SavedPlace, SpotStatus } from '@/types';

// Helper to create a rectangular polygon around a center point
function makePolygon(
  centerLat: number,
  centerLng: number,
  widthDeg: number = 0.0012,
  heightDeg: number = 0.0006
): GeoJSON.Polygon {
  const halfW = widthDeg / 2;
  const halfH = heightDeg / 2;
  return {
    type: 'Polygon',
    coordinates: [
      [
        [centerLng - halfW, centerLat - halfH],
        [centerLng + halfW, centerLat - halfH],
        [centerLng + halfW, centerLat + halfH],
        [centerLng - halfW, centerLat + halfH],
        [centerLng - halfW, centerLat - halfH], // close ring
      ],
    ],
  };
}

// --- ZONES ---
export const zones: Zone[] = [
  {
    id: 312,
    name: 'Street 2A — DIC',
    geojson_polygon: makePolygon(25.092, 55.158, 0.0018, 0.0005),
    pricing_type: 'B',
    price_per_hour: 4,
    total_spots: 18,
    free_spots: 6,
    occupied_spots: 10,
    reserved_spots: 2,
  },
  {
    id: 314,
    name: 'Street 2C — DIC',
    geojson_polygon: makePolygon(25.0935, 55.161, 0.002, 0.0005),
    pricing_type: 'A',
    price_per_hour: 6,
    total_spots: 24,
    free_spots: 9,
    occupied_spots: 13,
    reserved_spots: 2,
  },
  {
    id: 315,
    name: 'Street 3A — near DIC Metro',
    geojson_polygon: makePolygon(25.0905, 55.156, 0.0016, 0.0005),
    pricing_type: 'C',
    price_per_hour: 3,
    total_spots: 16,
    free_spots: 5,
    occupied_spots: 9,
    reserved_spots: 2,
  },
];

// --- SPOT GENERATION ---
function generateSpots(zone: Zone, startLat: number, startLng: number, direction: 'east' | 'north'): Spot[] {
  const spots: Spot[] = [];
  const statuses: SpotStatus[] = [];

  // Distribute: ~35% free, ~55% occupied, ~10% reserved
  const freeCount = zone.free_spots;
  const occupiedCount = zone.occupied_spots;
  const reservedCount = zone.reserved_spots;

  for (let i = 0; i < freeCount; i++) statuses.push('free');
  for (let i = 0; i < occupiedCount; i++) statuses.push('occupied');
  for (let i = 0; i < reservedCount; i++) statuses.push('reserved');

  // Shuffle statuses
  for (let i = statuses.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [statuses[i], statuses[j]] = [statuses[j], statuses[i]];
  }

  for (let i = 0; i < zone.total_spots; i++) {
    const status = statuses[i] || 'free';
    const lat = direction === 'east' ? startLat + (Math.random() - 0.5) * 0.0002 : startLat + i * 0.00012;
    const lng = direction === 'east' ? startLng + i * 0.00012 : startLng + (Math.random() - 0.5) * 0.0002;

    const now = new Date();
    const lastChanged = new Date(now.getTime() - Math.random() * 3600000);

    spots.push({
      id: `spot-${zone.id}-${String(i + 1).padStart(3, '0')}`,
      zone_id: zone.id,
      lat: Number(lat.toFixed(6)),
      lng: Number(lng.toFixed(6)),
      status,
      last_changed_at: lastChanged.toISOString(),
      sensor_id: `sns-${zone.id}-${String(i + 1).padStart(3, '0')}`,
      ...(status === 'occupied'
        ? { occupied_since: new Date(now.getTime() - Math.random() * 7200000).toISOString() }
        : {}),
    });
  }

  return spots;
}

export const spots: Spot[] = [
  ...generateSpots(zones[0], 25.09185, 55.15720, 'east'),
  ...generateSpots(zones[1], 25.09330, 55.16010, 'east'),
  ...generateSpots(zones[2], 25.09000, 55.15530, 'north'),
];

// --- SAVED PLACES ---
export const savedPlaces: SavedPlace[] = [
  {
    id: 'place-home',
    label: 'home',
    lat: 25.08,
    lng: 55.14,
    address: 'Dubai Marina, Tower 12, Apt 3401',
  },
  {
    id: 'place-work',
    label: 'work',
    lat: 25.092,
    lng: 55.16,
    address: 'DIC Building 3, Ground Floor',
  },
  {
    id: 'place-gym',
    label: 'gym',
    lat: 25.095,
    lng: 55.155,
    address: 'Fitness First, Dubai Media City',
  },
];
