import { cookies } from "next/headers";
import { SESSION_COOKIE, authEnabled, verifySession } from "./auth";

// Defense-in-depth session check for Node route handlers (the proxy also gates).
// Returns true when auth is disabled (no APP_PASSWORD) so dev works without a login.
export async function requireSession(): Promise<boolean> {
  // fail closed: in production a missing APP_PASSWORD denies, not opens
  if (!authEnabled()) return process.env.NODE_ENV !== "production";
  const c = await cookies();
  return verifySession(c.get(SESSION_COOKIE)?.value);
}
