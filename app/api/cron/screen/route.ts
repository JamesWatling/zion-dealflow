import { NextResponse } from "next/server";
import { getDeals, updateProperty } from "@/lib/store";
import { screen } from "@/lib/screen";
import { checkSecret } from "@/lib/api";

export const runtime = "nodejs";

// Vercel Cron job: re-screen sourced deals against the buy box and auto-archive
// clear misses. Secured by CRON_SECRET (Vercel sends it as Bearer auth).
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (!checkSecret(token, secret)) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  }

  const deals = await getDeals();
  let archived = 0;
  for (const d of deals) {
    if (d.stage !== "sourced") continue;
    const s = screen(d);
    if (!s.pass) {
      await updateProperty(d.id, { stage: "archived", notes: `Auto-screened out: ${s.reason}` });
      archived++;
    }
  }
  return NextResponse.json({ ok: true, archived });
}
