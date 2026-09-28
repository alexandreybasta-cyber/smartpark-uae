'use client';

import { useEffect, useState } from 'react';
import { fmtTime, pfetch } from '@/lib/platformApi';
import { Badge, Card, PageHeader, Stat, Table } from '@/components/dash/ui';

interface FleetSummary { total: number; online: number; offline: number; low_battery: number }
interface EventRow {
  id: number; bay_id: string | null; source_kind: string | null; source_id: string | null;
  payload: Record<string, unknown>; ts: string;
}

export default function SensorsPage() {
  const [fleet, setFleet] = useState<FleetSummary | null>(null);
  const [events, setEvents] = useState<EventRow[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [f, ev] = await Promise.all([
          pfetch<FleetSummary>('/api/sensors'),
          pfetch<EventRow[]>('/api/p/events?type=bay_state_change&limit=100'),
        ]);
        setFleet(f);
        setEvents(ev.filter((r) => r.source_kind === 'sensor').slice(0, 30));
      } catch {
        setFleet(null);
      }
    })();
  }, []);

  return (
    <div>
      <PageHeader title="Sensor Device"
                  sub="Per-bay IoT presence data. Data gathering is the product; installation is an add-on." />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <Card><Stat label="Fleet total" value={fleet?.total ?? '-'} /></Card>
        <Card><Stat label="Online" value={fleet?.online ?? '-'} /></Card>
        <Card><Stat label="Offline" value={fleet?.offline ?? '-'} /></Card>
        <Card><Stat label="Low battery" value={fleet?.low_battery ?? '-'} /></Card>
      </div>
      <Card title="Sensor-driven bay state events (ledger)">
        <Table head={['Time', 'Bay', 'Status', 'Sensor']}
               rows={events.map((e) => [
                 fmtTime(e.ts),
                 e.bay_id ?? '-',
                 <Badge key="s" tone={e.payload.status === 'free' ? 'green' : 'red'}>
                   {String(e.payload.status)}
                 </Badge>,
                 e.source_id ?? '-',
               ])} />
      </Card>
    </div>
  );
}
