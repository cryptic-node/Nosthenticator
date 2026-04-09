import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const nostrRequestsTable = pgTable("nostr_requests", {
  id: text("id").primaryKey(),
  credentialId: text("credential_id"),
  npub: text("npub"),
  requesterName: text("requester_name").notNull(),
  requesterOrigin: text("requester_origin").notNull(),
  actionType: text("action_type").notNull(), // sign_in | authorize_action | link_device | recovery | key_rotation
  actionSummary: text("action_summary").notNull(),
  riskLevel: text("risk_level").notNull(), // low | medium | high
  status: text("status").notNull().default("pending"), // pending | approved | rejected | expired
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export const insertNostrRequestSchema = createInsertSchema(nostrRequestsTable).omit({ createdAt: true });
export type InsertNostrRequest = z.infer<typeof insertNostrRequestSchema>;
export type NostrRequest = typeof nostrRequestsTable.$inferSelect;
