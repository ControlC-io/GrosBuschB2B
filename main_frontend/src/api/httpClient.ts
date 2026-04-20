export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface HttpClientConfig {
  baseUrl: string;
  apiKey?: string;
  /**
   * Function that returns the current Bearer token (if any).
   * This is evaluated on every request so it can reflect the latest auth state.
   */
  getToken?: () => string | null;
  /**
   * Optional default timeout (in milliseconds) for all requests.
   * Can be overridden per-request via options.signal if needed.
   */
  defaultTimeoutMs?: number;
}

export interface HttpError extends Error {
  status?: number;
  payload?: unknown;
}

export class HttpRequestError extends Error implements HttpError {
  status?: number;
  payload?: unknown;

  constructor(message: string, status?: number, payload?: unknown) {
    super(message);
    this.name = 'HttpRequestError';
    this.status = status;
    this.payload = payload;
  }
}

export interface RequestOptions extends RequestInit {
  /**
   * Optional query string parameters. Undefined / null values are skipped.
   */
  query?: Record<string, unknown>;
}

export interface HttpClient {
  request<T>(path: string, options?: RequestOptions): Promise<T>;
}

const buildUrl = (baseUrl: string, path: string, query?: Record<string, unknown>): string => {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return new URL(path).toString();
  }

  // When baseUrl includes a path segment (e.g. http://localhost/external-api),
  // we must make the request relative to that path instead of overriding it
  // with an absolute '/graphql'. To do that we join against the base URL
  // with a trailing slash and strip any leading slash from the path.
  const baseHasPath = (() => {
    try {
      const u = new URL(baseUrl);
      return u.pathname && u.pathname !== '/';
    } catch {
      return false;
    }
  })();

  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const normalizedPath = baseHasPath && path.startsWith('/') ? path.slice(1) : path;

  const url = new URL(normalizedPath, normalizedBase);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      // Arrays are expanded as repeated keys: ?key=a&key=b
      if (Array.isArray(value)) {
        value.forEach((v) => {
          if (v === undefined || v === null) return;
          url.searchParams.append(key, String(v));
        });
      } else {
        url.searchParams.set(key, String(value));
      }
    });
  }

  return url.toString();
};

const mergeHeaders = (base: HeadersInit | undefined, extra: HeadersInit | undefined): Headers => {
  const headers = new Headers(base || undefined);
  if (extra) {
    new Headers(extra).forEach((value, key) => {
      headers.set(key, value);
    });
  }
  return headers;
};

const parseResponseBody = async (response: Response): Promise<unknown> => {
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    // If body is empty, this will throw, so we guard with text length check first.
    const text = await response.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      // If JSON parsing fails, return raw text so callers can inspect.
      return text;
    }
  }

  // Fallback to text for non-JSON content types.
  try {
    const text = await response.text();
    return text || null;
  } catch {
    return null;
  }
};

const resolveBaseUrl = (baseUrl: string): string => {
  if (baseUrl.startsWith('http://') || baseUrl.startsWith('https://')) {
    return baseUrl;
  }

  // In the browser we may receive a relative baseUrl (e.g. '/external-api').
  // In that case, resolve it against the current origin so that URL()
  // always receives a valid absolute base URL.
  if (typeof window !== 'undefined' && window.location?.origin) {
    return new URL(baseUrl, window.location.origin).toString();
  }

  // Fallback: return as-is; this keeps Node/SSR from throwing if origin is not available.
  return baseUrl;
};

export const createHttpClient = (config: HttpClientConfig): HttpClient => {
  const { baseUrl, apiKey, getToken, defaultTimeoutMs = 15000 } = config;
  const resolvedBaseUrl = resolveBaseUrl(baseUrl);

  const request = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
    const { query, headers: rawHeaders, signal, ...rest } = options;

    const url = buildUrl(resolvedBaseUrl, path, query);

    const authHeaders: HeadersInit = {};

    if (apiKey) {
      (authHeaders as Record<string, string>)['x-api-key'] = apiKey;
    }

    const token = getToken?.();
    if (token) {
      (authHeaders as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    let headers = mergeHeaders(authHeaders, rawHeaders);

    // Ensure Content-Type is set for JSON bodies when not already specified.
    const method = (rest.method ?? 'GET').toUpperCase() as HttpMethod;
    const hasBody = rest.body !== undefined && rest.body !== null && method !== 'GET' && method !== 'HEAD';
    if (hasBody && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    // Handle timeout with AbortController, but allow caller-provided signal to override.
    let finalSignal: AbortSignal | undefined = signal;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    if (!finalSignal && defaultTimeoutMs > 0) {
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), defaultTimeoutMs);
      finalSignal = controller.signal;
    }

    let response: Response;

    try {
      response = await fetch(url, {
        ...rest,
        method,
        headers,
        signal: finalSignal,
      });
    } catch (err) {
      if (timeoutId) clearTimeout(timeoutId);

      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new HttpRequestError('Request timed out', undefined, null);
      }

      throw new HttpRequestError(
        err instanceof Error ? err.message : 'Network request failed',
        undefined,
        null,
      );
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }

    const payload = await parseResponseBody(response);

    if (!response.ok) {
      // Map common auth statuses to clearer messages, but keep payload for caller.
      if (response.status === 401) {
        throw new HttpRequestError('Unauthorized (401)', 401, payload);
      }
      if (response.status === 403) {
        throw new HttpRequestError('Forbidden (403)', 403, payload);
      }

      const message =
        (payload && typeof payload === 'object' && 'message' in (payload as Record<string, unknown>))
          ? String((payload as { message?: unknown }).message)
          : `HTTP error ${response.status}`;

      throw new HttpRequestError(message, response.status, payload);
    }

    return payload as T;
  };

  return { request };
};

