import type { AssetType, Property } from "./types";

// Buy box: turnkey, semi-passive income property within ~5 hours of St George, UT.
const ALLOWED: AssetType[] = ["rv_park", "mobile_home_park", "motel", "self_storage", "multifamily", "house"];
const MAX_DRIVE_HOURS = 5.5;

export interface ScreenResult {
  pass: boolean;
  reason?: string;
}

// Cheap rule-based screen applied before the (expensive) Claude analysis.
// The deeper fit score comes from the analyzer.
export function screen(d: Property): ScreenResult {
  if (!ALLOWED.includes(d.assetType)) return { pass: false, reason: `asset type "${d.assetType}" out of buy box` };
  if (d.driveHours != null && d.driveHours > MAX_DRIVE_HOURS) {
    return { pass: false, reason: `${d.driveHours}h drive exceeds ${MAX_DRIVE_HOURS}h radius` };
  }
  return { pass: true };
}
