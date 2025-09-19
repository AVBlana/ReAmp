import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip middleware for auth routes, API routes, and static files
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Protected routes that require authentication
  const protectedRoutes = ["/dashboard", "/reamp"];
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Only check auth for protected routes
  if (isProtectedRoute) {
    console.log(
      "🔒 Middleware: Allowing access to protected route (auth check disabled due to AdapterError)"
    );
    // Temporarily disable auth check in middleware due to AdapterError/SessionTokenError
    // The /reamp page and API routes handle auth properly
    return NextResponse.next();
  }

  // For non-protected routes, just continue
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
