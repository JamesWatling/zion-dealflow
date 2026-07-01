// Sourcing worker (M6). Uses Claude Code web search (`claude -p` + WebSearch) to
// discover new / price-reduced listings in the buy box, dedupes, screens, and queues
// them. Run locally (needs Claude Code logged in): npm run source
import { getDeals, createProperty } from "../lib/store";
import { hasDb } from "../lib/db/client";
import { runClaudeJSON } from "../lib/claude";
import { sanitizeListing } from "../lib/api";
import { screen } from "../lib/screen";
import type { Property } from "../lib/types";

const msg = (e: unknown) => (e instanceof Error ? e.message : String(e));

function normUrl(u?: string): string {
  if (!u) return "";
  try {
    const x = new URL(u.includes("://") ? u : `https://${u}`);
    return x.host.replace(/^www\./, "").toLowerCase() + x.pathname.replace(/\/+$/, "").toLowerCase();
  } catch {
    return u
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .split(/[?#]/)[0]
      .replace(/\/+$/, "");
  }
}
const normName = (n?: string) => (n ?? "").toLowerCase().replace(/\s+/g, " ").trim();

const PROMPT = `You are a sourcing agent for an acquisitions firm that buys TURNKEY, semi-passive income property within ~5 driving hours of St George, UT (Southern Utah, Southern Nevada, Northern Arizona). Target asset types: RV parks, mobile-home parks, small motels, self-storage, small multifamily, and large by-the-room houses near universities.

Use web search to find CURRENTLY-LISTED properties that are NEW or PRICE-REDUCED and look like motivated sellers or creative-financing candidates (long days-on-market, price cuts, advertised seller financing). Favor turnkey condition (not heavy rehab).

Return up to 12 candidates as JSON:
{"candidates":[{"name": string, "url": string, "city": string, "state": string, "assetType": "rv_park"|"mobile_home_park"|"motel"|"self_storage"|"multifamily"|"house"|"retail"|"land"|"other", "price": number|null, "daysOnMarket": number|null, "priceCuts": string|null, "sellerFinancing": boolean|null, "driveHours": number|null, "notes": string|null}]}
Only include real listings you found with a working URL. Do not fabricate.`;

async function main() {
  if (!hasDb) console.warn("⚠ DATABASE_URL not set — queued candidates persist to the in-memory store only.");
  const existing = await getDeals();
  const seenUrls = new Set(existing.map((d) => normUrl(d.url)).filter(Boolean));
  const seenNames = new Set(existing.map((d) => normName(d.name)).filter(Boolean));

  console.log("Searching for new listings via claude -p (WebSearch)… this can take a few minutes.");
  const { candidates } = await runClaudeJSON<{ candidates: unknown[] }>(PROMPT, {
    timeoutMs: 420000,
    allowedTools: ["WebSearch", "WebFetch"],
  });
  const list = Array.isArray(candidates) ? candidates : [];

  let added = 0;
  let skipped = 0;
  for (const c of list) {
    const clean = sanitizeListing(c);
    if (!clean) {
      skipped++;
      continue;
    }
    const url = normUrl(clean.url);
    const name = normName(clean.name);
    if ((url && seenUrls.has(url)) || (name && seenNames.has(name))) {
      skipped++;
      continue;
    }
    const s = screen({ assetType: clean.assetType ?? "other", driveHours: clean.driveHours } as Property);
    if (!s.pass) {
      console.log(`  – screened out: ${clean.name} (${s.reason})`);
      skipped++;
      continue;
    }
    await createProperty({ ...clean, name: clean.name ?? clean.url!, source: "search", stage: "sourced" });
    if (url) seenUrls.add(url);
    if (name) seenNames.add(name);
    added++;
    console.log(`  + queued: ${clean.name}`);
  }
  console.log(`Done — ${added} new, ${skipped} skipped.`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(msg(e));
    process.exit(1);
  });
