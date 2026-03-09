export const BASE = (import.meta as any).env?.VITE_API_URL ?? '';

// ── Token helpers ─────────────────────────────────────────────
function getToken(): string | null {
  try {
    const s = sessionStorage.getItem('solum_auth');
    if (!s) return null;
    return JSON.parse(s).token ?? null;
  } catch {
    return null;
  }
}

/** Try to get a new access token using the stored refresh token.
 *  Returns the new access token on success, null on failure. */
async function refreshAccessToken(): Promise<string | null> {
  try {
    const raw = sessionStorage.getItem('solum_auth');
    const { refreshToken } = JSON.parse(raw ?? '{}');
    if (!refreshToken) return null;

    const res = await fetch(`${BASE}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;

    const { token } = await res.json() as { token: string };
    // Persist new access token while keeping refresh token
    sessionStorage.setItem('solum_auth', JSON.stringify({ token, refreshToken }));
    return token;
  } catch {
    return null;
  }
}

/** Clear session and send the user back to login. */
function clearSessionAndRedirect(): void {
  sessionStorage.removeItem('solum_auth');
  sessionStorage.removeItem('solum_user');
  window.location.href = '/dashboard/login';
}

// ── Core fetch with auto-refresh ──────────────────────────────
async function fetchApi<T>(path: string, init?: RequestInit): Promise<T> {
  let token = getToken();

  const buildHeaders = (t: string | null): Record<string, string> => ({
    'Content-Type': 'application/json',
    ...(t ? { Authorization: `Bearer ${t}` } : {}),
    ...(init?.headers as Record<string, string> ?? {}),
  });

  let res = await fetch(`${BASE}${path}`, { ...init, headers: buildHeaders(token) });

  // On 401, try refresh once then retry
  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      res = await fetch(`${BASE}${path}`, { ...init, headers: buildHeaders(newToken) });
    } else {
      clearSessionAndRedirect();
      throw new Error('Session expired. Please log in again.');
    }
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(errText || `HTTP ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ── Public API helpers ────────────────────────────────────────
export const apiGet = <T>(path: string): Promise<T> => fetchApi<T>(path);

export const apiPost = <T>(path: string, body: unknown): Promise<T> =>
  fetchApi<T>(path, { method: 'POST', body: JSON.stringify(body) });

export const apiPatch = <T>(path: string, body: unknown): Promise<T> =>
  fetchApi<T>(path, { method: 'PATCH', body: JSON.stringify(body) });

export const apiDelete = <T>(path: string): Promise<T> =>
  fetchApi<T>(path, { method: 'DELETE' });

/**
 * Upload a file as multipart/form-data.
 * Does NOT set Content-Type — the browser adds the multipart boundary automatically.
 * Also includes the 401 → refresh → retry pattern.
 */
export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  let token = getToken();

  const buildHeaders = (t: string | null): Record<string, string> =>
    t ? { Authorization: `Bearer ${t}` } : {};

  let res = await fetch(`${BASE}${path}`, { method: 'POST', headers: buildHeaders(token), body: formData });

  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      res = await fetch(`${BASE}${path}`, { method: 'POST', headers: buildHeaders(newToken), body: formData });
    } else {
      clearSessionAndRedirect();
      throw new Error('Session expired. Please log in again.');
    }
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(errText || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}
