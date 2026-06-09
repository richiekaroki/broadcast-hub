/// <reference types="vite/client" />
// In dev: requests go to /api/v1 and Vite proxies to localhost:4000
// In production (Vercel): VITE_API_URL=https://your-backend.railway.app
const BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/v1`
  : '/api/v1';

// ── Token helpers ─────────────────────────────────────────────────────────────
export const tokens = {
  get access()  { return localStorage.getItem('accessToken'); },
  get refresh() { return localStorage.getItem('refreshToken'); },
  set(access: string, refresh: string) {
    localStorage.setItem('accessToken', access);
    localStorage.setItem('refreshToken', refresh);
  },
  clear() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },
};

// Prevent concurrent refresh races
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

// ── Core request helper with auto-refresh ─────────────────────────────────────
async function req<T>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
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

// ── Auth ──────────────────────────────────────────────────────────────────────
export interface TokenPair { accessToken: string; refreshToken: string; }

export async function login(email: string, password: string): Promise<TokenPair> {
  const data = await req<TokenPair>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  tokens.set(data.accessToken, data.refreshToken);
  return data;
}

export async function register(email: string, password: string, name: string): Promise<TokenPair> {
  const data = await req<TokenPair>('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, name }) });
  tokens.set(data.accessToken, data.refreshToken);
  return data;
}

export async function logout(): Promise<void> {
  const rt = tokens.refresh;
  if (rt && tokens.access) {
    await req('/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken: rt }) }).catch(() => {});
  }
  tokens.clear();
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export interface DashboardStats {
  totalUsers: number; totalContent: number;
  publishedContent: number; todayViews: number; cached: boolean;
}
export const fetchDashboardStats = () => req<DashboardStats>('/dashboard');

// ── Content ───────────────────────────────────────────────────────────────────
export type ContentStatus = 'draft' | 'pending_review' | 'published' | 'rejected';

export interface ContentItem {
  id: string; title: string; body: string;
  status: ContentStatus; authorId: string;
  rejectionReason: string | null;
  createdAt: string; updatedAt: string;
}

export const fetchContent     = ()                                        => req<ContentItem[]>('/content');
export const fetchContentById = (id: string)                             => req<ContentItem>(`/content/${id}`);
export const createContent    = (d: { title: string; body: string })     => req<ContentItem>('/content', { method: 'POST', body: JSON.stringify(d) });
export const updateContent    = (id: string, d: Partial<{ title: string; body: string }>) => req<ContentItem>(`/content/${id}`, { method: 'PATCH', body: JSON.stringify(d) });
export const submitContent    = (id: string)                             => req<ContentItem>(`/content/${id}/submit`, { method: 'POST' });
export const publishContent   = (id: string)                             => req<ContentItem>(`/content/${id}/publish`, { method: 'PATCH' });
export const rejectContent    = (id: string, reason: string)            => req<ContentItem>(`/content/${id}/reject`, { method: 'PATCH', body: JSON.stringify({ reason }) });
export const deleteContent    = (id: string)                             => req<void>(`/content/${id}`, { method: 'DELETE' });

// ── Programs ──────────────────────────────────────────────────────────────────
export interface Program {
  id: string; title: string; startTime: string; endTime: string;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  presenterId: string | null; createdAt: string;
}
export interface ProgramsResponse { data: Program[]; total: number; page: number; limit: number; }
export const fetchPrograms = (page = 1, limit = 20) => req<ProgramsResponse>(`/programs?page=${page}&limit=${limit}`);
