"use client";

import { QueryClient } from "@tanstack/react-query";

// Singleton QueryClient for the admin application.
// Shared across all components via QueryClientProvider in app/layout.tsx.
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data is considered fresh for 60 seconds — avoids redundant refetches
        // when navigating between admin pages.
        staleTime: 60 * 1000,
        // Retry once on failure; most API errors are not transient.
        retry: 1,
        // Do not refetch on window focus in admin — avoids noisy background
        // requests while admins have the tab open in the background.
        refetchOnWindowFocus: false,
      },
      mutations: {
        // Do not retry mutations — side effects should not be duplicated.
        retry: false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

/**
 * Returns a stable QueryClient instance.
 * - On the server: always creates a new client (avoids shared state).
 * - In the browser: reuses the same instance across renders.
 */
export function getQueryClient() {
  if (typeof window === "undefined") {
    return makeQueryClient();
  }
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}
