'use client';

import {
  CategoryScale, Chart, Filler, LinearScale, LineElement, PointElement,
  Tooltip, Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useEffect, useState } from 'react';
import { pfetch } from '@/lib/platformApi';
import { Card, PageHeader, Table } from '@/components/dash/ui';

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

interface ZoneSummary {
  zone_id: number; name: string; total: number; occupied: number;
  occupancy_now: number; forecast_peak: number | null;
}
interface Prediction { timestamp: string; predicted_occupancy: number; confidence: number }

export default function AnalyticsPage() {
  const [zones, setZones] = useState<ZoneSummary[]>([]);
  const [series, setSeries] = useState<Prediction[]>([]);
  const [zoneId, setZoneId] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const z = await pfetch<ZoneSummary[]>('/api/p/analytics/summary');
        setZones(z);
        if (z[0]) setZoneId(z[0].zone_id);
      } catch {
        /* auth redirect handles failures */
      }
    })();
  }, []);

  useEffect(() => {
    if (zoneId == null) return;
    (async () => {
      try {
        setSeries(await pfetch<Prediction[]>(`/api/predict/${zoneId}`));
      } catch {
        setSeries([]);
      }
    })();
  }, [zoneId]);

  const labels = series.map((p) => {
    const d = new Date(`${p.timestamp}Z`);
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  });

  return (
    <div>
      <PageHeader title="Prediction & Analytics"
                  sub="Occupancy forecasts and utilisation per site"
                  action={
                    <select value={zoneId ?? ''} onChange={(e) => setZoneId(Number(e.target.value))}
                            className="text-sm border border-zinc-300 rounded-md px-2 py-1.5 bg-white">
                      {zones.map((z) => <option key={z.zone_id} value={z.zone_id}>{z.name}</option>)}
                    </select>
                  } />
      <Card title="Forecast occupancy" className="mb-4">
        {series.length === 0 ? (
          <div className="text-sm text-zinc-400 py-8 text-center">No forecast data</div>
        ) : (
          <Line
            data={{
              labels,
              datasets: [{
                label: 'Predicted occupancy %',
                data: series.map((p) => p.predicted_occupancy),
                borderColor: '#EA580C',
                backgroundColor: 'rgba(234,88,12,0.12)',
                fill: true,
                pointRadius: 0,
                tension: 0.35,
              }],
            }}
            options={{
              responsive: true,
              plugins: { legend: { display: false } },
              scales: { y: { min: 0, max: 100 } },
            }}
          />
        )}
      </Card>
      <Card title="Sites now">
        <Table head={['Site', 'Bays', 'Occupied', 'Occupancy now', 'Forecast peak']}
               rows={zones.map((z) => [
                 z.name, `${z.total}`, `${z.occupied}`, `${z.occupancy_now}%`,
                 z.forecast_peak == null ? '-' : `${z.forecast_peak}%`,
               ])} />
      </Card>
    </div>
  );
}
