// WebCrypto-based session helpers — work in both the Node and Edge/proxy runtimes
// (no node:crypto import). Single-user password gate via APP_PASSWORD.
export const SESSION_COOKIE = "zdf_session";
const SALT = "zion-dealflow-session-v1";

export function authEnabled(): boolean {
  return Boolean(process.env.APP_PASSWORD);
}

// constant-time string compare
export function ctEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

async function hmac(password: string, msg: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(msg));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// Session cookie = "<issuedAt>.<hmac(password, SALT:issuedAt)>" — carries an
// expiry and rotates when APP_PASSWORD changes (invalidates old cookies).
export async function issueSession(): Promise<string> {
  const ts = Date.now().toString();
  return `${ts}.${await hmac(process.env.APP_PASSWORD || "", `${SALT}:${ts}`)}`;
}

export function verifyPassword(input: string): boolean {
  const expected = process.env.APP_PASSWORD;
  return Boolean(expected) && ctEqual(input, expected!);
}

export async function verifySession(cookieValue: string | undefined): Promise<boolean> {
  if (!process.env.APP_PASSWORD || !cookieValue) return false;
  const dot = cookieValue.indexOf(".");
  if (dot < 1) return false;
  const ts = cookieValue.slice(0, dot);
  const sig = cookieValue.slice(dot + 1);
  const n = Number(ts);
  // reject non-integers, negatives, expired, and future-issued (beyond small skew)
  if (!Number.isSafeInteger(n) || n < 0 || Date.now() - n > MAX_AGE_MS || n > Date.now() + 60_000) return false;
  return ctEqual(sig, await hmac(process.env.APP_PASSWORD || "", `${SALT}:${ts}`));
}
