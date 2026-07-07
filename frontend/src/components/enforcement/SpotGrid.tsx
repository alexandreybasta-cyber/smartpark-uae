'use client';

export type SpotStatus = 'empty' | 'paid' | 'grace' | 'violation' | 'offline';

export interface SpotData {
  id: string;
  zone: string;
  index: number;
  status: SpotStatus;
  occupiedSince?: number;
}

interface SpotGridProps {
  spots: SpotData[];
  onSpotClick: (spot: SpotData) => void;
}

const STATUS_STYLES: Record<SpotStatus, string> = {
  empty: 'bg-gray-50 border-gray-200 border-dashed',
  paid: 'bg-sp-cyan/80 border-sp-cyan',
  grace: 'bg-amber-300 border-amber-400 animate-pulse',
  violation: 'bg-sp-red border-red-600 animate-[pulse_1s_ease-in-out_infinite]',
  offline: 'bg-gray-300 border-gray-400 line-through opacity-50',
};

const STATUS_LABELS: Record<SpotStatus, string> = {
  empty: 'Empty',
  paid: 'Paid',
  grace: 'Grace Period',
  violation: 'VIOLATION',
  offline: 'Offline',
};

const ZONES = ['312', '314', '315'];
const ZONE_SIZES = { '312': 18, '314': 24, '315': 16 };

export default function SpotGrid({ spots, onSpotClick }: SpotGridProps) {
  return (
    <div className="bg-sp-bg-2 rounded-xl shadow-sm p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-sp-text-1">Spot Monitoring Grid</h2>
        <div className="flex items-center gap-3 text-[10px]">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-sp-cyan/80 border border-sp-cyan" /> Paid</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-amber-300 border border-amber-400" /> Grace</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-sp-red border border-red-600" /> Violation</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-gray-50 border border-gray-200 border-dashed" /> Empty</span>
        </div>
      </div>
      {ZONES.map((zone) => {
        const zoneSpots = spots.filter((s) => s.zone === zone);
        return (
          <div key={zone} className="mb-4">
            <p className="text-[11px] font-medium text-sp-text-3 mb-2">Zone {zone} ({ZONE_SIZES[zone as keyof typeof ZONE_SIZES]} spots)</p>
            <div className="grid grid-cols-9 sm:grid-cols-12 gap-1.5">
              {zoneSpots.map((spot) => (
                <button
                  key={spot.id}
                  onClick={() => spot.status === 'violation' || spot.status === 'grace' ? onSpotClick(spot) : undefined}
                  className={`w-full aspect-square rounded-md border text-[8px] font-mono flex items-center justify-center transition-all cursor-pointer hover:scale-110 ${STATUS_STYLES[spot.status]}`}
                  title={`${spot.id} — ${STATUS_LABELS[spot.status]}`}
                >
                  {spot.status === 'violation' && '!'}
                  {spot.status === 'offline' && '×'}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
