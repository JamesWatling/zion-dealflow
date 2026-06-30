import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// When DATABASE_URL is set we use Neon/Postgres; otherwise the app falls back
// to the in-memory seed so it runs with zero provisioning during development.
const url = process.env.DATABASE_URL;
export const hasDb = Boolean(url);

const globalForDb = globalThis as unknown as { _sql?: ReturnType<typeof postgres> };
const sql = url ? (globalForDb._sql ??= postgres(url, { max: 1 })) : null;

export const db = sql ? drizzle(sql, { schema }) : null;
