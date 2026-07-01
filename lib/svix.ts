import { createHmac, timingSafeEqual } from "node:crypto";

// Verify a Svix-signed webhook (Resend uses Svix). secret is the "whsec_..." value.
export function verifySvix(
  secret: string,
  headers: { id: string; timestamp: string; signature: string },
  body: string,
  toleranceSec = 300,
): boolean {
  if (!secret || !headers.id || !headers.timestamp || !headers.signature) return false;
  // reject stale/future timestamps to prevent replay
  const ts = Number(headers.timestamp);
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > toleranceSec) return false;
  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const signedContent = `${headers.id}.${headers.timestamp}.${body}`;
  const expected = createHmac("sha256", key).update(signedContent).digest("base64");
  const expectedBuf = Buffer.from(expected);
  // signature header is space-separated "v1,<base64sig>" entries
  return headers.signature.split(" ").some((part) => {
    const sig = part.split(",")[1];
    if (!sig) return false;
    const got = Buffer.from(sig);
    return got.length === expectedBuf.length && timingSafeEqual(got, expectedBuf);
  });
}
