import { timingSafeEqual } from "node:crypto";
import type { AssetType, DealStage, Property } from "./types";

// Timing-safe shared-secret check for server-to-server write endpoints.
export function checkSecret(provided: string | null, expected: string | undefined): boolean {
  if (!expected || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

const ASSET_TYPES: AssetType[] = [
  "house", "multifamily", "rv_park", "mobile_home_park", "motel", "self_storage", "retail", "land", "other",
];
const SOURCES = ["alert", "search", "manual"];
const STAGES: DealStage[] = ["sourced", "screening", "analyzed", "drafted", "outbox", "sent", "replied", "archived"];

const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : undefined);
const num = (v: unknown) =>
  typeof v === "number" && Number.isFinite(v)
    ? v
    : typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))
      ? Number(v)
      : undefined;
const bool = (v: unknown) => (typeof v === "boolean" ? v : undefined);

// Whitelist + coerce an external listing payload into a safe partial Property.
// Returns null if neither a name nor a url is present.
export function sanitizeListing(body: unknown): (Partial<Property> & { name?: string }) | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const out: Partial<Property> = {
    name: str(b.name, 200),
    url: str(b.url, 1000),
    address: str(b.address, 300),
    city: str(b.city, 120),
    state: str(b.state, 40),
    price: num(b.price),
    units: num(b.units),
    beds: num(b.beds),
    sqft: num(b.sqft),
    yearBuilt: num(b.yearBuilt),
    daysOnMarket: num(b.daysOnMarket),
    priceCuts: str(b.priceCuts, 300),
    sellerFinancing: bool(b.sellerFinancing),
    driveHours: num(b.driveHours),
    notes: str(b.notes, 1000),
  };
  if (typeof b.assetType === "string" && (ASSET_TYPES as string[]).includes(b.assetType)) out.assetType = b.assetType as AssetType;
  if (typeof b.source === "string" && SOURCES.includes(b.source)) out.source = b.source as Property["source"];
  if (typeof b.stage === "string" && STAGES.includes(b.stage)) out.stage = b.stage as DealStage;

  for (const k of Object.keys(out) as (keyof Property)[]) if (out[k] === undefined) delete out[k];
  if (!out.name && !out.url) return null;
  return out;
}
