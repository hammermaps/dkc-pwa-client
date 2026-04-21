/**
 * Base HTTP client for the DK-Control API.
 *
 * Auth strategy:
 *  - Primary: session cookie (credentials: 'include') – required for meter_* endpoints
 *  - Secondary: Bearer token stored in localStorage – used as Authorization header
 */

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) ?? '';

export interface ApiResponse<T = unknown> {
  success: boolean;
  error?: string;
  [key: string]: T | unknown;
}

function getToken(): string | null {
  return localStorage.getItem('dkc_token');
}

function buildUrl(action: string, params?: Record<string, string | number | boolean>): string {
  const url = new URL(`${API_BASE_URL}/api.php`);
  url.searchParams.set('action', action);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

function buildHeaders(extra?: Record<string, string>): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extra,
  };
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function apiGet<T = ApiResponse>(
  action: string,
  params?: Record<string, string | number | boolean>,
): Promise<T> {
  const response = await fetch(buildUrl(action, params), {
    method: 'GET',
    credentials: 'include',
    headers: buildHeaders(),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

export async function apiPost<T = ApiResponse>(
  action: string,
  body?: unknown,
  params?: Record<string, string | number | boolean>,
): Promise<T> {
  const response = await fetch(buildUrl(action, params), {
    method: 'POST',
    credentials: 'include',
    headers: buildHeaders(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

export async function apiPostFormData<T = ApiResponse>(
  action: string,
  formData: FormData,
  params?: Record<string, string | number | boolean>,
): Promise<T> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const response = await fetch(buildUrl(action, params), {
    method: 'POST',
    credentials: 'include',
    headers,
    body: formData,
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

export async function apiDelete<T = ApiResponse>(
  action: string,
  body?: unknown,
): Promise<T> {
  const response = await fetch(buildUrl(action), {
    method: 'DELETE',
    credentials: 'include',
    headers: buildHeaders(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}
