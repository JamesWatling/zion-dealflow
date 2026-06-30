import { NextResponse } from "next/server";
import { getDeal, updateProperty } from "@/lib/store";
import { requireSession } from "@/lib/route-auth";
import { sameOrigin, validEmail } from "@/lib/validate";

export const runtime = "nodejs";

// Strip control chars. subject: drop all control (incl newlines). body: keep tab (0x09) + newline (0x0a).
const stripLine = (s: string) =>
  [...s].filter((c) => c.charCodeAt(0) >= 0x20 && c.charCodeAt(0) !== 0x7f).join("");
const stripText = (s: string) =>
  [...s]
    .filter((c) => {
      const x = c.charCodeAt(0);
      return x === 0x09 || x === 0x0a || (x >= 0x20 && x !== 0x7f);
    })
    .join("");

// Edit a draft offer (subject / recipient / body) before sending.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(await requireSession())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!sameOrigin(req)) return NextResponse.json({ error: "bad origin" }, { status: 403 });

  const d = await getDeal(id);
  if (!d?.offer) return NextResponse.json({ error: "no offer" }, { status: 404 });
  if (d.offer.status === "sent" || d.offer.status === "sending") {
    return NextResponse.json({ error: "offer already sent" }, { status: 409 });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const offer = { ...d.offer };
  if (typeof body.subject === "string") offer.subject = stripLine(body.subject).slice(0, 300);
  if (typeof body.emailBody === "string") offer.emailBody = stripText(body.emailBody).slice(0, 20000);
  if (typeof body.recipient === "string") {
    const r = body.recipient.trim();
    if (r && !validEmail(r)) return NextResponse.json({ error: "invalid recipient email" }, { status: 422 });
    offer.recipient = r;
  }

  await updateProperty(id, { offer });
  return NextResponse.json({ ok: true });
}
