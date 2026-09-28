'use client';

import { useEffect, useState } from 'react';
import { fmtTime, pfetch } from '@/lib/platformApi';
import { Badge, Card, PageHeader, Stat, Table } from '@/components/dash/ui';

interface SessionRow {
  bay_id: string | null; plate: string | null; started_at: string | null;
  ended_at: string | null; amount: number; status: string | null;
  ts: string; zone_id: number | null;
}

export default function PaymentsPage() {
  const [rows, setRows] = useState<SessionRow[]>([]);

  useEffect(() => {
    (async () => {
      try {
        setRows(await pfetch<SessionRow[]>('/api/p/payments/sessions'));
      } catch {
        /* auth redirect handles failures */
      }
    })();
  }, []);

  const paid = rows.filter((r) => r.status === 'paid');
  const revenue = paid.reduce((sum, r) => sum + (r.amount || 0), 0);
  const open = rows.filter((r) => r.status === 'open').length;
  const unpaid = rows.filter((r) => r.status === 'unpaid').length;

  return (
    <div>
      <PageHeader title="Payments & Wallet"
                  sub="Sessions priced from verified duration, auto-charged on exit" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <Card><Stat label="Revenue (shown)" value={`AED ${revenue.toFixed(2)}`} /></Card>
        <Card><Stat label="Paid sessions" value={paid.length} /></Card>
        <Card><Stat label="Open sessions" value={open} /></Card>
        <Card><Stat label="Unpaid" value={unpaid} hint="sent to enforcement" /></Card>
      </div>
      <Card title="Payment sessions">
        <Table head={['Closed', 'Plate', 'Bay', 'Started', 'Duration', 'Amount', 'Status']}
               rows={rows.slice(0, 60).map((r) => {
                 const mins = r.started_at && r.ended_at
                   ? Math.round((new Date(r.ended_at).getTime() - new Date(r.started_at).getTime()) / 60000)
                   : null;
                 return [
                   fmtTime(r.ts),
                   <span key="p" className="font-mono">{r.plate ?? '-'}</span>,
                   r.bay_id ?? '-',
                   fmtTime(r.started_at),
                   mins == null ? 'open' : `${mins} min`,
                   `AED ${(r.amount || 0).toFixed(2)}`,
                   <Badge key="s" tone={r.status === 'paid' ? 'green'
                     : r.status === 'open' ? 'amber' : 'red'}>{r.status}</Badge>,
                 ];
               })} />
      </Card>
    </div>
  );
}
