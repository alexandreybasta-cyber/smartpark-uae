import { Spot, SpotStatus } from '@/types';

// Time-of-day occupancy targets (Dubai local time UTC+4)
const OCCUPANCY_PROFILES = {
  night: { hours: [0, 6] as [number, number], range: [0.08, 0.15] as [number, number] },
  morningRush: { hours: [7, 10] as [number, number], range: [0.45, 0.85] as [number, number] },
  midMorning: { hours: [10, 12] as [number, number], range: [0.70, 0.80] as [number, number] },
  lunch: { hours: [12, 13] as [number, number], range: [0.60, 0.70] as [number, number] },
  afternoon: { hours: [13, 17] as [number, number], range: [0.72, 0.82] as [number, number] },
  eveningRush: { hours: [17, 20] as [number, number], range: [0.85, 0.92] as [number, number] },
  evening: { hours: [20, 24] as [number, number], range: [0.30, 0.50] as [number, number] },
};

export function getTargetOccupancy(hour: number): number {
  for (const profile of Object.values(OCCUPANCY_PROFILES)) {
    const [start, end] = profile.hours;
    if (hour >= start && hour < end) {
      const [min, max] = profile.range;
      return min + Math.random() * (max - min);
    }
  }
  // Fallback (hour 6-7 gap)
  return 0.3;
}

export function simulateTick(spots: Spot[], targetOccupancy: number): Spot[] {
  const totalSpots = spots.length;
  const currentOccupied = spots.filter(s => s.status === 'occupied' || s.status === 'reserved').length;
  const currentOccupancy = currentOccupied / totalSpots;

  const diff = targetOccupancy - currentOccupancy;
  const spotsToFlip = Math.max(1, Math.min(3, Math.ceil(Math.abs(diff) * totalSpots * 0.1)));

  const newSpots = [...spots];

  for (let i = 0; i < spotsToFlip; i++) {
    const idx = Math.floor(Math.random() * totalSpots);
    const spot = newSpots[idx];

    // Skip sensor_offline spots
    if (spot.status === 'sensor_offline') continue;

    let newStatus: SpotStatus;

    if (diff > 0) {
      // Need more occupancy — flip free spots to occupied
      if (spot.status === 'free') {
        newStatus = Math.random() < 0.85 ? 'occupied' : 'reserved';
      } else {
        continue;
      }
    } else {
      // Need less occupancy — flip occupied/reserved to free
      if (spot.status === 'occupied' || spot.status === 'reserved') {
        newStatus = 'free';
      } else {
        continue;
      }
    }

    newSpots[idx] = {
      ...spot,
      status: newStatus,
      last_changed_at: new Date().toISOString(),
      ...(newStatus === 'occupied'
        ? { occupied_since: new Date().toISOString() }
        : { occupied_since: undefined }),
    };
  }

  return newSpots;
}
