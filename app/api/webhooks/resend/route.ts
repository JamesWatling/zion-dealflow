import { NextResponse } from "next/server";
import { getDealByResendId, updateProperty } from "@/lib/store";
import { verifySvix } from "@/lib/svix";

export const runtime = "nodejs";

// Resend event webhook (Svix-signed). Records delivery problems (bounce/complaint)
// on the matching deal. Reply detection is handled separately by the Cloudflare worker.
export async function POST(req: Request) {
  const body = await req.text();
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (secret) {
    const ok = verifySvix(secret, {
      id: req.headers.get("svix-id") || "",
      timestamp: req.headers.get("svix-timestamp") || "",
      signature: req.headers.get("svix-signature") || "",
    }, body);
    if (!ok) return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  } else if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "RESEND_WEBHOOK_SECRET not configured" }, { status: 503 });
  }

  let evt: { type?: string; data?: { email_id?: string; id?: string } };
  try {
    evt = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const type = evt.type;
  const resendId = evt.data?.email_id || evt.data?.id;
  if (resendId && (type === "email.bounced" || type === "email.complained")) {
    const d = await getDealByResendId(resendId);
    if (d) {
      const flag = `Delivery ${type.replace("email.", "")} (${new Date().toISOString().slice(0, 10)})`;
      await updateProperty(d.id, { notes: d.notes ? `${d.notes} | ${flag}` : flag });
    }
  }
  return NextResponse.json({ ok: true });
}
