// src/middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { betterFetch } from "@better-fetch/fetch";
import { SessionResponse } from "@/types/auth";

export async function middleware(request: NextRequest) {
  const baseURL =
    process.env.BETTER_AUTH_URL || "http://localhost:3000";

  const { data: session } = await betterFetch<SessionResponse>(
    "/api/auth/get-session",
    {
      baseURL,
      headers: {
        cookie: request.headers.get("cookie") || "", // Forward cookies
      },
    },
  );

  const pathname = request.nextUrl.pathname;

  // Public routes (no session required)
  const publicRoutes = [
    "/",
    "/login",
    "/sign-up",
    "/dashboard-login",
    "/forgot-password",
    "/reset-password",
    "/contact",
    "/our-story",
    "/product",
    "/shop",
    "/local-cart" // Add local-cart to public routes
    // Note: Removed "/cart" from here
  ];

  const isPublic = publicRoutes.some((route) =>
    pathname === route || pathname.startsWith(route + "/")
  );

  if (isPublic) {
    return NextResponse.next();
  }

  // Special handling for /cart route
  if (pathname === '/cart') {
    if (!session) {
      console.log("Redirecting to local cart");
      return NextResponse.redirect(new URL("/local-cart", request.url));
    }
    // If user is logged in, allow access to /cart
    return NextResponse.next();
  }

  // If no session, redirect to login for protected routes
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // ✅ Safe to destructure now
  const { user } = session;

  // Restrict admin routes
  if (pathname.startsWith("/admin") && user.role !== "admin") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|map)$).*)",
  ],
};