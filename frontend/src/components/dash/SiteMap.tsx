'use client';

import { Fragment, useEffect, useState } from 'react';
import type { Map as LeafletMap } from 'leaflet';
import { CircleMarker, MapContainer, Polygon, Popup, TileLayer } from 'react-leaflet';

export interface MapBay {
  id: string;
  lat: number;
  lng: number;
  status: string;
  area_id: number | null;
}
export interface MapSite {
  id: number;
  name: string;
  polygon: { coordinates: number[][][] } | null;
  bays: MapBay[];
}

const COLORS: Record<string, string> = {
  free: '#16A34A',
  occupied: '#DC2626',
  reserved: '#F59E0B',
  sensor_offline: '#9CA3AF',
};

export default function SiteMap({ sites }: { sites: MapSite[] }) {
  const [map, setMap] = useState<LeafletMap | null>(null);

  useEffect(() => {
    if (!map) return;
    const t = setTimeout(() => map.invalidateSize(), 150);
    return () => clearTimeout(t);
  }, [map]);

  return (
    <MapContainer ref={setMap} center={[25.0928, 55.1600]} zoom={15}
                  style={{ height: '62vh', width: '100%', borderRadius: 8 }}
                  scrollWheelZoom>
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {sites.map((site) => (
        <Fragment key={site.id}>
          {site.polygon ? (
            <Polygon positions={site.polygon.coordinates[0].map(([lng, lat]) => [lat, lng])}
                     pathOptions={{ color: '#EA580C', weight: 1.5, fillOpacity: 0.05 }} />
          ) : null}
          {site.bays.map((bay) => (
            <CircleMarker key={bay.id} center={[bay.lat, bay.lng]} radius={6}
                          pathOptions={{
                            color: COLORS[bay.status] || '#9CA3AF',
                            fillColor: COLORS[bay.status] || '#9CA3AF',
                            fillOpacity: 0.85, weight: 1,
                          }}>
              <Popup>
                <div className="text-xs">
                  <b>{bay.id}</b><br />{site.name}<br />status: {bay.status}
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </Fragment>
      ))}
    </MapContainer>
  );
}
