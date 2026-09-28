'use client';

import { FormEvent, useEffect, useState } from 'react';
import { ModuleMeta, pfetch } from '@/lib/platformApi';
import { Badge, Card, PageHeader, Table } from '@/components/dash/ui';

interface SiteRow {
  id: number; name: string; price_per_hour: number;
  bays_total: number; bays_free: number; bays_occupied: number;
}
interface SourceRow {
  id: number; zone_id: number; kind: string; name: string; status: string;
}

export default function AdminPage() {
  const [modules, setModules] = useState<ModuleMeta[]>([]);
  const [sites, setSites] = useState<SiteRow[]>([]);
  const [sources, setSources] = useState<SourceRow[]>([]);
  const [siteName, setSiteName] = useState('');
  const [sitePrice, setSitePrice] = useState('4.0');
  const [notice, setNotice] = useState<string | null>(null);

  async function load() {
    const [m, s, src] = await Promise.all([
      pfetch<ModuleMeta[]>('/api/p/modules'),
      pfetch<SiteRow[]>('/api/p/sites'),
      pfetch<SourceRow[]>('/api/p/sources'),
    ]);
    setModules(m);
    setSites(s);
    setSources(src);
  }

  useEffect(() => {
    load().catch(() => setNotice('Failed to load admin data'));
  }, []);

  async function toggle(key: string) {
    const next = modules.map((m) =>
      m.key === key ? { ...m, entitled: !m.entitled } : m);
    setModules(next);
    await pfetch('/api/p/entitlements', {
      method: 'PUT',
      body: JSON.stringify({ modules: next.filter((m) => m.entitled).map((m) => m.key) }),
    });
    setNotice('Entitlements saved. The sidebar and overview update on next navigation.');
  }

  async function createSite(e: FormEvent) {
    e.preventDefault();
    if (!siteName.trim()) return;
    await pfetch('/api/p/sites', {
      method: 'POST',
      body: JSON.stringify({ name: siteName.trim(), price_per_hour: Number(sitePrice) || 4 }),
    });
    setSiteName('');
    await load();
    setNotice('Site created. Add areas and bays to start feeding it.');
  }

  return (
    <div>
      <PageHeader title="Admin" sub="Entitlements, portfolio and connected sources" />
      {notice ? (
        <div className="mb-4 text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded-md px-3 py-2">
          {notice}
        </div>
      ) : null}
      <Card title="Module entitlements (what this tenant sees and is billed for)" className="mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {modules.map((m) => (
            <button key={m.key} onClick={() => toggle(m.key)}
                    className={`flex items-center justify-between gap-2 border rounded-md px-3 py-2 text-left text-sm ${
                      m.entitled
                        ? 'border-orange-300 bg-orange-50 text-orange-800'
                        : 'border-zinc-200 bg-white text-zinc-500'}`}>
              <span className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: m.color }} />
                <span className="truncate font-medium">{m.num}. {m.name}</span>
              </span>
              <Badge tone={m.entitled ? 'orange' : 'zinc'}>
                {m.entitled ? 'on' : 'off'}
              </Badge>
            </button>
          ))}
        </div>
      </Card>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card title="Sites (portfolio)">
          <Table head={['Site', 'AED/hr', 'Bays', 'Free']}
                 rows={sites.map((s) => [
                   s.name, s.price_per_hour.toFixed(2), s.bays_total, s.bays_free,
                 ])} />
          <form onSubmit={createSite} className="flex gap-2 mt-4">
            <input value={siteName} onChange={(e) => setSiteName(e.target.value)}
                   placeholder="New site name"
                   className="flex-1 border border-zinc-300 rounded-md px-3 py-1.5 text-sm" />
            <input value={sitePrice} onChange={(e) => setSitePrice(e.target.value)}
                   className="w-20 border border-zinc-300 rounded-md px-2 py-1.5 text-sm" />
            <button type="submit"
                    className="bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold rounded-md px-3 py-1.5">
              Add site
            </button>
          </form>
        </Card>
        <Card title="Connected sources (adapters)">
          <Table head={['Kind', 'Name', 'Site', 'Status']}
                 rows={sources.map((s) => [
                   <Badge key="k" tone={s.kind === 'camera' ? 'amber'
                     : s.kind === 'sensor' ? 'green'
                     : s.kind === 'anpr_gate' ? 'orange' : 'zinc'}>{s.kind}</Badge>,
                   s.name, `Site ${s.zone_id}`, s.status,
                 ])} />
        </Card>
      </div>
    </div>
  );
}
