// src/app/api/[...slug]/route.ts
// Proxies all /api/* requests from the admin to the NestJS backend.
// Forwards the Authorization header from:
//   1. An explicit Authorization header on the incoming request (client components)
//   2. The admin_access_token_v1 cookie (server components / Server Actions)
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// Strip the /api prefix when forwarding — NestJS already uses /api globally.
// Admin calls /api/products → proxied to http://localhost:4000/api/products
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
const TOKEN_COOKIE = "admin_access_token_v1";

type RouteParams = { params: Promise<{ slug: string[] }> };

async function proxyToBackend(
  method: string,
  slug: string[],
  request: NextRequest
): Promise<Response> {
  // Reconstruct the path and preserve query parameters
  const path = slug.join("/");
  const search = request.nextUrl.search;
  const url = `${BACKEND_URL}/${path}${search}`;

  // Build headers — start with Content-Type
  const forwardHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // 1. Prefer explicit Authorization header from the request (client-side calls)
  const authHeader = request.headers.get("Authorization");
  if (authHeader) {
    forwardHeaders.Authorization = authHeader;
  } else {
    // 2. Fall back to the cookie set by AuthContext (Server Component calls)
    const cookieStore = await cookies();
    const token = cookieStore.get(TOKEN_COOKIE)?.value;
    if (token) {
      forwardHeaders.Authorization = `Bearer ${token}`;
    }
  }

  // Forward Content-Type if the original request has a different one
  // (e.g., multipart/form-data for file uploads)
  const contentType = request.headers.get("content-type");
  if (contentType && contentType.includes("multipart/form-data")) {
    // Do not set Content-Type — let fetch set the boundary automatically
    delete forwardHeaders["Content-Type"];
  }

  try {
    const options: RequestInit = {
      method,
      headers: forwardHeaders,
    };

    // Include body for non-GET/DELETE requests
    if (method !== "GET" && method !== "DELETE") {
      if (contentType?.includes("multipart/form-data")) {
        options.body = await request.blob();
      } else {
        const text = await request.text();
        if (text) options.body = text;
      }
    }

    const response = await fetch(url, options);

    // For binary responses (PDF, CSV) pass through the raw body
    const responseContentType = response.headers.get("content-type") ?? "";
    if (
      responseContentType.includes("application/pdf") ||
      responseContentType.includes("text/csv") ||
      responseContentType.includes("application/octet-stream")
    ) {
      const buffer = await response.arrayBuffer();
      return new NextResponse(buffer, {
        status: response.status,
        headers: { "Content-Type": responseContentType },
      });
    }

    // JSON responses
    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error(`[Admin Proxy Error] ${method} ${url}:`, error);
    return NextResponse.json(
      { error: "Backend service unavailable", url },
      { status: 503 }
    );
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { slug } = await params;
  return proxyToBackend("GET", slug, request);
}
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { slug } = await params;
  return proxyToBackend("POST", slug, request);
}
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { slug } = await params;
  return proxyToBackend("PUT", slug, request);
}
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { slug } = await params;
  return proxyToBackend("PATCH", slug, request);
}
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { slug } = await params;
  return proxyToBackend("DELETE", slug, request);
}
