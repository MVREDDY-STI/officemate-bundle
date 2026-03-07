const BASE = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:3000';

function getToken(): string | null {
  try {
    const s = sessionStorage.getItem('solum_auth');
    if (!s) return null;
    const parsed = JSON.parse(s);
    return parsed.token ?? null;
  } catch {
    return null;
  }
}

async function fetchApi<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init?.headers as Record<string, string> ?? {}),
  };

  const res = await fetch(`${BASE}${path}`, { ...init, headers });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(errText || `HTTP ${res.status}`);
  }

  // Handle 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

export const apiGet = <T>(path: string): Promise<T> => fetchApi<T>(path);

export const apiPost = <T>(path: string, body: unknown): Promise<T> =>
  fetchApi<T>(path, { method: 'POST', body: JSON.stringify(body) });

export const apiPatch = <T>(path: string, body: unknown): Promise<T> =>
  fetchApi<T>(path, { method: 'PATCH', body: JSON.stringify(body) });

export const apiDelete = <T>(path: string): Promise<T> =>
  fetchApi<T>(path, { method: 'DELETE' });

/**
 * Upload a file as multipart/form-data.
 * Do NOT set Content-Type — the browser adds the multipart boundary automatically.
 */
export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${BASE}${path}`, { method: 'POST', headers, body: formData });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(errText || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export { BASE };
