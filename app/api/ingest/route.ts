import { NextResponse } from "next/server";
import { createProperty } from "@/lib/store";
import { checkSecret, sanitizeListing } from "@/lib/api";

export const runtime = "nodejs";

// Receives parsed listings from the Cloudflare alert-email worker (or any source).
// Auth: timing-safe shared-secret header must match INGEST_SECRET.
export async function POST(req: Request) {
  if (!checkSecret(req.headers.get("x-ingest-secret"), process.env.INGEST_SECRET)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const clean = sanitizeListing(await req.json().catch(() => null));
  if (!clean) return NextResponse.json({ error: "name or url required" }, { status: 422 });

  try {
    const p = await createProperty({
      ...clean,
      name: clean.name ?? clean.url!,
      source: clean.source ?? "alert",
      stage: "sourced",
    });
    return NextResponse.json({ ok: true, id: p.id });
  } catch (err) {
    console.error("[ingest] failed", err);
    return NextResponse.json({ error: "ingest failed" }, { status: 500 });
  }
}
