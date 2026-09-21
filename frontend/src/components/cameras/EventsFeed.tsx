'use client';

import type { DetectionEvent } from '@/types';
import { T } from '@/components/enforce/tokens';

interface Props {
  events: DetectionEvent[];
}

function fmtTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], { hour12: false });
  } catch {
    return iso;
  }
}

export default function EventsFeed({ events }: Props) {
  return (
    <section
      className="rounded-2xl border p-4"
      style={{ backgroundColor: T.bg2, borderColor: T.border }}
    >
      <h3 className="text-sm font-semibold mb-3" style={{ color: T.text1 }}>
        Detection events
      </h3>

      {events.length === 0 && (
        <p className="text-xs" style={{ color: T.text3 }}>
          No state changes recorded yet.
        </p>
      )}

      <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto pr-1">
        {events.map((e) => (
          <div
            key={e.id}
            className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px]"
            style={{ backgroundColor: T.bg1, borderLeft: `3px solid ${e.new_status === 'occupied' ? T.red : T.green}` }}
          >
            <span className="tabular-nums" style={{ color: T.text3 }}>
              {fmtTime(e.created_at)}
            </span>
            <span className="font-medium" style={{ color: T.text1 }}>
              {e.spot_id ?? `region ${e.region_id}`}
            </span>
            <span style={{ color: T.text2 }}>
              {e.previous_status} → {e.new_status}
            </span>
            <span
              className="ml-auto uppercase px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: e.source === 'vision' ? '#fff7ed' : '#eff6ff',
                color: e.source === 'vision' ? T.cyan : T.blue,
              }}
            >
              {e.source}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
