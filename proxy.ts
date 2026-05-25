import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Next.js 16 uses proxy.ts instead of middleware.ts
// Proxy runs at the edge — cannot use Prisma or heavy Node.js libs here.
// Auth checks are done in server components / route handlers via lib/auth.ts

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes — always allow
  const publicPaths = ["/login", "/tracking", "/api/auth", "/api/tracking"];
  const isPublic = publicPaths.some((path) => pathname.startsWith(path));

  if (isPublic) {
    return NextResponse.next();
  }

  // Check for auth session cookie (NextAuth v5 uses authjs.session-token)
  const sessionToken =
    request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("__Secure-authjs.session-token")?.value;

  if (!sessionToken) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except static assets
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
