// Seed the database from the bundled sample deals.
// Run: npm run db:seed   (requires DATABASE_URL in .env)
import { db, hasDb } from "../lib/db/client";
import { properties } from "../lib/db/schema";
import { SEED } from "../lib/mock-data";

async function main() {
  if (!hasDb || !db) {
    console.error("DATABASE_URL not set — nothing to seed (the app uses the in-memory seed without a DB).");
    process.exit(1);
  }
  for (const d of SEED) {
    await db
      .insert(properties)
      .values({
        id: d.id,
        source: d.source,
        url: d.url,
        name: d.name,
        address: d.address,
        city: d.city,
        state: d.state,
        assetType: d.assetType,
        price: d.price,
        units: d.units,
        beds: d.beds,
        sqft: d.sqft,
        yearBuilt: d.yearBuilt,
        daysOnMarket: d.daysOnMarket,
        priceCuts: d.priceCuts,
        sellerFinancing: d.sellerFinancing,
        driveHours: d.driveHours,
        stage: d.stage,
        fitScore: d.fitScore,
        contact: d.contact,
        analysis: d.analysis,
        offer: d.offer,
        notes: d.notes,
      })
      .onConflictDoNothing();
    console.log("seeded", d.id);
  }
  console.log(`Done — ${SEED.length} properties.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
