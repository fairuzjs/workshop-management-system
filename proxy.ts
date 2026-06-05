import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const proxyHandler = auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  // Public routes that don't require authentication
  const publicRoutes = ["/login", "/tracking"];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // Public API routes
  const publicApiRoutes = ["/api/auth", "/api/tracking"];
  const isPublicApi = publicApiRoutes.some((route) => pathname.startsWith(route));

  // Allow public routes and public APIs
  if (isPublicRoute || isPublicApi) {
    // If logged in and trying to access login page, redirect to dashboard
    if (isLoggedIn && pathname === "/login") {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  // Redirect unauthenticated users to login
  if (!isLoggedIn) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export default proxyHandler;
export const proxy = proxyHandler;

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
