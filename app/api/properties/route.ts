import { NextResponse } from "next/server";
import { createProperty, getDeals } from "@/lib/store";
import { checkSecret, sanitizeListing } from "@/lib/api";

export const runtime = "nodejs";

// Server-to-server intake + listing. Write/read require the shared secret until
// session auth lands in M7 (the dashboard pages read via the store directly).
function authed(req: Request) {
  return checkSecret(req.headers.get("x-ingest-secret"), process.env.INGEST_SECRET);
}

export async function GET(req: Request) {
  if (!authed(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json({ deals: await getDeals() });
}

export async function POST(req: Request) {
  if (!authed(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const clean = sanitizeListing(await req.json().catch(() => null));
  if (!clean) return NextResponse.json({ error: "url or name required" }, { status: 422 });

  try {
    const p = await createProperty({
      ...clean,
      name: clean.name ?? clean.url!,
      source: "manual",
      stage: "sourced",
    });
    return NextResponse.json({ ok: true, id: p.id });
  } catch (err) {
    console.error("[properties] create failed", err);
    return NextResponse.json({ error: "create failed" }, { status: 500 });
  }
}
