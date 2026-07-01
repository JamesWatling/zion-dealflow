// Offer-PDF worker (M4). Renders the LOI PDF for deals that have an offer but no
// PDF yet, and stores it (base64) on the offer for attaching at send time.
// Run locally (needs a headless Chrome): npm run pdf [-- --id=<id> --force]
import { getDeals, getDeal, updateProperty } from "../lib/store";
import { hasDb } from "../lib/db/client";
import { buildOfferHtml } from "../lib/offer-html";
import { renderPdf } from "../lib/offer-pdf";
import { blobEnabled, uploadOfferPdf } from "../lib/blob";
import type { Property } from "../lib/types";

const arg = (k: string) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split("=")[1];
const ONLY = arg("id");
const FORCE = process.argv.includes("--force");
const msg = (e: unknown) => (e instanceof Error ? e.message : String(e));

const MAX_PDF_BYTES = Number(process.env.MAX_PDF_BYTES ?? 5_000_000); // ~5 MB
const needsPdf = (d: Property) => !!d.offer && (FORCE || (!d.offer.pdfBase64 && !d.offer.pdfUrl));

async function one(d: Property) {
  console.log(`• rendering PDF for ${d.id} — ${d.name}`);
  const html = buildOfferHtml(d);
  const pdf = await renderPdf(html);
  if (pdf.length > MAX_PDF_BYTES) {
    throw new Error(`PDF too large (${(pdf.length / 1e6).toFixed(1)}MB > ${(MAX_PDF_BYTES / 1e6).toFixed(1)}MB)`);
  }
  const current = await getDeal(d.id);
  if (!current?.offer) {
    console.log("  ↷ skipped — offer removed");
    return;
  }
  if (blobEnabled()) {
    const url = await uploadOfferPdf(d.id, pdf);
    await updateProperty(d.id, { offer: { ...current.offer, html, pdfUrl: url, pdfBase64: undefined } });
    console.log(`  → ${(pdf.length / 1024).toFixed(0)} KB → Blob`);
  } else {
    await updateProperty(d.id, { offer: { ...current.offer, html, pdfUrl: undefined, pdfBase64: pdf.toString("base64") } });
    console.log(`  → ${(pdf.length / 1024).toFixed(0)} KB stored (base64)`);
  }
}

async function main() {
  if (!hasDb) console.warn("⚠ DATABASE_URL not set — PDF stored to in-memory store only.");
  let todo: Property[];
  if (ONLY) {
    const d = await getDeal(ONLY);
    if (!d) return console.error(`no deal ${ONLY}`);
    todo = [d];
  } else {
    todo = (await getDeals()).filter(needsPdf);
  }
  if (!todo.length) return console.log("no offers need a PDF.");
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
    console.error(e);
    process.exit(1);
  });
