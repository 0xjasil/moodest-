import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { authAPI } from "@/lib/api";
import {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  clearAuthTokens,
} from "@/lib/apiFetch";
import type { User, Role } from "@/lib/types";

export type { User, Role };

/* ── State & Action Types ─────────────────────────────────────── */

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: "LOGIN_START" }
  | { type: "LOGIN_SUCCESS"; user: User; token: string; refreshToken: string }
  | { type: "LOGIN_ERROR"; error: string }
  | { type: "LOGOUT" }
  | { type: "SET_USER"; user: User | null }
  | { type: "SET_ERROR"; error: string | null }
  | { type: "SET_LOADING"; isLoading: boolean }
  | { type: "UPDATE_TOKEN"; token: string };

export interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;

  // Actions
  login(email: string, password: string): Promise<void>;
  register(
    email: string,
    password: string,
    firstName?: string,
    lastName?: string
  ): Promise<void>;
  logout(): void;
  me(): Promise<void>;
  clearError(): void;
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
      return {
        ...state,
        isLoading: false,
        error: action.error,
        token: null,
        user: null,
      };

    case "LOGOUT":
      return {
        user: null,
        token: null,
        refreshToken: null,
        isLoading: false,
        error: null,
      };

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

/* ── Provider ─────────────────────────────────────────────────── */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    user: null,
    token: null,
    refreshToken: null,
    isLoading: true,
    error: null,
  });

  /* Auto-login on mount by fetching current user if token exists */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

    if (storedToken) {
      (async () => {
        try {
          const user = await authAPI.me();
          dispatch({
            type: "LOGIN_SUCCESS",
            user,
            token: storedToken,
            refreshToken: storedRefreshToken || "",
          });
        } catch {
          // Token invalid or refresh failed
          clearAuthTokens();
          dispatch({ type: "LOGOUT" });
        } finally {
          dispatch({ type: "SET_LOADING", isLoading: false });
        }
      })();
    } else {
      dispatch({ type: "SET_LOADING", isLoading: false });
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    dispatch({ type: "LOGIN_START" });
    try {
      const { access_token, refresh_token } = await authAPI.login(
        email,
        password
      );

      if (typeof window !== "undefined") {
        localStorage.setItem(ACCESS_TOKEN_KEY, access_token);
        localStorage.setItem(REFRESH_TOKEN_KEY, refresh_token);
      }

      // Fetch user profile from /api/users/me
      const user = await authAPI.me();

      dispatch({
        type: "LOGIN_SUCCESS",
        user,
        token: access_token,
        refreshToken: refresh_token,
      });
    } catch (error) {
      clearAuthTokens();
      const message =
        error instanceof Error ? error.message : "Login failed";
      dispatch({ type: "LOGIN_ERROR", error: message });
      throw error;
    }
  }, []);

  const register = useCallback(
    async (
      email: string,
      password: string,
      firstName?: string,
      lastName?: string
    ) => {
      dispatch({ type: "LOGIN_START" });
      try {
        await authAPI.register(email, password, firstName, lastName);
        // Automatically log in after registration
        await login(email, password);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Registration failed";
        dispatch({ type: "LOGIN_ERROR", error: message });
        throw error;
      }
    },
    [login]
  );

  const logout = useCallback(() => {
    clearAuthTokens();
    dispatch({ type: "LOGOUT" });
  }, []);

  const me = useCallback(async () => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!token) {
      dispatch({ type: "SET_USER", user: null });
      return;
    }

    try {
      dispatch({ type: "SET_LOADING", isLoading: true });
      const user = await authAPI.me();
      dispatch({ type: "SET_USER", user });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch user";
      dispatch({ type: "SET_ERROR", error: message });
    } finally {
      dispatch({ type: "SET_LOADING", isLoading: false });
    }
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: "SET_ERROR", error: null });
  }, []);

  const value: AuthContextValue = {
    user: state.user,
    token: state.token,
    isLoading: state.isLoading,
    error: state.error,
    isAuthenticated: state.user !== null && state.token !== null,

    login,
    register,
    logout,
    me,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/* ── Hook ─────────────────────────────────────────────────────── */

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
