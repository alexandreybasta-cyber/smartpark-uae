'use client';

import type { Camera } from '@/types';
import { T } from '@/components/enforce/tokens';

const STATUS_COLOR: Record<string, string> = {
  online: T.green,
  connecting: T.amber,
  offline: T.text3,
  error: T.red,
};

interface Props {
  cameras: Camera[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onAdd: () => void;
}

export default function CameraList({ cameras, selectedId, onSelect, onAdd }: Props) {
  return (
    <aside
      className="w-full lg:w-80 shrink-0 rounded-2xl border p-4"
      style={{ backgroundColor: T.bg2, borderColor: T.border }}
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold" style={{ color: T.text1 }}>
          Cameras
        </h2>
        <button
          onClick={onAdd}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: T.cyan }}
        >
          + Add camera
        </button>
      </div>

      {cameras.length === 0 && (
        <p className="text-xs py-6 text-center" style={{ color: T.text3 }}>
          No cameras yet. Add one to start detecting occupancy.
        </p>
      )}

      <div className="flex flex-col gap-2">
        {cameras.map((cam) => {
          const active = cam.id === selectedId;
          const occupied = cam.regions.filter((r) => r.status === 'occupied').length;
          return (
            <button
              key={cam.id}
              onClick={() => onSelect(cam.id)}
              className="text-left rounded-xl border p-3 transition-colors"
              style={{
                borderColor: active ? T.cyan : T.border,
                backgroundColor: active ? T.bg3 : T.bg2,
                boxShadow: active ? `0 0 0 1px ${T.cyan}` : undefined,
              }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: STATUS_COLOR[cam.status] ?? T.text3 }}
                />
                <span className="text-sm font-medium truncate" style={{ color: T.text1 }}>
                  {cam.name}
                </span>
                <span
                  className="ml-auto text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: T.bg3, color: T.text2 }}
                >
                  {cam.source_type}
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-3 text-[11px]" style={{ color: T.text2 }}>
                <span>{cam.regions.length} regions</span>
                <span style={{ color: T.red }}>{occupied} occupied</span>
                <span className="ml-auto" style={{ color: T.text3 }}>
                  {cam.frames_analysed.toLocaleString()} frames
                </span>
              </div>
              {cam.status === 'error' && cam.error_message && (
                <p className="mt-1 text-[11px]" style={{ color: T.red }}>
                  {cam.error_message}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
