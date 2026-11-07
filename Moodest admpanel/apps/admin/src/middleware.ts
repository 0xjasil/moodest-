import { NextRequest, NextResponse } from "next/server";

// Routes that do not require authentication
const PUBLIC_PATHS = [
  "/dashboard-login",
  "/auth",
  "/auth-cover",
  "/api/",          // API routes handle their own auth headers
  "/_next/",        // Next.js internals
  "/favicon",
  "/images",
  "/icons",
  "/misc/401",
  "/misc/403",
  "/misc/404",
  "/misc/500",
];

// Token storage key (must match AuthContext)
const TOKEN_COOKIE = "admin_access_token_v1";

// Allowed roles for admin dashboard access
const ADMIN_ROLES = new Set([
  "ADMIN",
  "SUPER_ADMIN",
  "CS_AGENT",
  "OPS",
  "FINANCE",
  "MERCH",
]);

interface JwtPayload {
  sub?: number;
  username?: string;
  role?: string;
  exp?: number;
  tv?: number;
}

/**
 * Converts a Base64Url string to a Uint8Array.
 */
function base64UrlToUint8(str: string): Uint8Array {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const binary = atob(pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Cryptographically verifies HMAC-SHA256 JWT signature using Web Crypto API.
 */
async function verifyJwtSignature(token: string, secret: string): Promise<boolean> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const [headerB64, payloadB64, signatureB64] = parts;
    const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const sig = base64UrlToUint8(signatureB64);
    return await crypto.subtle.verify("HMAC", key, sig as unknown as BufferSource, data);
  } catch {
    return false;
  }
}

/**
 * Decodes and cryptographically verifies JWT structure, signature, and claims in Edge middleware.
 */
async function parseAndValidateJwt(
  token: string,
  secret?: string | undefined
): Promise<{ valid: boolean; payload?: JwtPayload; reason?: string }> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return { valid: false, reason: "invalid_format" };
    }

    // Cryptographic signature check (when secret is available)
    if (secret) {
      const isSigValid = await verifyJwtSignature(token, secret);
      if (!isSigValid) {
        return { valid: false, reason: "invalid_signature" };
      }
    }

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );

    const payload = JSON.parse(jsonPayload) as JwtPayload;

    // Check expiration
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return { valid: false, payload, reason: "expired" };
    }

    // Check role
    if (!payload.role || !ADMIN_ROLES.has(payload.role)) {
      return { valid: false, payload, reason: "forbidden_role" };
    }

    return { valid: true, payload };
  } catch {
    return { valid: false, reason: "parse_error" };
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths through without checking auth
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Retrieve token from cookie
  const token = request.cookies.get(TOKEN_COOKIE)?.value;

  if (!token) {
    const loginUrl = new URL("/dashboard-login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Cryptographically validate token signature and payload
  const jwtSecret = process.env.JWT_SECRET || "";
  const { valid, reason, payload } = await parseAndValidateJwt(token as string, jwtSecret);

  if (!valid) {
    // If user has a valid customer session (role: USER), redirect to 403 Forbidden
    if (reason === "forbidden_role" && payload?.role === "USER") {
      return NextResponse.redirect(new URL("/misc/403", request.url));
    }

    // Otherwise, bogus or expired token — clear cookie and redirect to login
    const loginUrl = new URL("/dashboard-login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete(TOKEN_COOKIE);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
