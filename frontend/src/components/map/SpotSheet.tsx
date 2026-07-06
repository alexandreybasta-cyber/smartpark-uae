'use client';

import { Spot } from '@/types';
import { zones, savedPlaces } from '@/data/seed';

interface SpotSheetProps {
  spot: Spot | null;
  onClose: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  free: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  occupied: 'bg-red-500/20 text-red-400 border-red-500/30',
  reserved: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  sensor_offline: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function SpotSheet({ spot, onClose }: SpotSheetProps) {
  if (!spot) return null;

  const zone = zones.find(z => z.id === spot.zone_id);
  const workPlace = savedPlaces.find(p => p.label === 'work');
  const userLat = workPlace?.lat ?? 25.092;
  const userLng = workPlace?.lng ?? 55.16;

  const distance = getDistance(userLat, userLng, spot.lat, spot.lng);
  const walkingMinutes = Math.ceil(distance / 80);

  const navigateUrl = `https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lng}`;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-[1000]"
        onClick={onClose}
      />
      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-[1001] bg-sp-bg-2 border-t border-white/10 rounded-t-2xl p-5 animate-fade-in max-w-lg mx-auto">
        {/* Handle */}
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-sp-text-3 hover:text-sp-text-1 transition-colors text-xl"
        >
          ✕
        </button>

        {/* Spot ID and zone */}
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-sp-text-1">{spot.id}</h3>
          <p className="text-sm text-sp-text-2">{zone?.name ?? `Zone ${spot.zone_id}`}</p>
        </div>

        {/* Status badge */}
        <div className="mb-4">
          <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full border ${STATUS_COLORS[spot.status]}`}>
            {spot.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>

        {/* Distance & walking time */}
        <div className="flex gap-6 mb-5 text-sm text-sp-text-2">
          <div>
            <span className="text-sp-text-3">Distance:</span>{' '}
            <span className="text-sp-text-1 font-medium">{distance < 1000 ? `${Math.round(distance)}m` : `${(distance / 1000).toFixed(1)}km`}</span>
          </div>
          <div>
            <span className="text-sp-text-3">Walk:</span>{' '}
            <span className="text-sp-text-1 font-medium">{walkingMinutes} min</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <a
            href={navigateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium text-center transition-colors"
          >
            Navigate
          </a>
          <a
            href="#"
            className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium text-center transition-colors"
          >
            Pay via Parkin
          </a>
        </div>
      </div>
    </>
  );
}
