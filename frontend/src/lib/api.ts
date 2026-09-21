import type { Camera, CameraRegion, DetectionEvent, PolygonPoint, Spot, Zone } from '@/types';

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.spotsense.app';

async function jsonRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    let detail = `${res.status}`;
    try {
      const body = await res.json();
      if (body?.detail) detail = typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail);
    } catch {
      /* non-JSON error body */
    }
    throw new Error(`API ${res.status}: ${detail}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export async function fetchZones() {
  const res = await fetch(`${API_BASE}/api/zones`);
  if (!res.ok) throw new Error(`Failed to fetch zones: ${res.status}`);
  return res.json();
}

export const fetchZone = (zoneId: number) =>
  jsonRequest<Zone & { spots: Spot[] }>(`/api/zones/${zoneId}`);

export async function fetchPredictions(zoneId: number) {
  const res = await fetch(`${API_BASE}/api/predict/${zoneId}`);
  if (!res.ok) throw new Error(`Failed to fetch predictions: ${res.status}`);
  return res.json();
}

export async function sendAgentQuery(text: string, lat: number, lng: number) {
  const res = await fetch(`${API_BASE}/api/agent/text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, lat, lng }),
  });
  if (!res.ok) throw new Error(`Failed to send agent query: ${res.status}`);
  return res.json();
}

export function createSpotsWebSocket(): WebSocket | null {
  if (typeof window === 'undefined') return null;
  const wsUrl = API_BASE.replace('http', 'ws') + '/ws/spots';
  return new WebSocket(wsUrl);
}

// ---------------------------------------------------------------------------
// Camera vision (OpenCV occupancy detection)
// ---------------------------------------------------------------------------
export interface CameraCreatePayload {
  name: string;
  source_type: 'rtsp' | 'file' | 'webcam' | 'snapshot';
  source_url?: string | null;
  webcam_index?: number | null;
  fps_target?: number;
}

export interface RegionCreatePayload {
  label: string;
  polygon: PolygonPoint[];
  spot_id?: string | null;
  occupy_threshold?: number;
  free_threshold?: number;
}

export const fetchCameras = () => jsonRequest<Camera[]>('/api/vision/cameras');
export const fetchCamera = (id: number) => jsonRequest<Camera>(`/api/vision/cameras/${id}`);
export const createCamera = (payload: CameraCreatePayload) =>
  jsonRequest<Camera>('/api/vision/cameras', { method: 'POST', body: JSON.stringify(payload) });
export const updateCamera = (id: number, payload: Partial<CameraCreatePayload>) =>
  jsonRequest<Camera>(`/api/vision/cameras/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
export const deleteCamera = (id: number) =>
  jsonRequest<void>(`/api/vision/cameras/${id}`, { method: 'DELETE' });
export const startCamera = (id: number) =>
  jsonRequest<Camera>(`/api/vision/cameras/${id}/start`, { method: 'POST' });
export const stopCamera = (id: number) =>
  jsonRequest<Camera>(`/api/vision/cameras/${id}/stop`, { method: 'POST' });
export const recalibrateCamera = (id: number) =>
  jsonRequest<Camera>(`/api/vision/cameras/${id}/recalibrate`, { method: 'POST' });

export const createRegion = (cameraId: number, payload: RegionCreatePayload) =>
  jsonRequest<CameraRegion>(`/api/vision/cameras/${cameraId}/regions`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
export const updateRegion = (
  regionId: number,
  payload: Partial<RegionCreatePayload>,
) => jsonRequest<CameraRegion>(`/api/vision/regions/${regionId}`, {
  method: 'PUT',
  body: JSON.stringify(payload),
});
export const deleteRegion = (regionId: number) =>
  jsonRequest<void>(`/api/vision/regions/${regionId}`, { method: 'DELETE' });

export const fetchCameraEvents = (cameraId: number, limit = 30) =>
  jsonRequest<DetectionEvent[]>(`/api/vision/cameras/${cameraId}/events?limit=${limit}`);

// Live annotated MJPEG stream (usable directly in an <img> tag).
export const visionStreamUrl = (cameraId: number) =>
  `${API_BASE}/api/vision/cameras/${cameraId}/stream.mjpg`;

// Single annotated JPEG frame; pass a changing token to bypass caching.
export const visionSnapshotUrl = (cameraId: number, cacheBust: number | string) =>
  `${API_BASE}/api/vision/cameras/${cameraId}/snapshot.jpg?cb=${cacheBust}`;
