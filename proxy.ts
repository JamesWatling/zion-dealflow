import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, authEnabled, verifySession } from "@/lib/auth";

// Public routes: login flow + the ingest webhook (which uses its own shared secret).
const PUBLIC = ["/login", "/api/login", "/api/logout", "/api/ingest"];

export async function proxy(req: NextRequest) {
  if (!authEnabled()) {
    // fail closed in production: a missing APP_PASSWORD must not silently open the app
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "auth not configured (set APP_PASSWORD)" }, { status: 503 });
    }
    return NextResponse.next(); // dev convenience
  }

  const { pathname } = req.nextUrl;
  if (PUBLIC.some((p) => pathname === p || pathname.startsWith(p + "/"))) return NextResponse.next();

  const ok = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (ok) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
