import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { SEED } from "./mock-data";
import { db, hasDb } from "./db/client";
import { properties, type PropertyRow } from "./db/schema";
import type { DealStage, Property } from "./types";

// In-memory fallback (no DATABASE_URL). Mutations persist for the process only.
const mem: Property[] = [...SEED];

function rowToProperty(r: PropertyRow): Property {
  return {
    ...r,
    url: r.url ?? undefined,
    address: r.address ?? undefined,
    city: r.city ?? undefined,
    state: r.state ?? undefined,
    price: r.price ?? undefined,
    units: r.units ?? undefined,
    beds: r.beds ?? undefined,
    sqft: r.sqft ?? undefined,
    yearBuilt: r.yearBuilt ?? undefined,
    daysOnMarket: r.daysOnMarket ?? undefined,
    priceCuts: r.priceCuts ?? undefined,
    sellerFinancing: r.sellerFinancing ?? undefined,
    driveHours: r.driveHours ?? undefined,
    fitScore: r.fitScore ?? undefined,
    contact: r.contact ?? undefined,
    analysis: r.analysis ?? undefined,
    offer: r.offer ?? undefined,
    notes: r.notes ?? undefined,
    source: r.source as Property["source"],
    assetType: r.assetType as Property["assetType"],
    stage: r.stage as DealStage,
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
  };
}

const byFit = (a: Property, b: Property) => (b.fitScore ?? 0) - (a.fitScore ?? 0);

export async function getDeals(): Promise<Property[]> {
  if (hasDb && db) {
    const rows = await db.select().from(properties);
    return rows.map(rowToProperty).sort(byFit);
  }
  return [...mem].sort(byFit);
}

export async function getDeal(id: string): Promise<Property | undefined> {
  if (hasDb && db) {
    const rows = await db.select().from(properties).where(eq(properties.id, id));
    return rows[0] ? rowToProperty(rows[0]) : undefined;
  }
  return mem.find((d) => d.id === id);
}

export async function dealsByStage(stage: DealStage): Promise<Property[]> {
  return (await getDeals()).filter((d) => d.stage === stage);
}

export async function createProperty(input: Partial<Property> & { name: string }): Promise<Property> {
  const id = input.id ?? randomUUID();
  const property: Property = {
    ...input,
    id,
    source: input.source ?? "manual",
    name: input.name,
    assetType: input.assetType ?? "other",
    stage: input.stage ?? "sourced",
    createdAt: input.createdAt ?? new Date().toISOString(),
  };
  if (hasDb && db) {
    await db.insert(properties).values({
      id,
      source: property.source,
      url: property.url,
      name: property.name,
      address: property.address,
      city: property.city,
      state: property.state,
      assetType: property.assetType,
      price: property.price,
      units: property.units,
      beds: property.beds,
      sqft: property.sqft,
      yearBuilt: property.yearBuilt,
      daysOnMarket: property.daysOnMarket,
      priceCuts: property.priceCuts,
      sellerFinancing: property.sellerFinancing,
      driveHours: property.driveHours,
      stage: property.stage,
      fitScore: property.fitScore,
      contact: property.contact,
      analysis: property.analysis,
      offer: property.offer,
      notes: property.notes,
    });
  } else {
    mem.unshift(property);
  }
  return property;
}

export async function updateProperty(id: string, patch: Partial<Property>): Promise<void> {
  if (hasDb && db) {
    // createdAt is a string in the domain type; let the DB manage timestamps.
    const { createdAt: _c, id: _i, ...rest } = patch;
    await db.update(properties).set({ ...rest, updatedAt: new Date() }).where(eq(properties.id, id));
  } else {
    const i = mem.findIndex((d) => d.id === id);
    if (i >= 0) mem[i] = { ...mem[i], ...patch };
  }
}
