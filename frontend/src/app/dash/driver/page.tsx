'use client';

import { useEffect, useState } from 'react';
import { pfetch } from '@/lib/platformApi';
import { Card, PageHeader, Stat, Table } from '@/components/dash/ui';

interface Place {
  id: number; label: string; custom_name: string | null;
  lat: number; lng: number; address: string | null;
}

export default function DriverPage() {
  const [places, setPlaces] = useState<Place[]>([]);

  useEffect(() => {
    (async () => {
      try {
        setPlaces(await pfetch<Place[]>('/api/places'));
      } catch {
        /* auth redirect handles failures */
      }
    })();
  }, []);

  return (
    <div>
      <PageHeader title="Driver App"
                  sub="What the iOS and web driver experiences are configured with" />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
        <Card><Stat label="Saved places" value={places.length} /></Card>
        <Card><Stat label="Geofence radius" value="150 m" hint="entry and exit alerts" /></Card>
        <Card><Stat label="Offline fallback" value="On" hint="on-device simulator" /></Card>
      </div>
      <Card title="Saved places driving bay recommendations">
        <Table head={['Label', 'Name', 'Address', 'Coordinates']}
               rows={places.map((p) => [
                 p.label, p.custom_name ?? '-', p.address ?? '-',
                 `${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}`,
               ])} />
      </Card>
    </div>
  );
}
