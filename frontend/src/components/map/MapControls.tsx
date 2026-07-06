'use client';

import { Spot } from '@/types';
import { zones } from '@/data/seed';

interface MapControlsProps {
  isRunning: boolean;
  speed: number;
  spots: Spot[];
  onToggle: () => void;
  onSpeedChange: (speed: number) => void;
}

export default function MapControls({ isRunning, speed, spots, onToggle, onSpeedChange }: MapControlsProps) {
  // Compute per-zone free counts
  const zoneStats = zones.map(zone => {
    const zoneSpots = spots.filter(s => s.zone_id === zone.id);
    const freeCount = zoneSpots.filter(s => s.status === 'free').length;
    return { name: zone.name, free: freeCount, total: zoneSpots.length };
  });

  return (
    <div className="absolute top-4 right-4 z-[900] flex flex-col gap-3">
      {/* Simulation controls */}
      <div className="bg-sp-bg-2/90 backdrop-blur-md border border-white/10 rounded-xl p-3 min-w-[180px]">
        {/* LIVE indicator */}
        {isRunning && (
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse-glow" />
            <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">Live</span>
          </div>
        )}

        {/* Toggle */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-sp-text-2">Simulate</span>
          <button
            onClick={onToggle}
            className={`relative w-10 h-5 rounded-full transition-colors ${
              isRunning ? 'bg-sp-cyan' : 'bg-sp-bg-3'
            }`}
          >
            <div
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                isRunning ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {/* Speed selector */}
        <div className="flex gap-1">
          {[1, 3, 5].map(s => (
            <button
              key={s}
              onClick={() => onSpeedChange(s)}
              className={`flex-1 py-1 text-xs rounded-md transition-colors ${
                speed === s
                  ? 'bg-sp-cyan/20 text-sp-cyan border border-sp-cyan/30'
                  : 'bg-sp-bg-3 text-sp-text-3 hover:text-sp-text-2'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* Zone stats */}
      <div className="bg-sp-bg-2/90 backdrop-blur-md border border-white/10 rounded-xl p-3">
        <div className="text-xs font-medium text-sp-text-2 mb-2">Zone Availability</div>
        {zoneStats.map(stat => (
          <div key={stat.name} className="flex items-center justify-between text-xs mb-1 last:mb-0">
            <span className="text-sp-text-3 truncate max-w-[100px]">{stat.name.split('—')[0].trim()}</span>
            <span className={`font-mono font-medium ${stat.free > 3 ? 'text-sp-cyan' : 'text-sp-red'}`}>
              {stat.free}/{stat.total}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
