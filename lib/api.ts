/**
 * Small HTTP client for the Waselni API: JSON in and out, bearer token, and one transparent
 * retry after refreshing the access token when it has expired (401).
 */
import { UploadFile } from './types';

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface TokenStore {
  getAccess: () => string | null;
  getRefresh: () => string | null;
  setAccess: (token: string) => void;
  /** Called when the session cannot be renewed (refresh token expired or revoked). */
  onExpired: () => void;
}

type Query = Record<string, string | number | boolean | null | undefined>;

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Query;
  /** Sends this token instead of the session one (2FA step, refresh). */
  token?: string;
  /** Do not try to refresh the session on 401 (login, 2FA). */
  noRefresh?: boolean;
  file?: UploadFile;
}

export function buildUrl(base: string, path: string, query?: Query): string {
  const qs = Object.entries(query ?? {})
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return `${base}${path}${qs ? `?${qs}` : ''}`;
}

/** Human-readable message from an API error body ({message} from the error handler, or FastAPI's {detail}). */
export function errorMessage(body: unknown, fallback: string): string {
  if (body && typeof body === 'object') {
    const b = body as { message?: unknown; detail?: unknown };
    if (typeof b.message === 'string' && b.message) return b.message;
    if (typeof b.detail === 'string' && b.detail) return b.detail;
    if (Array.isArray(b.detail) && b.detail[0] && typeof b.detail[0].msg === 'string') return b.detail[0].msg;
  }
  return fallback;
}

export function createApi(baseUrl: string, tokens: TokenStore, fetchImpl: typeof fetch = (...a) => fetch(...a)) {
  let refreshing: Promise<boolean> | null = null;

  const refresh = (): Promise<boolean> => {
    const refreshToken = tokens.getRefresh();
    if (!refreshToken) return Promise.resolve(false);
    // Concurrent 401s share the same refresh call.
    refreshing ??= fetchImpl(`${baseUrl}/auth/refresh`, { method: 'POST', headers: { Authorization: `Bearer ${refreshToken}` } })
      .then(async (res) => {
        if (!res.ok) return false;
        const data = (await res.json()) as { access_token?: string };
        if (!data.access_token) return false;
        tokens.setAccess(data.access_token);
        return true;
      })
      .catch(() => false)
      .finally(() => { refreshing = null; });
    return refreshing;
  };

  async function request<T>(path: string, options: RequestOptions = {}, retried = false): Promise<T> {
    const { method = 'GET', body, query, token, noRefresh, file } = options;
    const headers: Record<string, string> = { Accept: 'application/json' };
    const bearer = token ?? tokens.getAccess();
    if (bearer) headers.Authorization = `Bearer ${bearer}`;
    let payload: BodyInit | undefined;
    if (file) {
      const form = new FormData();
      // React Native's FormData accepts {uri, name, type} for local files.
      form.append('file', file as unknown as Blob);
      payload = form;
    } else if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
      payload = JSON.stringify(body);
    }

    let res: Response;
    try {
      res = await fetchImpl(buildUrl(baseUrl, path, query), { method, headers, body: payload });
    } catch {
      throw new ApiError('network', 0);
    }

    if (res.status === 401 && !token && !noRefresh && !retried && tokens.getRefresh()) {
      if (await refresh()) return request<T>(path, options, true);
      tokens.onExpired();
    }
    const text = await res.text();
    let data: unknown = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }
    if (!res.ok) throw new ApiError(errorMessage(data, `HTTP ${res.status}`), res.status);
    return data as T;
  }

  return {
    request,
    get: <T>(path: string, query?: Query) => request<T>(path, { query }),
    post: <T>(path: string, body?: unknown, query?: Query) => request<T>(path, { method: 'POST', body, query }),
    patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
    del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
    upload: <T>(path: string, file: UploadFile, query?: Query) => request<T>(path, { method: 'POST', file, query }),
  };
}

export type Api = ReturnType<typeof createApi>;
