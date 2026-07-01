import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, authEnabled, verifySession } from "@/lib/auth";

// Public routes: login flow + the ingest webhook (which uses its own shared secret).
// /api/ingest and /api/cron use their own secrets (not the session cookie).
const PUBLIC = ["/login", "/api/login", "/api/logout", "/api/ingest", "/api/cron"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public routes carry their own secrets (cron/ingest) or are the login flow —
  // checked first so the APP_PASSWORD gate never blocks them.
  if (PUBLIC.some((p) => pathname === p || pathname.startsWith(p + "/"))) return NextResponse.next();

  if (!authEnabled()) {
    // fail closed in production: a missing APP_PASSWORD must not silently open the app
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "auth not configured (set APP_PASSWORD)" }, { status: 503 });
    }
    return NextResponse.next(); // dev convenience
  }

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
