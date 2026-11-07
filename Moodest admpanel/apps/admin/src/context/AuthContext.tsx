"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  ReactNode,
} from "react";

/* ── Types ────────────────────────────────────────────────────── */
export interface AdminUser {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: "ADMIN" | "CS_AGENT" | "OPS" | "FINANCE" | "MERCH" | "SUPER_ADMIN";
  avatar?: string;
  image?: string;
}

interface AuthState {
  user: AdminUser | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: "LOGIN_START" }
  | { type: "LOGIN_SUCCESS"; user: AdminUser; token: string; refreshToken: string }
  | { type: "LOGIN_ERROR"; error: string }
  | { type: "LOGOUT" }
  | { type: "SET_USER"; user: AdminUser | null }
  | { type: "SET_ERROR"; error: string | null }
  | { type: "SET_LOADING"; isLoading: boolean }
  | { type: "UPDATE_TOKEN"; token: string };

export interface AuthContextValue {
  user: AdminUser | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;

  login(email: string, password: string): Promise<void>;
  logout(): void;
  me(): Promise<void>;
  clearError(): void;
}

/* ── Storage keys ─────────────────────────────────────────────── */
const TOKEN_KEY = "admin_access_token_v1";
const REFRESH_TOKEN_KEY = "admin_refresh_token_v1";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

const ADMIN_ROLES = ["ADMIN", "CS_AGENT", "OPS", "FINANCE", "MERCH", "SUPER_ADMIN"] as const;

/* ── Cookie helpers — keeps middleware in sync ───────────────── */
function setTokenCookie(token: string) {
  // SameSite=Strict prevents CSRF; httpOnly cannot be set from JS.
  // Secure flag is dynamically applied when loaded over HTTPS.
  const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
  document.cookie = `${TOKEN_KEY}=${token}; path=/; SameSite=Strict; max-age=900${isSecure ? "; Secure" : ""}`;
}

function clearTokenCookie() {
  const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
  document.cookie = `${TOKEN_KEY}=; path=/; SameSite=Strict; max-age=0${isSecure ? "; Secure" : ""}`;
}

/* ── Reducer ──────────────────────────────────────────────────── */
function reducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "LOGIN_START":
      return { ...state, isLoading: true, error: null };
    case "LOGIN_SUCCESS":
      return {
        ...state,
        user: action.user,
        token: action.token,
        refreshToken: action.refreshToken,
        isLoading: false,
        error: null,
      };
    case "LOGIN_ERROR":
      return { ...state, isLoading: false, error: action.error, token: null, user: null };
    case "LOGOUT":
      return { user: null, token: null, refreshToken: null, isLoading: false, error: null };
    case "SET_USER":
      return { ...state, user: action.user };
    case "SET_ERROR":
      return { ...state, error: action.error };
    case "SET_LOADING":
      return { ...state, isLoading: action.isLoading };
    case "UPDATE_TOKEN":
      return { ...state, token: action.token };
    default:
      return state;
  }
}

/* ── Context ──────────────────────────────────────────────────── */
const AuthContext = createContext<AuthContextValue | null>(null);

/* ── Token refresh helper ────────────────────────────────────── */
async function attemptTokenRefresh(refreshToken: string): Promise<string | null> {
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken, refresh_token: refreshToken }),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as any;
    return body.access_token || body.data?.access_token || body.data?.accessToken || null;
  } catch {
    return null;
  }
}

