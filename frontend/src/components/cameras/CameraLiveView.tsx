'use client';

import type { Camera } from '@/types';
import { visionStreamUrl } from '@/lib/api';
import { T } from '@/components/enforce/tokens';

const STATUS_BADGE: Record<string, { bg: string; fg: string }> = {
  free: { bg: '#f0fdf4', fg: T.green },
  occupied: { bg: '#fef2f2', fg: T.red },
  unknown: { bg: T.bg3, fg: T.text2 },
};

interface Props {
  camera: Camera;
  onStart: () => void;
  onStop: () => void;
  onRecalibrate: () => void;
  onDelete: () => void;
  busy: boolean;
}

export default function CameraLiveView({ camera, onStart, onStop, onRecalibrate, onDelete, busy }: Props) {
  const running = camera.status === 'online' || camera.status === 'connecting';

  return (
    <section
      className="rounded-2xl border p-4"
      style={{ backgroundColor: T.bg2, borderColor: T.border }}
    >
      {/* header + controls */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <h2 className="text-sm font-semibold mr-auto" style={{ color: T.text1 }}>
          {camera.name}
          <span className="ml-2 text-[11px] font-normal" style={{ color: T.text3 }}>
            {camera.width ? `${camera.width}×${camera.height}` : 'no frame yet'} ·{' '}
            {camera.fps_target} fps target
          </span>
        </h2>

        {!running ? (
          <button
            onClick={onStart}
            disabled={busy}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: T.cyan }}
          >
            ▶ Start
          </button>
        ) : (
          <button
            onClick={onStop}
            disabled={busy}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border disabled:opacity-50"
            style={{ borderColor: T.border, color: T.text2 }}
          >
            ■ Stop
          </button>
        )}
        <button
          onClick={onRecalibrate}
          disabled={busy || !running}
          className="px-3 py-1.5 rounded-lg text-xs border disabled:opacity-50"
          style={{ borderColor: T.border, color: T.text2 }}
          title="Pin the next frame as the empty-lot reference"
        >
          Recalibrate
        </button>
        <button
          onClick={onDelete}
          disabled={busy}
          className="px-3 py-1.5 rounded-lg text-xs border disabled:opacity-50"
          style={{ borderColor: '#fecaca', color: T.red }}
        >
          Delete
        </button>
      </div>

      {/* live frame */}
      <div
        className="relative w-full overflow-hidden rounded-xl border"
        style={{ borderColor: T.border, backgroundColor: T.bg1, aspectRatio: '16 / 9' }}
      >
        {running ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={visionStreamUrl(camera.id)}
            alt={`${camera.name} live annotated feed`}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <span className="text-sm" style={{ color: T.text3 }}>
              Camera is {camera.status}
            </span>
            <span className="text-xs" style={{ color: T.text3 }}>
              Press Start to begin live occupancy detection
            </span>
          </div>
        )}
      </div>

      {/* region status chips */}
      <div className="mt-3 flex flex-wrap gap-2">
        {camera.regions.length === 0 && (
          <p className="text-xs" style={{ color: T.text3 }}>
            No regions yet — draw parking bays below to bind them to spots.
          </p>
        )}
        {camera.regions.map((r) => {
          const badge = STATUS_BADGE[r.status] ?? STATUS_BADGE.unknown;
          return (
            <div
              key={r.id}
              className="flex items-center gap-2 rounded-lg border px-2.5 py-1.5"
              style={{ borderColor: T.border, backgroundColor: T.bg1 }}
            >
              <span className="text-xs font-medium" style={{ color: T.text1 }}>
                {r.label}
              </span>
              <span
                className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded"
                style={{ backgroundColor: badge.bg, color: badge.fg }}
              >
                {r.status}
              </span>
              <span className="w-14 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: T.bg3 }}>
                <span
                  className="block h-full rounded-full"
                  style={{ width: `${Math.round(r.confidence * 100)}%`, backgroundColor: T.cyan }}
                />
              </span>
              <span className="text-[10px] tabular-nums" style={{ color: T.text3 }}>
                {Math.round(r.confidence * 100)}%
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
