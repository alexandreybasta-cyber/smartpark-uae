'use client';

import { GeoJSON, Tooltip } from 'react-leaflet';
import { Zone } from '@/types';

interface ZonePolygonProps {
  zone: Zone;
  freeRatio: number; // current free/total ratio
}

export default function ZonePolygon({ zone, freeRatio }: ZonePolygonProps) {
  const isBusy = freeRatio < 0.3;
  const color = isBusy ? '#ef4444' : '#00e5a0';

  return (
    <GeoJSON
      key={`zone-${zone.id}-${isBusy ? 'busy' : 'free'}`}
      data={zone.geojson_polygon}
      style={{
        color: color,
        weight: 1.5,
        opacity: 0.6,
        fillColor: color,
        fillOpacity: 0.1,
      }}
    >
      <Tooltip sticky>
        <div className="text-sm">
          <div className="font-semibold">{zone.name}</div>
          <div className="text-xs mt-1">
            {Math.round(freeRatio * zone.total_spots)} / {zone.total_spots} spots free
          </div>
        </div>
      </Tooltip>
    </GeoJSON>
  );
}
