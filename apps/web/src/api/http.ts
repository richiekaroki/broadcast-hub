/// <reference types="vite/client" />

const BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/v1`
  : '/api/v1';

let cachedAccess: string | null = undefined as unknown as string | null;
let cachedRefresh: string | null = undefined as unknown as string | null;

const LS_VERSION = 'v1';
const KEYS = {
  access:  `accessToken:${LS_VERSION}`,
  refresh: `refreshToken:${LS_VERSION}`,
};

export const tokens = {
  get access() {
    if (cachedAccess === undefined) cachedAccess = localStorage.getItem(KEYS.access);
    return cachedAccess;
  },
  get refresh() {
    if (cachedRefresh === undefined) cachedRefresh = localStorage.getItem(KEYS.refresh);
    return cachedRefresh;
  },
  set(access: string, refresh: string) {
    localStorage.setItem(KEYS.access, access);
    localStorage.setItem(KEYS.refresh, refresh);
    cachedAccess = access;
    cachedRefresh = refresh;
  },
  clear() {
    localStorage.removeItem(KEYS.access);
    localStorage.removeItem(KEYS.refresh);
    cachedAccess = null;
    cachedRefresh = null;
  },
};

let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    const rt = tokens.refresh;
    if (!rt) return false;
    try {
      const res = await fetch(`${BASE}/auth/refresh`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ refreshToken: rt }),
      });
      if (!res.ok) { tokens.clear(); return false; }
      const data = await res.json();
      tokens.set(data.accessToken, data.refreshToken);
      return true;
    } catch {
      tokens.clear();
      return false;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

export async function req<T>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(tokens.access ? { Authorization: `Bearer ${tokens.access}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401 && retry) {
    const refreshed = await tryRefresh();
    if (refreshed) return req<T>(path, options, false);
    tokens.clear();
    window.location.href = '/login';
    throw new Error('Session expired');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as any;
    throw new Error(body.message || `HTTP ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}
