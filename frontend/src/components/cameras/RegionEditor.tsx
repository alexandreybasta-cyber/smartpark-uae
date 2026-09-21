'use client';

import { useRef, useState } from 'react';
import type { PolygonPoint, Spot } from '@/types';
import { createRegion, visionSnapshotUrl } from '@/lib/api';
import { T } from '@/components/enforce/tokens';

interface SpotGroup {
  zoneName: string;
  spots: Spot[];
}

interface Props {
  cameraId: number;
  frameWidth: number | null;
  frameHeight: number | null;
  regionCount: number;
  spotGroups: SpotGroup[];
  onSaved: () => void;
}

export default function RegionEditor({
  cameraId,
  frameWidth,
  frameHeight,
  regionCount,
  spotGroups,
  onSaved,
}: Props) {
  const W = frameWidth || 640;
  const H = frameHeight || 360;

  const boxRef = useRef<HTMLDivElement>(null);
  const [points, setPoints] = useState<PolygonPoint[]>([]);
  const [bust, setBust] = useState(() => Date.now());
  const [noFrame, setNoFrame] = useState(false);
  const [label, setLabel] = useState('');
  const [spotId, setSpotId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addPoint(e: React.MouseEvent) {
    const box = boxRef.current;
    if (!box) return;
    const rect = box.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
    setPoints((p) => [...p, [Number(x.toFixed(5)), Number(y.toFixed(5))]]);
  }

  async function save() {
    if (points.length < 3) return;
    setBusy(true);
    setError(null);
    try {
      await createRegion(cameraId, {
        label: label.trim() || `bay-${regionCount + 1}`,
        polygon: points,
        spot_id: spotId || null,
      });
      setPoints([]);
      setLabel('');
      setSpotId('');
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  const inputCls = 'rounded-lg border px-2.5 py-1.5 text-xs outline-none';
  const inputStyle = { backgroundColor: T.bg1, borderColor: T.border, color: T.text1 } as const;

  return (
    <section
      className="rounded-2xl border p-4"
      style={{ backgroundColor: T.bg2, borderColor: T.border }}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold" style={{ color: T.text1 }}>
          Draw a parking bay
        </h3>
        <button
          onClick={() => setBust(Date.now())}
          className="text-[11px] px-2 py-1 rounded border"
          style={{ borderColor: T.border, color: T.text2 }}
        >
          Refresh frame
        </button>
      </div>
      <p className="text-[11px] mb-3" style={{ color: T.text2 }}>
        Click on the frame to place the corners of one bay (3+ points). The polygon is bound to a
        spot so detections drive that spot on the map.
      </p>

      <div
        ref={boxRef}
        onMouseDown={addPoint}
        className="relative w-full cursor-crosshair overflow-hidden rounded-xl border select-none"
        style={{ borderColor: T.border, backgroundColor: T.bg1, aspectRatio: `${W} / ${H}` }}
      >
        {noFrame ? (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-xs" style={{ color: T.text3 }}>
              No frame yet — start the camera, then refresh.
            </span>
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={visionSnapshotUrl(cameraId, bust)}
            alt="Latest analysed frame"
            className="w-full h-full object-contain"
            onError={() => setNoFrame(true)}
            onLoad={() => setNoFrame(false)}
            draggable={false}
          />
        )}

        {/* polygon overlay */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
        >
          {points.length > 0 && (
            <polyline
              points={[...points, points[0]]
                .map(([x, y]) => `${x * W},${y * H}`)
                .join(' ')}
              fill={`${T.cyan}22`}
              stroke={T.cyan}
              strokeWidth={2}
            />
          )}
          {points.map(([x, y], i) => (
            <circle
              key={i}
              cx={x * W}
              cy={y * H}
              r={4}
              fill={T.bg2}
              stroke={T.cyan}
              strokeWidth={2}
            />
          ))}
        </svg>
      </div>

      {/* point controls */}
      <div className="mt-2 flex items-center gap-2">
        <span className="text-[11px]" style={{ color: T.text3 }}>
          {points.length} point{points.length === 1 ? '' : 's'}
        </span>
        <button
          onClick={() => setPoints((p) => p.slice(0, -1))}
          disabled={points.length === 0}
          className="text-[11px] px-2 py-1 rounded border disabled:opacity-40"
          style={{ borderColor: T.border, color: T.text2 }}
        >
          Undo
        </button>
        <button
          onClick={() => setPoints([])}
          disabled={points.length === 0}
          className="text-[11px] px-2 py-1 rounded border disabled:opacity-40"
          style={{ borderColor: T.border, color: T.text2 }}
        >
          Clear
        </button>
      </div>

      {/* bind + save */}
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 items-end">
        <div>
          <label className="block text-[11px] mb-1" style={{ color: T.text2 }}>
            Label
          </label>
          <input
            className={`${inputCls} w-full`}
            style={inputStyle}
            value={label}
            placeholder={`bay-${regionCount + 1}`}
            onChange={(e) => setLabel(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-[11px] mb-1" style={{ color: T.text2 }}>
            Bind to spot
          </label>
          <select
            className={`${inputCls} w-full`}
            style={inputStyle}
            value={spotId}
            onChange={(e) => setSpotId(e.target.value)}
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
        </div>
        <button
          onClick={save}
          disabled={busy || points.length < 3}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
          style={{ backgroundColor: T.cyan }}
        >
          {busy ? 'Saving…' : 'Save region'}
        </button>
      </div>

      {error && (
        <p className="mt-2 text-[11px]" style={{ color: T.red }}>
          {error}
        </p>
      )}
    </section>
  );
}
