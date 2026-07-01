// Sends an offer email via Resend with the offer PDF attached.
const buyer = () => ({
  name: process.env.BUYER_NAME || "Zion Property Acquisitions",
  email: process.env.BUYER_EMAIL || "info@zionpropertyacquisitions.com",
});

const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]!));

export interface SendOpts {
  to: string;
  subject: string;
  text: string;
  dealId?: string; // tags reply-to as reply+<id>@ so the Cloudflare worker can attribute replies
  pdfUrl?: string; // Vercel Blob URL (preferred — Resend fetches it)
  pdfBase64?: string; // fallback
  filename?: string;
}

export async function sendOfferEmail(opts: SendOpts): Promise<string> {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY not set");
  const b = buyer();

  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#222">${opts.text
    .split("\n")
    .map((l) => esc(l))
    .join("<br>")}</div>`;

  const domain = b.email.split("@")[1] || "zionpropertyacquisitions.com";
  const replyTo = opts.dealId ? `reply+${opts.dealId}@${domain}` : b.email;

  const body: Record<string, unknown> = {
    from: `${b.name} <${b.email}>`,
    to: [opts.to],
    reply_to: replyTo,
    subject: opts.subject,
    text: opts.text,
    html,
  };
  if (opts.pdfUrl) {
    body.attachments = [{ filename: opts.filename || "offer.pdf", path: opts.pdfUrl }];
  } else if (opts.pdfBase64) {
    body.attachments = [{ filename: opts.filename || "offer.pdf", content: opts.pdfBase64 }];
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const out = (await res.json().catch(() => ({}))) as { id?: string };
  if (!res.ok) throw new Error(`resend ${res.status}: ${JSON.stringify(out).slice(0, 300)}`);
  if (!out.id) throw new Error("resend returned no id");
  return out.id;
}
