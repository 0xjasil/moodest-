// Thin re-export so components can import from @/hooks/use-auth
// instead of the longer @/context/AuthContext path.
export { useAuth } from "@/context/AuthContext";
export type { AdminUser, AuthContextValue } from "@/context/AuthContext";
