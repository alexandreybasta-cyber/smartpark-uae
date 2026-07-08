'use client';

import { MapCardData } from '@/lib/agentResponses';

interface MapCardProps {
  data: MapCardData;
}

export default function MapCard({ data }: MapCardProps) {
  const occupancyPercent = Math.round(
    ((data.totalSpots - data.freeSpots) / data.totalSpots) * 100
  );

  return (
    <div className="bg-sp-bg-2 rounded-xl border border-sp-bg-3 p-4 w-full max-w-sm">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sp-text-1 font-semibold text-sm">
          {data.zoneName}
        </h4>
        <span className="text-sp-cyan text-xs font-medium">
          {data.freeSpots}/{data.totalSpots} free
        </span>
      </div>

      {/* Occupancy bar */}
      <div className="w-full h-2 bg-sp-bg-3 rounded-full overflow-hidden mb-3">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${occupancyPercent}%`,
            background: occupancyPercent > 75 ? 'var(--color-sp-red)' : 'var(--color-sp-cyan)',
          }}
        />
      </div>

      <div className="flex items-center gap-3 text-sp-text-2 text-xs mb-3">
        <span>{data.distanceM}m away</span>
        <span>·</span>
        <span>{data.walkingMin} min walk</span>
      </div>

      <div className="flex gap-2">
        <button className="flex-1 px-3 py-2 rounded-lg bg-sp-cyan/10 text-sp-cyan text-xs font-medium hover:bg-sp-cyan/20 transition-colors">
          Navigate
        </button>
        <button className="flex-1 px-3 py-2 rounded-lg bg-sp-amber/10 text-sp-amber text-xs font-medium hover:bg-sp-amber/20 transition-colors">
          Pay via app
        </button>
      </div>
    </div>
  );
}
