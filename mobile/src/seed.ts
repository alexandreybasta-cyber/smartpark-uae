// Offline fallback data — mirrors backend/seed.py (same zones, coordinates,
// spot-grid layout and id format) so online and offline demos look identical.
import { SavedPlace, Spot, SpotStatus, Zone } from './types';

interface ZoneDef {
  id: number;
  name: string;
  price_per_hour: number;
  count: number;
  baseLat: number;
  baseLng: number;
  polygon: number[][]; // [lng, lat] ring, GeoJSON order
}

const ZONE_DEFS: ZoneDef[] = [
  {
    id: 1,
    name: 'DIC Parking Zone A',
    price_per_hour: 4.0,
    count: 18,
    baseLat: 25.0935,
    baseLng: 55.159,
    polygon: [
      [55.158, 25.093],
      [55.16, 25.093],
      [55.16, 25.0945],
      [55.158, 25.0945],
      [55.158, 25.093],
    ],
  },
  {
    id: 2,
    name: 'DIC Parking Zone B',
    price_per_hour: 5.0,
    count: 24,
    baseLat: 25.093,
    baseLng: 55.1617,
    polygon: [
      [55.1605, 25.092],
      [55.163, 25.092],
      [55.163, 25.094],
      [55.1605, 25.094],
      [55.1605, 25.092],
    ],
  },
  {
    id: 3,
    name: 'DIC Parking Zone C',
    price_per_hour: 3.5,
    count: 16,
    baseLat: 25.0917,
    baseLng: 55.1582,
    polygon: [
      [55.157, 25.091],
      [55.1595, 25.091],
      [55.1595, 25.0925],
      [55.157, 25.0925],
      [55.157, 25.091],
    ],
  },
];

function randomStatus(): SpotStatus {
  const r = Math.random();
  if (r < 0.35) return 'free';
  if (r < 0.9) return 'occupied';
  return 'reserved';
}

export function buildSeedData(): { zones: Zone[]; spots: Spot[] } {
  const zones: Zone[] = [];
  const spots: Spot[] = [];
  const now = new Date().toISOString();
  const cols = 6;

  ZONE_DEFS.forEach((def, zoneIdx) => {
    let free = 0;
    let occupied = 0;
    let reserved = 0;

    for (let i = 0; i < def.count; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const lat = def.baseLat + row * 0.0002 - (0.0002 * Math.floor(def.count / cols)) / 2;
      const lng = def.baseLng + col * 0.0003 - (0.0003 * cols) / 2;
      const status = randomStatus();
      if (status === 'free') free++;
      else if (status === 'occupied') occupied++;
      else reserved++;

      const suffix = `${String(zoneIdx + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`;
      spots.push({
        id: `${def.id}${suffix}`,
        zone_id: def.id,
        lat,
        lng,
        status,
        last_changed_at: now,
        sensor_id: `SNS-${def.id}${suffix}`,
        occupied_since: status === 'occupied' ? now : null,
      });
    }

    zones.push({
      id: def.id,
      name: def.name,
      geojson_polygon: JSON.stringify({ type: 'Polygon', coordinates: [def.polygon] }),
      pricing_type: 'hourly',
      price_per_hour: def.price_per_hour,
      total_spots: def.count,
      free_count: free,
      occupied_count: occupied,
      reserved_count: reserved,
    });
  });

  return { zones, spots };
}

export const seedPlaces: SavedPlace[] = [
  { id: 1, user_id: 'demo_user', label: 'home', custom_name: 'Dubai Marina Apartment', lat: 25.08, lng: 55.14, address: 'Marina Walk, Dubai Marina, Dubai' },
  { id: 2, user_id: 'demo_user', label: 'work', custom_name: 'DIC Building 3', lat: 25.0935, lng: 55.159, address: 'Building 3, Dubai Internet City, Dubai' },
  { id: 3, user_id: 'demo_user', label: 'gym', custom_name: 'Fitness First DMC', lat: 25.091, lng: 55.153, address: 'Dubai Media City, Dubai' },
];

// Dubai time-of-day occupancy profile — mirrors backend/simulator.py PROFILES.
export function targetOccupancy(dubaiHour: number): number {
  if (dubaiHour < 6) return 0.115;
  if (dubaiHour < 7) return 0.2;
  if (dubaiHour < 10) return 0.65;
  if (dubaiHour < 12) return 0.75;
  if (dubaiHour < 13) return 0.65;
  if (dubaiHour < 17) return 0.77;
  if (dubaiHour < 20) return 0.885;
  return 0.4;
}

export function dubaiHourNow(): number {
  return (new Date().getUTCHours() + 4) % 24;
}

// One simulator tick — probabilistic drift toward the time-of-day target,
// same logic as backend/simulator.py simulate_tick.
export function simulateTick(spots: Spot[]): Spot[] {
  const target = targetOccupancy(dubaiHourNow());
  const byZone = new Map<number, Spot[]>();
  spots.forEach((s) => {
    const list = byZone.get(s.zone_id) ?? [];
    list.push(s);
    byZone.set(s.zone_id, list);
  });

  const nowIso = new Date().toISOString();
  const updated = new Map<string, Spot>();

  byZone.forEach((zoneSpots) => {
    const occupied = zoneSpots.filter((s) => s.status === 'occupied').length;
    const diff = target - occupied / zoneSpots.length;
    const flipProb = Math.min(Math.abs(diff) * 0.3, 0.15);

    zoneSpots.forEach((spot) => {
      if (spot.status === 'reserved' || spot.status === 'sensor_offline') return;
      if (Math.random() >= flipProb) return;
      if (diff > 0 && spot.status === 'free') {
        updated.set(spot.id, { ...spot, status: 'occupied', occupied_since: nowIso, last_changed_at: nowIso });
      } else if (diff < 0 && spot.status === 'occupied') {
        updated.set(spot.id, { ...spot, status: 'free', occupied_since: null, last_changed_at: nowIso });
      }
    });
  });

  if (updated.size === 0) return spots;
  return spots.map((s) => updated.get(s.id) ?? s);
}

// Offline predictions — same time-of-day curve with noise, as backend/seed.py.
export function generatePredictions(): { timestamp: string; predicted_occupancy: number; confidence: number }[] {
  const out = [];
  const now = Date.now();
  for (let i = 0; i < 48; i++) {
    const ts = new Date(now + i * 15 * 60 * 1000);
    const dubaiHour = (ts.getUTCHours() + 4) % 24;
    const base = targetOccupancy(dubaiHour) * 100;
    const occ = Math.max(0, Math.min(100, base + (Math.random() * 10 - 5)));
    out.push({
      timestamp: ts.toISOString(),
      predicted_occupancy: Math.round(occ * 10) / 10,
      confidence: Math.round((0.75 + Math.random() * 0.2) * 1000) / 1000,
    });
  }
  return out;
}
