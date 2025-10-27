import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Define protected routes that require authentication
const protectedRoutes = [
  "/dashboard",
  "/scan-file",
  "/my-scans",
  "/risk-reports",
  "/vulnerability-scan",
  "/attack-monitoring",
  "/data-poisoning",
  "/jailbreaks",
  "/prompt-hardening",
  "/hardening-tools",
  "/system-monitor",
];

// Define public routes that don't require authentication
const publicRoutes = [
  "/landing",
  "/login",
  "/auth/google",
  "/auth/github",
  "/auth/success",
  "/auth/error",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Get auth token from cookies
  const authToken = request.cookies.get("auth_token")?.value;

  // If accessing a protected route without auth token, redirect to login with redirect parameter
  if (isProtectedRoute && !authToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If accessing login page with auth token, redirect to dashboard
  if (pathname === "/login" && authToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // If accessing landing page with auth token, redirect to dashboard
  if (pathname === "/landing" && authToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // If accessing root path, redirect based on auth status
  if (pathname === "/") {
    if (authToken) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    } else {
      return NextResponse.redirect(new URL("/landing", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
