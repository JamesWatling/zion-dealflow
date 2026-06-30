import { NextResponse } from "next/server";
import { getDeal, updateProperty, claimOfferForSend } from "@/lib/store";
import { sendOfferEmail } from "@/lib/email";
import { requireSession } from "@/lib/route-auth";
import { sameOrigin, validEmail } from "@/lib/validate";

export const runtime = "nodejs";

// Approve & send: emails the offer (PDF attached) via Resend, then records status.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(await requireSession())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!sameOrigin(req)) return NextResponse.json({ error: "bad origin" }, { status: 403 });

  const d = await getDeal(id);
  if (!d?.offer) return NextResponse.json({ error: "no offer to send" }, { status: 404 });

  const to = d.offer.recipient || d.contact?.email;
  if (!validEmail(to)) return NextResponse.json({ error: "no valid recipient email" }, { status: 422 });
  if (!d.offer.subject?.trim() || !d.offer.emailBody?.trim()) {
    return NextResponse.json({ error: "subject and body required" }, { status: 422 });
  }

  // atomic reservation — only one caller wins, preventing duplicate sends
  if (!(await claimOfferForSend(id))) {
    return NextResponse.json({ error: "already sent or sending" }, { status: 409 });
  }

  try {
    const resendId = await sendOfferEmail({
      to,
      subject: d.offer.subject,
      text: d.offer.emailBody,
      pdfBase64: d.offer.pdfBase64,
      filename: `offer-${id}.pdf`,
    });
    const now = new Date().toISOString();
    await updateProperty(id, {
      offer: { ...d.offer, status: "sent", approvedAt: now, sentAt: now, resendId },
      stage: "sent",
    });
    return NextResponse.json({ ok: true, resendId });
  } catch (e) {
    console.error("[send] failed", e);
    // release the reservation so it can be retried
    await updateProperty(id, { offer: { ...d.offer, status: "draft" } });
    return NextResponse.json({ error: e instanceof Error ? e.message : "send failed" }, { status: 502 });
  }
}
