'use client';

import { CircleMarker, Popup } from 'react-leaflet';
import { Spot } from '@/types';

interface SpotMarkerProps {
  spot: Spot;
  onClick: (spot: Spot) => void;
}

const STATUS_STYLES: Record<string, { color: string; radius: number; fillOpacity: number }> = {
  free: { color: '#00e5a0', radius: 8, fillOpacity: 0.8 },
  occupied: { color: '#ef4444', radius: 7, fillOpacity: 0.7 },
  reserved: { color: '#f59e0b', radius: 7, fillOpacity: 0.7 },
  sensor_offline: { color: '#64748b', radius: 6, fillOpacity: 0.5 },
};

export default function SpotMarker({ spot, onClick }: SpotMarkerProps) {
  const style = STATUS_STYLES[spot.status] || STATUS_STYLES.free;

  return (
    <CircleMarker
      center={[spot.lat, spot.lng]}
      radius={style.radius}
      pathOptions={{
        color: style.color,
        fillColor: style.color,
        fillOpacity: style.fillOpacity,
        weight: 1.5,
        opacity: 0.9,
      }}
      eventHandlers={{
        click: () => onClick(spot),
      }}
    >
      <Popup>
        <div className="text-xs">
          <div className="font-semibold">{spot.id}</div>
          <div className="capitalize">{spot.status.replace('_', ' ')}</div>
        </div>
      </Popup>
    </CircleMarker>
  );
}
