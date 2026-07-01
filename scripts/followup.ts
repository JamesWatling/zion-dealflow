// Follow-up worker (M7). Finds sent offers with no reply after N days and drafts a
// polite follow-up via `claude -p`, putting the deal back in the outbox for your
// approval (never auto-sends). Run locally: npm run followup [-- --days=5 --id=<id>]
import { getDeals, getDeal, updateProperty } from "../lib/store";
import { hasDb } from "../lib/db/client";
import { runClaude } from "../lib/claude";
import type { Property } from "../lib/types";

const arg = (k: string) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split("=")[1];
const DAYS = (() => {
  const n = Number(arg("days"));
  return Number.isFinite(n) && n >= 0 ? n : 5;
})();
const MAX = 2;
const ONLY = arg("id");
const msg = (e: unknown) => (e instanceof Error ? e.message : String(e));

const buyer = () => ({
  name: process.env.BUYER_NAME || "Zion Property Acquisitions",
  email: process.env.BUYER_EMAIL || "info@zionpropertyacquisitions.com",
  phone: process.env.BUYER_PHONE || "(435) 625-1668",
});

function eligible(d: Property): boolean {
  if (d.stage !== "sent" || !d.offer || d.offer.status !== "sent") return false;
  if ((d.offer.followUps ?? 0) >= MAX) return false;
  if (!d.offer.sentAt) return false;
  const ageDays = (Date.now() - new Date(d.offer.sentAt).getTime()) / 86400000;
  return ageDays >= DAYS;
}

async function one(d: Property) {
  const b = buyer();
  const where = [d.city, d.state].filter(Boolean).join(", ");
  const prompt = `Write a brief, warm, professional FOLLOW-UP email (4-6 sentences) to a real estate agent/seller I previously emailed an offer to but haven't heard back from. Property: ${d.name}${where ? `, ${where}` : ""}. Gently ask if they had a chance to review, reiterate I'm flexible on terms and can move quickly, and invite a short call. Sign exactly as "${b.name} · ${b.phone} · ${b.email}". Return ONLY the email body text, no subject line, no preamble.`;

  console.log(`• drafting follow-up for ${d.id} — ${d.name}`);
  const bodyText = (await runClaude(prompt, { timeoutMs: 120000 })).trim();
  const current = await getDeal(d.id);
  if (!current?.offer || current.offer.status !== "sent" || (current.offer.followUps ?? 0) >= MAX) {
    console.log("  ↷ skipped — no longer eligible for follow-up");
    return;
  }
  const subject = current.offer.subject?.startsWith("Re:") ? current.offer.subject : `Re: ${current.offer.subject ?? d.name}`;
  await updateProperty(d.id, {
    stage: "outbox",
    offer: { ...current.offer, status: "draft", subject, emailBody: bodyText, followUps: (current.offer.followUps ?? 0) + 1 },
  });
  console.log(`  → back in outbox (follow-up #${(current.offer.followUps ?? 0) + 1})`);
}

async function main() {
  if (!hasDb) console.warn("⚠ DATABASE_URL not set — updates persist to the in-memory store only.");
  let todo: Property[];
  if (ONLY) {
    const d = await getDeal(ONLY);
    todo = d && eligible(d) ? [d] : []; // --id still respects age/MAX (tune age with --days)
  } else {
    todo = (await getDeals()).filter(eligible);
  }
  if (!todo.length) return console.log("no offers need a follow-up.");
  for (const d of todo) {
    try {
      await one(d);
    } catch (e) {
      console.error(`  ✗ ${d.id}: ${msg(e)}`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(msg(e));
    process.exit(1);
  });
