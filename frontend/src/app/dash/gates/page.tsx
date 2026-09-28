'use client';

import { useEffect, useState } from 'react';
import { fmtTime, pfetch } from '@/lib/platformApi';
import { Badge, Card, PageHeader, Stat, Table } from '@/components/dash/ui';

interface EventRow {
  id: number; zone_id: number | null; bay_id: string | null;
  payload: Record<string, unknown>; ts: string;
}
interface Overview { modules: string[]; widgets: Record<string, Record<string, unknown>> }

export default function GatesPage() {
  const [rows, setRows] = useState<EventRow[]>([]);
  const [openVisits, setOpenVisits] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [ev, ov] = await Promise.all([
          pfetch<EventRow[]>('/api/p/events?type=vehicle_passage&limit=100'),
          pfetch<Overview>('/api/p/overview'),
        ]);
        setRows(ev);
        setOpenVisits(Number(ov.widgets.anpr?.open_visits ?? 0));
      } catch {
        /* auth redirect handles failures */
      }
    })();
  }, []);

  return (
    <div>
      <PageHeader title="Gates & ANPR"
                  sub="Plate passage events at entry and exit: verified duration per vehicle" />
      <div className="grid grid-cols-2 gap-4 mb-4">
        <Card><Stat label="Passages shown" value={rows.length} hint="latest 100" /></Card>
        <Card><Stat label="Open visits now" value={openVisits ?? '-'}
                    hint="in, not yet out" /></Card>
      </div>
      <Card title="Passage log">
        <Table head={['Time', 'Plate', 'Gate', 'Direction', 'Bay']}
               rows={rows.map((e) => [
                 fmtTime(e.ts),
                 <span key="p" className="font-mono">{String(e.payload.plate ?? '-')}</span>,
                 String(e.payload.gate ?? '-'),
                 <Badge key="d" tone={e.payload.direction === 'in' ? 'green' : 'zinc'}>
                   {String(e.payload.direction)}
                 </Badge>,
                 e.bay_id ?? '-',
               ])} />
      </Card>
    </div>
  );
}
