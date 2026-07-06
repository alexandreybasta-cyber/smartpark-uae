'use client';

import { useMemo } from 'react';
import { zones } from '@/data/seed';
import { Zone } from '@/types';

function getOccupancyPercent(zone: Zone): number {
  return Math.round(((zone.total_spots - zone.free_spots) / zone.total_spots) * 100);
}

function getAvailabilityPercent(zone: Zone): number {
  return Math.round((zone.free_spots / zone.total_spots) * 100);
}

// Simulate trend based on time of day
function getTrend(zoneId: number): 'up' | 'down' | 'stable' {
  const hour = new Date().getHours();
  // Morning rush: getting busier
  if (hour >= 7 && hour < 10) return 'up';
  // Lunch dip: freeing up
  if (hour >= 12 && hour < 13) return 'down';
  // Evening rush: getting busier
  if (hour >= 17 && hour < 20) return 'up';
  // Evening: freeing up
  if (hour >= 20) return 'down';
  // Stable otherwise
  return 'stable';
}

interface ZoneComparisonProps {
  className?: string;
}

export default function ZoneComparison({ className = '' }: ZoneComparisonProps) {
  const zoneData = useMemo(() => {
    return zones.map(zone => {
      const occupancy = getOccupancyPercent(zone);
      const availability = getAvailabilityPercent(zone);
      const trend = getTrend(zone.id);
      return { zone, occupancy, availability, trend };
    });
  }, []);

  // Find best zone (highest availability)
  const bestZoneId = useMemo(() => {
    const sorted = [...zoneData].sort((a, b) => b.availability - a.availability);
    return sorted[0]?.zone.id;
  }, [zoneData]);

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-3 gap-4 ${className}`}>
      {zoneData.map(({ zone, occupancy, availability, trend }) => {
        const isBest = zone.id === bestZoneId;
        return (
          <div
            key={zone.id}
            className={`bg-sp-bg-2 rounded-2xl p-5 border transition-all ${
              isBest
                ? 'border-sp-cyan/40 shadow-[0_0_20px_rgba(0,229,160,0.08)]'
                : 'border-sp-bg-3'
            }`}
          >
            {/* Zone name */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-sp-text-2 truncate pr-2">
                {zone.name}
              </h3>
              {isBest && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-sp-cyan/10 text-sp-cyan font-medium whitespace-nowrap">
                  BEST
                </span>
              )}
            </div>

            {/* Large availability percentage */}
            <div className="flex items-baseline gap-1 mb-3">
              <span className="text-3xl font-bold text-sp-text-1">
                {availability}%
              </span>
              <span className="text-sm text-sp-text-3">free</span>
            </div>

            {/* Progress bar */}
            <div className="h-2 rounded-full bg-sp-bg-3 overflow-hidden mb-3">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${occupancy}%`,
                  backgroundColor: occupancy > 80 ? '#ef4444' : occupancy > 60 ? '#f59e0b' : '#00e5a0',
                }}
              />
            </div>

            {/* Trend + spots free */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-sp-text-2">
                {zone.free_spots}/{zone.total_spots} spots free
              </span>
              <span className={`text-lg ${
                trend === 'up' ? 'text-sp-red' : trend === 'down' ? 'text-sp-cyan' : 'text-sp-amber'
              }`}>
                {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
