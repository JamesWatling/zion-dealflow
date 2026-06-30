import { pgTable, text, integer, real, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import type { Analysis, Contact, Offer } from "../types";

export const properties = pgTable("properties", {
  id: text("id").primaryKey(),
  source: text("source").notNull().default("manual"),
  url: text("url"),
  name: text("name").notNull(),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  assetType: text("asset_type").notNull().default("other"),
  price: integer("price"),
  units: integer("units"),
  beds: integer("beds"),
  sqft: integer("sqft"),
  yearBuilt: integer("year_built"),
  daysOnMarket: integer("days_on_market"),
  priceCuts: text("price_cuts"),
  sellerFinancing: boolean("seller_financing"),
  driveHours: real("drive_hours"),
  stage: text("stage").notNull().default("sourced"),
  fitScore: integer("fit_score"),
  contact: jsonb("contact").$type<Contact>(),
  analysis: jsonb("analysis").$type<Analysis>(),
  offer: jsonb("offer").$type<Offer>(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const events = pgTable("events", {
  id: text("id").primaryKey(),
  propertyId: text("property_id"),
  kind: text("kind").notNull(),
  detail: text("detail"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type PropertyRow = typeof properties.$inferSelect;
export type NewPropertyRow = typeof properties.$inferInsert;
