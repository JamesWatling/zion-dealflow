import { NextResponse } from "next/server";
import { markReplied } from "@/lib/store";
import { checkSecret } from "@/lib/api";

export const runtime = "nodejs";

// Called by the Cloudflare reply worker when a seller replies to reply+<id>@.
// Moves the deal to "replied". Auth: shared INGEST_SECRET.
export async function POST(req: Request) {
  if (!checkSecret(req.headers.get("x-ingest-secret"), process.env.INGEST_SECRET)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { dealId } = (await req.json().catch(() => ({}))) as { dealId?: unknown };
  if (typeof dealId !== "string" || !dealId) {
    return NextResponse.json({ error: "dealId required" }, { status: 422 });
  }
  const ok = await markReplied(dealId);
  return NextResponse.json({ ok, dealId });
}
