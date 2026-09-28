'use client';

import { useEffect, useState } from 'react';
import { fmtTime, pfetch } from '@/lib/platformApi';
import { Badge, Card, PageHeader, Table } from '@/components/dash/ui';

interface Violation {
  plate: string; bay_id: string; zone_id: number; gate: string | null;
  occupied_since: string; entered_at: string; minutes: number;
}

export default function EnforcementPage() {
  const [rows, setRows] = useState<Violation[] | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setRows(await pfetch<Violation[]>('/api/p/enforcement/violations'));
      } catch {
        setRows([]);
      }
    })();
  }, []);

  return (
    <div>
      <PageHeader title="Enforcement"
                  sub="Occupied bays with an ANPR visit but no open payment session" />
      <Card title={`Open violations (${rows?.length ?? 0}) - Qwen Max arbitration before issue`}>
        <Table head={['Plate', 'Bay', 'Site', 'Entered', 'Overstay', 'State']}
               rows={(rows ?? []).map((v) => [
                 <span key="p" className="font-mono font-semibold">{v.plate}</span>,
                 v.bay_id,
                 `Site ${v.zone_id}`,
                 fmtTime(v.entered_at),
                 <Badge key="m" tone={v.minutes > 120 ? 'red' : 'amber'}>
                   {v.minutes} min
                 </Badge>,
                 <Badge key="s" tone="orange">pending arbitration</Badge>,
               ])} />
      </Card>
    </div>
  );
}
