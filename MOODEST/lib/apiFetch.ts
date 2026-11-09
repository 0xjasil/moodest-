/** Shared HTTP transport for the NestJS API. */
export const ACCESS_TOKEN_KEY = "moryelle_access_token_v1";
export const REFRESH_TOKEN_KEY = "moryelle_refresh_token_v1";

export class ApiError extends Error {
  constructor(message: string, public readonly status: number, public readonly details?: unknown) {
    super(message);
    this.name = "ApiError";
  }
}

interface ApiFetchOptions extends RequestInit {
  /** Internal guard used for the single retry after a token refresh. */
  skipRefresh?: boolean;
}

function apiOrigin() {
  return (process.env.NEXT_PUBLIC_API_URL || "https://bkndmoodest.vercel.app").replace(/\/$/, "");
}

function apiPrefix() {
  const prefix = process.env.NEXT_PUBLIC_API_PREFIX || "/api";
  if (!prefix || prefix === "/") return "";
  return `/${prefix.replace(/^\/+|\/+$/g, "")}`;
}

/** Accepts both legacy `/api/...` and service `/...` endpoint declarations. */
export function apiUrl(endpoint: string) {
  const normalized = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const prefix = apiPrefix();
  const path = prefix && (normalized === prefix || normalized.startsWith(`${prefix}/`))
    ? normalized
    : `${prefix}${normalized}`;
  return `${apiOrigin()}${path}`;
}

function canUseStorage() {
  return typeof window !== "undefined";
}

export function clearAuthTokens() {
  if (!canUseStorage()) return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

let inFlightRefresh: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (!canUseStorage()) return null;
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) return null;

  if (inFlightRefresh) {
    return inFlightRefresh;
  }

  inFlightRefresh = (async () => {
    try {
      const response = await fetch(apiUrl("/auth/refresh"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (!response.ok) {
        clearAuthTokens();
        return null;
      }
      const payload = await response.json() as { access_token?: string };
      if (!payload.access_token) {
        clearAuthTokens();
        return null;
      }
      localStorage.setItem(ACCESS_TOKEN_KEY, payload.access_token);
      return payload.access_token;
    } catch {
      return null;
    } finally {
      inFlightRefresh = null;
    }
  })();

  return inFlightRefresh;
}

export async function apiFetch(endpoint: string, options: ApiFetchOptions = {}): Promise<Response> {
  const { skipRefresh, headers: requestHeaders, ...requestOptions } = options;
  const headers = new Headers(requestHeaders);
  headers.set("Accept", "application/json");
  if (requestOptions.body && !headers.has("Content-Type") && !(requestOptions.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  const token = canUseStorage() ? localStorage.getItem(ACCESS_TOKEN_KEY) : null;
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const request = () => fetch(apiUrl(endpoint), { ...requestOptions, headers });
  let response = await request();
  if (response.status === 401 && !skipRefresh) {
    const refreshedToken = await refreshAccessToken();
    if (refreshedToken) {
      headers.set("Authorization", `Bearer ${refreshedToken}`);
      response = await request();
    }
  }
  if (response.status === 401) clearAuthTokens();
  return response;
}

export async function apiFetchJson<T>(endpoint: string, options?: ApiFetchOptions): Promise<T> {
  const response = await apiFetch(endpoint, options);
  if (!response.ok) {
    const details = await response.json().catch(() => undefined) as { message?: string | string[] } | undefined;
    const message = Array.isArray(details?.message) ? details.message.join(", ") : details?.message || response.statusText || "Request failed";
    throw new ApiError(message, response.status, details);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
