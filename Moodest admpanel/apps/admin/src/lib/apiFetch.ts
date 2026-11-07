/**
 * Admin API Fetch Utility with JWT Token Management
 * 
 * Automatically:
 * - Normalizes endpoints (handles both '/products' and '/api/products')
 * - Injects Authorization Bearer token from localStorage
 * - Handles 401 responses by attempting token refresh
 * - Redirects to login on token expiration
 * - Retries failed requests with new tokens
 */

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
const TOKEN_KEY = "admin_access_token_v1";
const REFRESH_TOKEN_KEY = "admin_refresh_token_v1";

export interface ApiFetchOptions extends RequestInit {
  skipRefresh?: boolean; // Skip refresh attempt on 401
}

/**
 * Refresh the access token using the refresh token
 */
async function refreshAccessToken(): Promise<string | null> {
  try {
    const refreshToken =
      typeof window !== "undefined"
        ? localStorage.getItem(REFRESH_TOKEN_KEY)
        : null;
    if (!refreshToken) {
      return null;
    }

    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) {
      if (typeof window !== "undefined") {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
      }
      return null;
    }

    const { access_token } = await res.json();
    if (typeof window !== "undefined") {
      localStorage.setItem(TOKEN_KEY, access_token);
    }
    return access_token;
  } catch (error) {
    console.error("[apiFetch] Token refresh error:", error);
    return null;
  }
}

/**
 * Normalizes an API path ensuring single `/api` prefix
 */
function normalizePath(endpoint: string): string {
  if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
    return endpoint;
  }
  let clean = endpoint.trim();
  if (clean.startsWith("/api/")) {
    clean = clean.slice(4);
  } else if (clean === "/api") {
    clean = "";
  }
  if (!clean.startsWith("/")) {
    clean = `/${clean}`;
  }
  // In browser, route via local Next.js /api proxy to prevent CORS issues with backend
  if (typeof window !== "undefined") {
    return `/api${clean}`;
  }
  return `${API_URL}${clean}`;
}

/**
 * Main API fetch function with JWT and auto-refresh
 * @param endpoint - API endpoint (e.g., "/products" or "/api/products")
 * @param options - Fetch options (method, body, headers, etc.)
 * @returns Response from API
 */
export async function apiFetch(
  endpoint: string,
  options?: ApiFetchOptions
): Promise<Response> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options?.headers as Record<string, string>) || {}),
  };

  // Inject JWT token if available
  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  const url = normalizePath(endpoint);

  let res = await fetch(url, {
    ...options,
    headers,
  });

  // If 401 and we have a refresh token, try to refresh and retry
  if (res.status === 401 && !options?.skipRefresh) {
    const newToken = await refreshAccessToken();

    if (newToken) {
      headers.Authorization = `Bearer ${newToken}`;
      res = await fetch(url, {
        ...options,
        headers,
        skipRefresh: true, // Prevent infinite loop
      } as ApiFetchOptions);
    } else {
      if (typeof window !== "undefined") {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        window.location.href = "/dashboard-login";
      }
    }
  }

  // Final 401 = no token or refresh failed, redirect to login
  if (res.status === 401 && typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    window.location.href = "/dashboard-login";
  }

  return res;
}

/**
 * Convenience wrapper for JSON responses
 */
export async function apiFetchJson<T>(
  endpoint: string,
  options?: ApiFetchOptions
): Promise<T> {
  const res = await apiFetch(endpoint, options);

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || `API Error: ${res.status}`);
  }

  return res.json();
}
