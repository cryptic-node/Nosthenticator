import { pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const signingRequestsTable = pgTable("signing_requests", {
  id: text("id").primaryKey(),
  keyId: text("key_id").notNull(),
  npub: text("npub").notNull(),
  eventKind: integer("event_kind").notNull(),
  eventHex: text("event_hex").notNull(),
  clientFingerprint: text("client_fingerprint").notNull(),
  transport: text("transport").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSigningRequestSchema = createInsertSchema(signingRequestsTable).omit({ createdAt: true });
export type InsertSigningRequest = z.infer<typeof insertSigningRequestSchema>;
export type SigningRequest = typeof signingRequestsTable.$inferSelect;
