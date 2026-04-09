import { pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const nostrKeysTable = pgTable("nostr_keys", {
  id: text("id").primaryKey(),
  label: text("label").notNull(),
  npub: text("npub").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  signingCount: integer("signing_count").notNull().default(0),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
});

export const insertNostrKeySchema = createInsertSchema(nostrKeysTable).omit({ createdAt: true, signingCount: true });
export type InsertNostrKey = z.infer<typeof insertNostrKeySchema>;
export type NostrKey = typeof nostrKeysTable.$inferSelect;
