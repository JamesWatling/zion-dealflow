import { getDeal } from "@/lib/store";

export const runtime = "nodejs";

// Serves the stored offer PDF (generated locally via `npm run pdf`).
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await getDeal(id);
  if (!d?.offer?.pdfBase64) {
    return new Response("No PDF generated for this offer yet.", { status: 404 });
  }
  const buf = Buffer.from(d.offer.pdfBase64, "base64");
  return new Response(buf as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="offer-${id}.pdf"`,
    },
  });
}
