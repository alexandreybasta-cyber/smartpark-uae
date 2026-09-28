'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { pfetch } from '@/lib/platformApi';
import { Card, PageHeader } from '@/components/dash/ui';

const SiteMap = dynamic(() => import('@/components/dash/SiteMap'), {
  ssr: false,
  loading: () => <div className="h-[62vh] bg-zinc-100 rounded-lg animate-pulse" />,
});

interface SiteDetail {
  id: number;
  name: string;
  price_per_hour: number;
  polygon: { coordinates: number[][][] } | null;
  areas: { id: number; name: string }[];
  bays: { id: string; area_id: number | null; lat: number; lng: number; status: string }[];
  sources: { id: number; kind: string; name: string; status: string }[];
}

export default function MapPage() {
  const [sites, setSites] = useState<SiteDetail[] | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const list = await pfetch<{ id: number }[]>('/api/p/sites');
        const details = await Promise.all(
          list.map((s) => pfetch<SiteDetail>(`/api/p/sites/${s.id}`)));
        setSites(details);
        setSelected(details[0]?.id ?? null);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load sites');
      }
    })();
  }, []);

  if (error) return <div className="text-sm text-red-600">{error}</div>;
  if (!sites) return <div className="text-sm text-zinc-500">Loading map...</div>;

  const shown = selected == null ? sites : sites.filter((s) => s.id === selected);

  return (
    <div>
      <PageHeader title="Live Map & Zones"
                  sub="Every bay, live, per site and area"
                  action={
                    <select value={selected ?? ''}
                            onChange={(e) => setSelected(e.target.value ? Number(e.target.value) : null)}
                            className="text-sm border border-zinc-300 rounded-md px-2 py-1.5 bg-white">
                      <option value="">All sites</option>
                      {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  } />
      <Card>
        <SiteMap sites={shown} />
        <div className="flex flex-wrap gap-4 mt-3 text-xs text-zinc-600">
          <span><span className="inline-block w-2.5 h-2.5 rounded-full bg-green-600 mr-1" />free</span>
          <span><span className="inline-block w-2.5 h-2.5 rounded-full bg-red-600 mr-1" />occupied</span>
          <span><span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 mr-1" />reserved</span>
          <span><span className="inline-block w-2.5 h-2.5 rounded-full bg-zinc-400 mr-1" />sensor offline</span>
        </div>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        {shown.map((s) => (
          <Card key={s.id} title={s.name}>
            <div className="text-sm text-zinc-700 space-y-1">
              <div>Price: AED {s.price_per_hour}/hr</div>
              <div>Areas: {s.areas.map((a) => a.name).join(', ') || '-'}</div>
              <div>Bays: {s.bays.length} ({s.bays.filter((b) => b.status === 'free').length} free)</div>
              <div className="text-xs text-zinc-500">
                Sources: {s.sources.map((x) => x.kind).join(', ') || '-'}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
