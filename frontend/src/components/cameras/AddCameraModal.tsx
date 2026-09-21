'use client';

import { useState } from 'react';
import type { CameraSourceType } from '@/types';
import { createCamera, type CameraCreatePayload } from '@/lib/api';
import { T } from '@/components/enforce/tokens';

const SOURCE_HELP: Record<CameraSourceType, string> = {
  rtsp: 'rtsp://user:pass@host:554/stream — a live security camera',
  file: 'Path or URL to a video file (loops). Good for demos & testing',
  webcam: 'Local webcam by index (0 = built-in). Needs OS camera permission',
  snapshot: 'Path or URL to a still image that is re-read on an interval',
};

interface Props {
  onClose: () => void;
  onCreated: (id: number) => void;
}

export default function AddCameraModal({ onClose, onCreated }: Props) {
  const [name, setName] = useState('');
  const [sourceType, setSourceType] = useState<CameraSourceType>('file');
  const [sourceUrl, setSourceUrl] = useState('');
  const [webcamIndex, setWebcamIndex] = useState(0);
  const [fps, setFps] = useState(4);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const needsUrl = sourceType !== 'webcam';

  async function submit() {
    setBusy(true);
    setError(null);
    const payload: CameraCreatePayload = {
      name: name.trim() || 'Camera',
      source_type: sourceType,
      fps_target: fps,
    };
    if (needsUrl) payload.source_url = sourceUrl.trim();
    else payload.webcam_index = webcamIndex;
    try {
      const cam = await createCamera(payload);
      onCreated(cam.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  }

  const inputCls =
    'w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2';
  const inputStyle = {
    backgroundColor: T.bg1,
    borderColor: T.border,
    color: T.text1,
  } as const;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(15,23,42,0.45)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border p-5 shadow-xl"
        style={{ backgroundColor: T.bg2, borderColor: T.border }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold mb-1" style={{ color: T.text1 }}>
          Add camera
        </h2>
        <p className="text-xs mb-4" style={{ color: T.text2 }}>
          Connect a video source. Regions (parking bays) are drawn on the live frame afterwards.
        </p>

        <label className="block text-xs font-medium mb-1" style={{ color: T.text2 }}>
          Name
        </label>
        <input
          className={inputCls}
          style={inputStyle}
          value={name}
          placeholder="DIC Lot A — North cam"
          onChange={(e) => setName(e.target.value)}
        />

        <label className="block text-xs font-medium mt-3 mb-1" style={{ color: T.text2 }}>
          Source type
        </label>
        <select
          className={inputCls}
          style={inputStyle}
          value={sourceType}
          onChange={(e) => setSourceType(e.target.value as CameraSourceType)}
        >
          <option value="rtsp">RTSP stream</option>
          <option value="file">Video file (loop)</option>
          <option value="webcam">Local webcam</option>
          <option value="snapshot">Snapshot image</option>
        </select>
        <p className="mt-1 text-[11px]" style={{ color: T.text3 }}>
          {SOURCE_HELP[sourceType]}
        </p>

        {needsUrl ? (
          <>
            <label className="block text-xs font-medium mt-3 mb-1" style={{ color: T.text2 }}>
              Source URL / path
            </label>
            <input
              className={inputCls}
              style={inputStyle}
              value={sourceUrl}
              placeholder={sourceType === 'rtsp' ? 'rtsp://…' : '/path/or/https://…'}
              onChange={(e) => setSourceUrl(e.target.value)}
            />
          </>
        ) : (
          <>
            <label className="block text-xs font-medium mt-3 mb-1" style={{ color: T.text2 }}>
              Webcam index
            </label>
            <input
              className={inputCls}
              style={inputStyle}
              type="number"
              min={0}
              value={webcamIndex}
              onChange={(e) => setWebcamIndex(Number(e.target.value))}
            />
          </>
        )}

        <label className="block text-xs font-medium mt-3 mb-1" style={{ color: T.text2 }}>
          Analysis rate (fps)
        </label>
        <input
          className={inputCls}
          style={inputStyle}
          type="number"
          min={0.5}
          max={30}
          step={0.5}
          value={fps}
          onChange={(e) => setFps(Number(e.target.value))}
        />

        {error && (
          <p className="mt-3 text-xs rounded-lg px-3 py-2" style={{ backgroundColor: '#fef2f2', color: T.red }}>
            {error}
          </p>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm border"
            style={{ borderColor: T.border, color: T.text2 }}
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={busy || (needsUrl && !sourceUrl.trim())}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: T.cyan }}
          >
            {busy ? 'Creating…' : 'Create camera'}
          </button>
        </div>
      </div>
    </div>
  );
}
