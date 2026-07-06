'use client';

import { CircleMarker } from 'react-leaflet';

interface CurrentLocationProps {
  lat: number;
  lng: number;
}

export default function CurrentLocation({ lat, lng }: CurrentLocationProps) {
  return (
    <>
      {/* Pulse ring */}
      <CircleMarker
        center={[lat, lng]}
        radius={18}
        pathOptions={{
          color: '#3b82f6',
          fillColor: '#3b82f6',
          fillOpacity: 0.15,
          weight: 1,
          opacity: 0.4,
          className: 'animate-pulse-ring',
        }}
      />
      {/* Core dot */}
      <CircleMarker
        center={[lat, lng]}
        radius={7}
        pathOptions={{
          color: '#ffffff',
          fillColor: '#3b82f6',
          fillOpacity: 1,
          weight: 2.5,
          opacity: 1,
        }}
      />
    </>
  );
}
