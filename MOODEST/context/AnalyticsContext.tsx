import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  ReactNode,
} from "react";

export interface PageView {
  path: string;
  timestamp: string;
  duration: number; // in seconds
  referrer?: string;
  device: "mobile" | "desktop" | "tablet";
}

export interface UserSession {
  sessionId: string;
  userId: number;
  startTime: string;
  endTime?: string;
  pageViews: PageView[];
  totalDuration: number; // in seconds
  deviceType: "mobile" | "desktop" | "tablet";
}

export interface AnalyticsContextValue {
  sessions: UserSession[];
  currentSession: UserSession | null;
  isTrackingEnabled: boolean;

  // Session management
  startSession(): void;
  endSession(): void;
  trackPageView(
    path: string,
    referrer?: string,
    duration?: number
  ): void;
  trackEvent(eventName: string, eventData: Record<string, any>): void;
  trackPurchase(
    orderId: number,
    amount: number,
    items: number
  ): void;

  // Utilities
  getSessionDuration(): number;
  enableTracking(): void;
  disableTracking(): void;
}

const AnalyticsContext = createContext<AnalyticsContextValue | undefined>(
  undefined
);

interface AnalyticsState {
  sessions: UserSession[];
  currentSession: UserSession | null;
  isTrackingEnabled: boolean;
}

type AnalyticsAction =
  | { type: "START_SESSION"; payload: UserSession }
  | { type: "END_SESSION" }
  | { type: "ADD_PAGE_VIEW"; payload: PageView }
  | { type: "TRACK_EVENT"; payload: { eventName: string; data: Record<string, any> } }
  | { type: "ENABLE_TRACKING" }
  | { type: "DISABLE_TRACKING" };

function analyticsReducer(state: AnalyticsState, action: AnalyticsAction): AnalyticsState {
  switch (action.type) {
    case "START_SESSION": {
      return {
        ...state,
        currentSession: action.payload,
        sessions: [...state.sessions, action.payload],
      };
    }

    case "END_SESSION": {
      if (!state.currentSession) return state;

      const endedSession = {
        ...state.currentSession,
        endTime: new Date().toISOString(),
        totalDuration: Math.floor(
          (new Date().getTime() - new Date(state.currentSession.startTime).getTime()) / 1000
        ),
      };

      return {
        ...state,
        currentSession: null,
        sessions: state.sessions.map((s) =>
          s.sessionId === endedSession.sessionId ? endedSession : s
        ),
      };
    }

    case "ADD_PAGE_VIEW": {
      if (!state.currentSession) return state;

      const updatedSession = {
        ...state.currentSession,
        pageViews: [...state.currentSession.pageViews, action.payload],
      };

      return {
        ...state,
        currentSession: updatedSession,
        sessions: state.sessions.map((s) =>
          s.sessionId === updatedSession.sessionId ? updatedSession : s
        ),
      };
    }

    case "TRACK_EVENT": {
      // Event tracking would typically be sent to analytics service
      // For now, just log it
      if (typeof window !== "undefined") {
        console.log(`[Analytics] Event: ${action.payload.eventName}`, action.payload.data);
      }
      return state;
    }

    case "ENABLE_TRACKING": {
      return {
        ...state,
        isTrackingEnabled: true,
      };
    }

    case "DISABLE_TRACKING": {
      return {
        ...state,
        isTrackingEnabled: false,
      };
    }

    default:
      return state;
  }
}

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(analyticsReducer, {
    sessions: [],
    currentSession: null,
    isTrackingEnabled: true,
  });

  const getDeviceType = useCallback((): "mobile" | "desktop" | "tablet" => {
    if (typeof window === "undefined") return "desktop";

    const width = window.innerWidth;
    if (width < 768) return "mobile";
    if (width < 1024) return "tablet";
    return "desktop";
  }, []);

  const startSession = useCallback(() => {
    if (!state.isTrackingEnabled) return;

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const userId = typeof window !== "undefined" && (window as any).__userId ? (window as any).__userId : 0;

    const newSession: UserSession = {
      sessionId,
      userId,
      startTime: new Date().toISOString(),
      pageViews: [],
      totalDuration: 0,
      deviceType: getDeviceType(),
    };

    dispatch({ type: "START_SESSION", payload: newSession });

    // Track initial page view
    if (typeof window !== "undefined") {
      trackPageView(window.location.pathname);
    }
  }, [state.isTrackingEnabled, getDeviceType]);

  const endSession = useCallback(() => {
    dispatch({ type: "END_SESSION" });
  }, []);

  const trackPageView = useCallback(
    (path: string, referrer?: string, duration: number = 0) => {
      if (!state.isTrackingEnabled || !state.currentSession) return;

      const pageView: PageView = {
        path,
        timestamp: new Date().toISOString(),
        duration,
        referrer,
        device: getDeviceType(),
      };

      dispatch({ type: "ADD_PAGE_VIEW", payload: pageView });
    },
    [state.isTrackingEnabled, state.currentSession, getDeviceType]
  );

  const trackEvent = useCallback(
    (eventName: string, eventData: Record<string, any>) => {
      if (!state.isTrackingEnabled) return;

      dispatch({
        type: "TRACK_EVENT",
        payload: { eventName, data: eventData },
      });

      // Send to external analytics service
      if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag("event", eventName, eventData);
      }
    },
    [state.isTrackingEnabled]
  );

  const trackPurchase = useCallback(
    (orderId: number, amount: number, items: number) => {
      if (!state.isTrackingEnabled) return;

      trackEvent("purchase", {
        orderId,
        amount,
        items,
        timestamp: new Date().toISOString(),
      });
    },
    [state.isTrackingEnabled, trackEvent]
  );

  const getSessionDuration = useCallback((): number => {
    if (!state.currentSession) return 0;

    const now = new Date().getTime();
    const startTime = new Date(state.currentSession.startTime).getTime();
    return Math.floor((now - startTime) / 1000); // in seconds
  }, [state.currentSession]);

  const enableTracking = useCallback(() => {
    dispatch({ type: "ENABLE_TRACKING" });
  }, []);

  const disableTracking = useCallback(() => {
    dispatch({ type: "DISABLE_TRACKING" });
  }, []);

  const value: AnalyticsContextValue = {
    sessions: state.sessions,
    currentSession: state.currentSession,
    isTrackingEnabled: state.isTrackingEnabled,
    startSession,
    endSession,
    trackPageView,
    trackEvent,
    trackPurchase,
    getSessionDuration,
    enableTracking,
    disableTracking,
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics(): AnalyticsContextValue {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error("useAnalytics must be used within an AnalyticsProvider");
  }
  return context;
}
