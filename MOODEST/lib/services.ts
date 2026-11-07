/**
 * Vercel Multi-Services Binding Configuration
 * 
 * In Vercel services deployment, the ADMIN_SERVICE_URL environment variable
 * is injected automatically at runtime via the service binding defined in vercel.json.
 */
export function getAdminServiceUrl(path: string = ""): string {
  const baseUrl =
    process.env.ADMIN_SERVICE_URL ||
    process.env.NEXT_PUBLIC_ADMIN_URL ||
    "http://localhost:3001";

  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl.replace(/\/$/, "")}${cleanPath}`;
}