/* ── Provider ─────────────────────────────────────────────────── */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    user: null,
    token: null,
    refreshToken: null,
    isLoading: true,
    error: null,
  });

  /* On mount: restore session from localStorage */
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

    if (!storedToken || !storedRefreshToken) {
      dispatch({ type: "SET_LOADING", isLoading: false });
      return;
    }

    (async () => {
      try {
        // Validate current token by fetching profile
        const res = await fetch(`${API_URL}/users/me`, {
          headers: { Authorization: `Bearer ${storedToken}` },
        });

        if (res.ok) {
          const rawMe = (await res.json()) as any;
          const user: AdminUser = rawMe.data || rawMe;
          setTokenCookie(storedToken);
          dispatch({ type: "LOGIN_SUCCESS", user, token: storedToken, refreshToken: storedRefreshToken });
          return;
        }

        // Access token expired — try refresh
        if (res.status === 401) {
          const newToken = await attemptTokenRefresh(storedRefreshToken);
          if (newToken) {
            localStorage.setItem(TOKEN_KEY, newToken);
            setTokenCookie(newToken);

            const meRes = await fetch(`${API_URL}/users/me`, {
              headers: { Authorization: `Bearer ${newToken}` },
            });
            if (meRes.ok) {
              const rawMe = (await meRes.json()) as any;
              const user: AdminUser = rawMe.data || rawMe;
              dispatch({ type: "LOGIN_SUCCESS", user, token: newToken, refreshToken: storedRefreshToken });
              return;
            }
          }
        }

        // All attempts failed — clear session
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        clearTokenCookie();
        dispatch({ type: "LOGOUT" });
      } catch {
        // Network error — clear session and force re-login
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        clearTokenCookie();
        dispatch({ type: "LOGOUT" });
      } finally {
        dispatch({ type: "SET_LOADING", isLoading: false });
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    dispatch({ type: "LOGIN_START" });
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { message?: string };
        throw new Error(body.message || "Invalid credentials");
      }

      const rawLogin = (await res.json()) as any;
      const access_token =
        rawLogin.access_token ||
        rawLogin.accessToken ||
        rawLogin.data?.access_token ||
        rawLogin.data?.accessToken;
      const refresh_token =
        rawLogin.refresh_token ||
        rawLogin.refreshToken ||
        rawLogin.data?.refresh_token ||
        rawLogin.data?.refreshToken;

      if (!access_token) {
        throw new Error("No access token returned from backend");
      }

      // Fetch the actual user profile to get role + details
      const meRes = await fetch(`${API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      if (!meRes.ok) {
        throw new Error("Failed to fetch admin profile");
      }

      const rawMe = (await meRes.json()) as any;
      const user: AdminUser = rawMe.data || rawMe;

      // Enforce admin-only access
      if (!ADMIN_ROLES.includes(user.role as typeof ADMIN_ROLES[number])) {
        throw new Error("Access denied. Admin role required.");
      }

      // Persist tokens
      localStorage.setItem(TOKEN_KEY, access_token);
      localStorage.setItem(REFRESH_TOKEN_KEY, refresh_token);
      setTokenCookie(access_token);

      dispatch({ type: "LOGIN_SUCCESS", user, token: access_token, refreshToken: refresh_token });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed";
      dispatch({ type: "LOGIN_ERROR", error: message });
      throw error; // re-throw so the form can show the error
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    clearTokenCookie();
    dispatch({ type: "LOGOUT" });
  }, []);

  const me = useCallback(async () => {
    const token = state.token ?? localStorage.getItem(TOKEN_KEY);
    if (!token) {
      dispatch({ type: "SET_USER", user: null });
      return;
    }

    try {
      dispatch({ type: "SET_LOADING", isLoading: true });
      const res = await fetch(`${API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const user: AdminUser = await res.json();
        dispatch({ type: "SET_USER", user });
      } else if (res.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        clearTokenCookie();
        dispatch({ type: "LOGOUT" });
      }
    } catch {
      // ignore network errors silently
    } finally {
      dispatch({ type: "SET_LOADING", isLoading: false });
    }
  }, [state.token]);

  const clearError = useCallback(() => {
    dispatch({ type: "SET_ERROR", error: null });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user: state.user,
        token: state.token,
        isLoading: state.isLoading,
        error: state.error,
        isAuthenticated: state.user !== null && state.token !== null,
        login,
        logout,
        me,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/* ── Hook ─────────────────────────────────────────────────────── */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
