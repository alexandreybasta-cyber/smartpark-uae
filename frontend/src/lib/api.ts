export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function fetchZones() {
  const res = await fetch(`${API_BASE}/api/zones`);
  return res.json();
}

export async function fetchPredictions(zoneId: number) {
  const res = await fetch(`${API_BASE}/api/predict/${zoneId}`);
  return res.json();
}

export async function sendAgentQuery(text: string, lat: number, lng: number) {
  const res = await fetch(`${API_BASE}/api/agent/text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, lat, lng }),
  });
  return res.json();
}

export function createSpotsWebSocket(): WebSocket | null {
  if (typeof window === 'undefined') return null;
  const wsUrl = API_BASE.replace('http', 'ws') + '/ws/spots';
  return new WebSocket(wsUrl);
}
