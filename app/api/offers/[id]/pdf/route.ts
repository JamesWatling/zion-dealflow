import { NextResponse } from "next/server";
import { getDeal } from "@/lib/store";

export const runtime = "nodejs";

// Serves the offer PDF: redirects to the Blob URL when present, else streams the
// stored base64 (generated locally via `npm run pdf`).
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await getDeal(id);
  if (d?.offer?.pdfUrl) return NextResponse.redirect(d.offer.pdfUrl, 302);
  if (d?.offer?.pdfBase64) {
    return new Response(Buffer.from(d.offer.pdfBase64, "base64") as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="offer-${id}.pdf"`,
      },
    });
  }
  return new Response("No PDF generated for this offer yet.", { status: 404 });
}
