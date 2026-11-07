import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  ReactNode,
} from "react";

export type NotificationType = "info" | "success" | "warning" | "error";
export type NotificationChannel = "email" | "push" | "sms" | "in_app";

export interface Notification {
  id: string;
  userId: number;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  message: string;
  icon?: string;
  action?: {
    text: string;
    url: string;
  };
  read: boolean;
  createdAt: string;
  expiresAt?: string;
}

export interface NotificationPreferences {
  userId: number;
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  inAppNotifications: boolean;
  orderUpdates: boolean;
  promoEmails: boolean;
  reviewReminders: boolean;
  wishlistDrops: boolean;
  digestFrequency: "immediate" | "daily" | "weekly" | "never";
}

export interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  preferences: NotificationPreferences | null;
  isLoading: boolean;

  // Notification management
  fetchNotifications(): Promise<void>;
  fetchPreferences(): Promise<void>;
  markAsRead(notificationId: string): Promise<void>;
  markAllAsRead(): Promise<void>;
  deleteNotification(notificationId: string): Promise<void>;
  clearAll(): Promise<void>;

  // Notification creation
  sendNotification(
    notification: Omit<Notification, "id" | "userId" | "createdAt">
  ): Promise<void>;

  // Preferences management
  updatePreferences(
    preferences: Partial<NotificationPreferences>
  ): Promise<void>;

  // Real-time notifications
  addNotification(notification: Notification): void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(
  undefined
);

interface NotificationState {
  notifications: Notification[];
  preferences: NotificationPreferences | null;
  isLoading: boolean;
}

type NotificationAction =
  | { type: "SET_NOTIFICATIONS"; payload: Notification[] }
  | { type: "ADD_NOTIFICATION"; payload: Notification }
  | { type: "MARK_AS_READ"; payload: string }
  | { type: "DELETE_NOTIFICATION"; payload: string }
  | { type: "CLEAR_ALL" }
  | { type: "SET_PREFERENCES"; payload: NotificationPreferences }
  | { type: "SET_LOADING"; payload: boolean };

function notificationReducer(
  state: NotificationState,
  action: NotificationAction
): NotificationState {
  switch (action.type) {
    case "SET_NOTIFICATIONS":
      return {
        ...state,
        notifications: action.payload,
      };

    case "ADD_NOTIFICATION":
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
      };

    case "MARK_AS_READ":
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === action.payload ? { ...n, read: true } : n
        ),
      };

    case "DELETE_NOTIFICATION":
      return {
        ...state,
        notifications: state.notifications.filter((n) => n.id !== action.payload),
      };

    case "CLEAR_ALL":
      return {
        ...state,
        notifications: [],
      };

    case "SET_PREFERENCES":
      return {
        ...state,
        preferences: action.payload,
      };

    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload,
      };

    default:
      return state;
  }
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(notificationReducer, {
    notifications: [],
    preferences: null,
    isLoading: false,
  });

  const fetchNotifications = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      // In-app notifications start clean; populated via live user session events
      dispatch({ type: "SET_NOTIFICATIONS", payload: [] });
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, []);

  const fetchPreferences = useCallback(async () => {
    try {
      // Mock data - replace with actual API call
      const mockPreferences: NotificationPreferences = {
        userId: 1,
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: false,
        inAppNotifications: true,
        orderUpdates: true,
        promoEmails: true,
        reviewReminders: true,
        wishlistDrops: true,
        digestFrequency: "daily",
      };

      dispatch({ type: "SET_PREFERENCES", payload: mockPreferences });
    } catch (error) {
      console.error("Failed to fetch preferences:", error);
    }
  }, []);

  const markAsRead = useCallback(async (notificationId: string) => {
    dispatch({ type: "MARK_AS_READ", payload: notificationId });
    // In a real app, would call API to persist
  }, []);

  const markAllAsRead = useCallback(async () => {
    state.notifications.forEach((notif) => {
      if (!notif.read) {
        dispatch({ type: "MARK_AS_READ", payload: notif.id });
      }
    });
  }, [state.notifications]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    dispatch({ type: "DELETE_NOTIFICATION", payload: notificationId });
  }, []);

  const clearAll = useCallback(async () => {
    dispatch({ type: "CLEAR_ALL" });
  }, []);

  const sendNotification = useCallback(
    async (notification: Omit<Notification, "id" | "userId" | "createdAt">) => {
      const newNotif: Notification = {
        ...notification,
        id: `notif_${Date.now()}`,
        userId: 1, // Would get from auth context
        createdAt: new Date().toISOString(),
      };

      dispatch({ type: "ADD_NOTIFICATION", payload: newNotif });

      // In a real app, would send to backend API
      if (notification.channel === "email") {
        console.log("[Email] Sending:", notification.title);
      } else if (notification.channel === "push") {
        // Request notification permission and send
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(notification.title, {
            body: notification.message,
            icon: notification.icon || "/icon.png",
          });
        }
      } else if (notification.channel === "sms") {
        console.log("[SMS] Sending:", notification.message);
      }
    },
    []
  );

  const updatePreferences = useCallback(
    async (prefs: Partial<NotificationPreferences>) => {
      if (state.preferences) {
        const updated = { ...state.preferences, ...prefs };
        dispatch({ type: "SET_PREFERENCES", payload: updated });
        // In a real app, would call API to persist
      }
    },
    [state.preferences]
  );

  const addNotification = useCallback((notification: Notification) => {
    dispatch({ type: "ADD_NOTIFICATION", payload: notification });
  }, []);

  const unreadCount = state.notifications.filter((n) => !n.read).length;

  const value: NotificationContextValue = {
    notifications: state.notifications,
    unreadCount,
    preferences: state.preferences,
    isLoading: state.isLoading,
    fetchNotifications,
    fetchPreferences,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    sendNotification,
    updatePreferences,
    addNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
}
