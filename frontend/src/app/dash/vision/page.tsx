'use client';

import { useEffect, useState } from 'react';
import { fmtTime, P_API_BASE, pfetch } from '@/lib/platformApi';
import { Badge, Card, PageHeader, Table } from '@/components/dash/ui';

interface EventRow {
  id: number; type: string; zone_id: number | null; bay_id: string | null;
  source_kind: string | null; source_id: string | null;
  payload: Record<string, unknown>; ts: string;
}

export default function VisionPage() {
  const [events, setEvents] = useState<EventRow[] | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const rows = await pfetch<EventRow[]>('/api/p/events?type=bay_state_change&limit=100');
        setEvents(rows.filter((r) => r.source_kind === 'camera').slice(0, 30));
      } catch {
        setEvents([]);
      }
    })();
  }, []);

  return (
    <div>
      <PageHeader title="Vision AI"
                  sub="Live camera feed analysis: bays, car types, free vs busy"
                  action={<a href={`${P_API_BASE}/train`} target="_blank" rel="noreferrer"
                             className="text-xs font-semibold text-orange-600 hover:text-orange-700">
                            Open /train console
                          </a>} />
      <Card title="Camera console (same-origin, edge-deployable)">
        <iframe src={`${P_API_BASE}/camera`} title="Camera console"
                className="w-full rounded-md border border-zinc-200"
                style={{ height: '58vh' }} />
      </Card>
      <Card title="Camera-driven bay state events (ledger)" className="mt-4">
        <Table head={['Time', 'Bay', 'Status', 'Confidence', 'Source']}
               rows={(events ?? []).map((e) => [
                 fmtTime(e.ts),
                 e.bay_id ?? '-',
                 <Badge key="s" tone={e.payload.status === 'free' ? 'green' : 'red'}>
                   {String(e.payload.status)}
                 </Badge>,
                 e.payload.confidence == null ? '-' : Number(e.payload.confidence).toFixed(2),
                 e.source_id ?? 'camera',
               ])} />
      </Card>
    </div>
  );
}
