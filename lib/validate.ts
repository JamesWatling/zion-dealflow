// Reject header-injection (CR/LF), enforce a sane shape and length.
export function validEmail(s: unknown): s is string {
  return (
    typeof s === "string" &&
    s.length <= 254 &&
    !/[\r\n]/.test(s) &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
  );
}

// Same-origin guard for state-changing requests (CSRF defense-in-depth).
// Allows non-browser clients (no Origin) — those must still pass session auth.
export function sameOrigin(req: Request): boolean {
  const sfs = req.headers.get("sec-fetch-site");
  if (sfs) return sfs === "same-origin" || sfs === "none";
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === req.headers.get("host");
  } catch {
    return false;
  }
}
