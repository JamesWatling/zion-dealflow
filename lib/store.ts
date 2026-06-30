import { SEED } from "./mock-data";
import type { DealStage, Property } from "./types";

// M1: in-memory seed. M2 swaps this for the Neon/Drizzle data layer
// behind the same function signatures.
export function getDeals(): Property[] {
  return [...SEED].sort((a, b) => (b.fitScore ?? 0) - (a.fitScore ?? 0));
}
export function getDeal(id: string): Property | undefined {
  return SEED.find((d) => d.id === id);
}
export function dealsByStage(stage: DealStage): Property[] {
  return getDeals().filter((d) => d.stage === stage);
}
