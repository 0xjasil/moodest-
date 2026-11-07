// Admin auth types — aligned with NestJS backend responses
// No Prisma dependency.

export interface AdminUser {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: "ADMIN" | "CS_AGENT" | "OPS" | "FINANCE" | "MERCH" | "SUPER_ADMIN";
  createdAt?: string;
}

// Login form data
export interface LoginData {
  email: string;
  password: string;
}

// NestJS login response
export interface LoginResponse {
  access_token: string;
  refresh_token: string;
}

// NestJS token refresh response
export interface RefreshResponse {
  access_token: string;
}
