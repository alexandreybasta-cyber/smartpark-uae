// Platform API client: token session, entitlement-aware fetch, preview header.
// NEXT_PUBLIC_* is inlined at build time, so resolve the platform backend at
// runtime: local dev pages talk to the local backend on :8000, hosted pages
// use the configured API origin.
export const P_API_BASE = (() => {
  if (typeof window !== 'undefined') {
    const h = window.location.hostname;
    if (h === 'localhost' || h === '127.0.0.1') {
      return `${window.location.protocol}//${h}:8000`;
    }
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
})();

const TOKEN_KEY = 'ss_token';
const PREVIEW_KEY = 'ss_preview';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(PREVIEW_KEY);
}
export function getPreview(): string[] {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(PREVIEW_KEY) || '';
  return raw ? raw.split(',').filter(Boolean) : [];
}
export function setPreview(keys: string[]) {
  if (keys.length === 0) window.localStorage.removeItem(PREVIEW_KEY);
  else window.localStorage.setItem(PREVIEW_KEY, keys.join(','));
}

export interface ModuleMeta {
  key: string;
  num: number;
  name: string;
  route: string;
  color: string;
  blurb: string;
  entitled?: boolean;
}
export interface MeResponse {
  user: { id: number; email: string; name: string; role: string };
  tenant: { id: number; name: string; logo_text: string | null };
  modules: ModuleMeta[];
  preview: string[] | null;
}
export interface OverviewResponse {
  modules: string[];
  widgets: Record<string, Record<string, unknown>>;
}

export async function pfetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string> | undefined),
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const preview = getPreview();
  if (preview.length) headers['X-Preview-Modules'] = preview.join(',');
  const res = await fetch(`${P_API_BASE}${path}`, { ...init, headers });
  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      clearToken();
      window.location.href = '/login';
    }
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    let detail = `${res.status}`;
    try {
      const body = await res.json();
      if (body?.detail) detail = String(body.detail);
    } catch {
      /* non-JSON body */
    }
    throw new Error(`API ${res.status}: ${detail}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export async function login(email: string, password: string) {
  const res = await fetch(`${P_API_BASE}/api/p/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    let detail = 'Invalid email or password';
    try {
      const body = await res.json();
      if (body?.detail) detail = String(body.detail);
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }
  const data = await res.json();
  setToken(data.token);
  return data;
}

// Backend stores naive UTC; treat missing offset as UTC.
export function fmtTime(iso: string | null | undefined): string {
  if (!iso) return '-';
  const stamped = /Z$|[+-]\d\d:?\d\d$/.test(iso) ? iso : `${iso}Z`;
  const d = new Date(stamped);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
