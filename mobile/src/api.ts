import Constants from 'expo-constants';
import { AgentResponse, Prediction, SavedPlace, Spot, Zone } from './types';

// Derive the backend host from the Expo dev-server host, so a physical
// iPhone on the same Wi-Fi reaches the FastAPI server on the dev machine
// with zero configuration. Override with EXPO_PUBLIC_API_HOST if needed.
function deriveHost(): string {
  const override = process.env.EXPO_PUBLIC_API_HOST;
  if (override) return override;
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) return hostUri.split(':')[0];
  return 'localhost';
}

const HOST = deriveHost();
export const API_BASE = `http://${HOST}:8000`;
export const WS_URL = `ws://${HOST}:8000/ws/spots`;

async function fetchJson<T>(path: string, init?: RequestInit, timeoutMs = 5000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_BASE}${path}`, { ...init, signal: controller.signal });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export function fetchZones(): Promise<Zone[]> {
  return fetchJson<Zone[]>('/api/zones');
}

export function fetchZoneDetail(zoneId: number): Promise<Zone & { spots: Spot[] }> {
  return fetchJson<Zone & { spots: Spot[] }>(`/api/zones/${zoneId}`);
}

export function fetchPredictions(zoneId: number): Promise<Prediction[]> {
  return fetchJson<Prediction[]>(`/api/predict/${zoneId}`);
}

export function fetchPlaces(): Promise<SavedPlace[]> {
  return fetchJson<SavedPlace[]>('/api/places');
}

export function createPlace(place: Omit<SavedPlace, 'id' | 'user_id'>): Promise<SavedPlace> {
  return fetchJson<SavedPlace>('/api/places', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(place),
  });
}

export function deletePlace(placeId: number): Promise<void> {
  return fetchJson<void>(`/api/places/${placeId}`, { method: 'DELETE' });
}

export function sendAgentQuery(text: string, lat: number, lng: number): Promise<AgentResponse> {
  return fetchJson<AgentResponse>(
    '/api/agent/text',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, lat, lng }),
    },
    10000
  );
}
