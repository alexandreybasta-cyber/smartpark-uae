'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  MeResponse, OverviewResponse, pfetch,
} from '@/lib/platformApi';
import { Card, PageHeader, Stat } from '@/components/dash/ui';

type W = Record<string, unknown>;
const n = (v: unknown) => (typeof v === 'number' ? v : 0);

function WidgetBody({ k, w }: { k: string; w: W }) {
  switch (k) {
    case 'map':
      return (
        <div className="flex gap-6">
          <Stat label="Sites" value={n(w.sites)} />
          <Stat label="Bays free" value={`${n(w.bays_free)} / ${n(w.bays_total)}`} />
          <Stat label="Occupied" value={n(w.bays_occupied)} />
        </div>
      );
    case 'vision':
      return (
        <div className="flex gap-6">
          <Stat label="Cameras online" value={`${n(w.cameras_online)} / ${n(w.cameras_total)}`} />
          <Stat label="Detections 24h" value={n(w.detections_24h)} />
        </div>
      );
    case 'sensors':
      return (
        <div className="flex gap-6">
          <Stat label="Fleet online" value={`${n(w.online)} / ${n(w.total)}`} />
          <Stat label="Low battery" value={n(w.low_battery)} />
        </div>
      );
    case 'anpr':
      return (
        <div className="flex gap-6">
          <Stat label="Passages 24h" value={n(w.passages_24h)} />
          <Stat label="Open visits" value={n(w.open_visits)} />
        </div>
      );
    case 'payments':
      return (
        <div className="flex gap-6">
          <Stat label="Revenue 24h" value={`AED ${n(w.revenue_24h_aed).toFixed(2)}`} />
          <Stat label="Sessions" value={n(w.sessions_24h)} hint={`${n(w.open_sessions)} open`} />
        </div>
      );
    case 'enforcement':
      return (
        <div className="flex gap-6">
          <Stat label="Open violations" value={n(w.open_violations)} />
          <Stat label="Arbitration" value="Qwen Max" hint="pre-issue review" />
        </div>
      );
    case 'agent':
      return (
        <div className="flex gap-6">
          <Stat label="Engine" value="Online" hint={String(w.engine ?? '')} />
        </div>
      );
    case 'analytics':
      return (
        <div className="flex gap-6">
          <Stat label="Occupancy now" value={`${n(w.occupancy_now_pct)}%`} />
          <Stat label="Forecast peak"
                value={w.forecast_peak_pct == null ? '-' : `${n(w.forecast_peak_pct)}%`} />
        </div>
      );
    case 'driver':
      return (
        <div className="flex gap-6">
          <Stat label="Saved places" value={n(w.saved_places)} />
          <Stat label="Geofence" value={`${n(w.geofence_m)} m`} />
        </div>
      );
    default:
      return null;
  }
}

export default function OverviewPage() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [m, o] = await Promise.all([
          pfetch<MeResponse>('/api/p/me'),
          pfetch<OverviewResponse>('/api/p/overview'),
        ]);
        if (!alive) return;
        setMe(m);
        setData(o);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : 'Failed to load');
      }
    })();
    return () => { alive = false; };
  }, []);

  if (error) {
    return <div className="text-sm text-red-600">{error}</div>;
  }
  if (!me || !data) {
    return <div className="text-sm text-zinc-500">Loading overview...</div>;
  }

  return (
    <div>
      <PageHeader title="Overview"
                  sub={`${me.tenant.name} - live picture across your entitled modules`} />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {me.modules.map((m) => {
          const w = data.widgets[m.key];
          if (!w) return null;
          return (
            <Card key={m.key} accent={m.color} className="hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <div className="text-sm font-bold text-zinc-800">{m.name}</div>
                  <div className="text-[11px] text-zinc-500">{m.blurb}</div>
                </div>
                <Link href={m.route}
                      className="text-[11px] font-semibold text-orange-600 hover:text-orange-700 shrink-0">
                  Open
                </Link>
              </div>
              <WidgetBody k={m.key} w={w} />
            </Card>
          );
        })}
      </div>
    </div>
  );
}
