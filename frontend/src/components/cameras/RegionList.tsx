'use client';

import type { CameraRegion, Spot } from '@/types';
import { T } from '@/components/enforce/tokens';

interface SpotGroup {
  zoneName: string;
  spots: Spot[];
}

interface Props {
  regions: CameraRegion[];
  spotGroups: SpotGroup[];
  onRebind: (regionId: number, spotId: string | null) => void;
  onDelete: (regionId: number) => void;
}

const STATUS_FG: Record<string, string> = {
  free: T.green,
  occupied: T.red,
  unknown: T.text3,
};

export default function RegionList({ regions, spotGroups, onRebind, onDelete }: Props) {
  return (
    <section
      className="rounded-2xl border p-4"
      style={{ backgroundColor: T.bg2, borderColor: T.border }}
    >
      <h3 className="text-sm font-semibold mb-3" style={{ color: T.text1 }}>
        Regions ({regions.length})
      </h3>

      {regions.length === 0 && (
        <p className="text-xs" style={{ color: T.text3 }}>
          No regions drawn yet.
        </p>
      )}

      <div className="flex flex-col gap-2">
        {regions.map((r) => (
          <div
            key={r.id}
            className="rounded-xl border p-3"
            style={{ borderColor: T.border, backgroundColor: T.bg1 }}
          >
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: STATUS_FG[r.status] ?? T.text3 }}
              />
              <span className="text-xs font-semibold" style={{ color: T.text1 }}>
                {r.label}
              </span>
              <span className="text-[11px] uppercase" style={{ color: STATUS_FG[r.status] ?? T.text3 }}>
                {r.status}
              </span>
              <span className="ml-auto text-[11px] tabular-nums" style={{ color: T.text3 }}>
                conf {Math.round(r.confidence * 100)}%
              </span>
              <button
                onClick={() => onDelete(r.id)}
                className="text-[11px] px-2 py-0.5 rounded border"
                style={{ borderColor: '#fecaca', color: T.red }}
                title="Delete region"
              >
                ✕
              </button>
            </div>

            <div className="mt-2 flex items-center gap-2">
              <span className="text-[11px]" style={{ color: T.text2 }}>
                spot
              </span>
              <select
                className="rounded border px-1.5 py-0.5 text-[11px] outline-none"
                style={{ backgroundColor: T.bg2, borderColor: T.border, color: T.text1 }}
                value={r.spot_id ?? ''}
                onChange={(e) => onRebind(r.id, e.target.value || null)}
              >
                <option value="">— unbound —</option>
                {spotGroups.map((g) => (
                  <optgroup key={g.zoneName} label={g.zoneName}>
                    {g.spots.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.id}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <span className="ml-auto text-[10px]" style={{ color: T.text3 }}>
                occ≥{Math.round(r.occupy_threshold * 100)}% · free≤{Math.round(r.free_threshold * 100)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
