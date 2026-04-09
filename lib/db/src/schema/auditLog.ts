import { pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const auditLogTable = pgTable("audit_log", {
  id: text("id").primaryKey(),
  keyId: text("key_id").notNull(),
  npub: text("npub").notNull(),
  eventKind: integer("event_kind").notNull(),
  action: text("action").notNull(),
  transport: text("transport").notNull(),
  clientFingerprint: text("client_fingerprint").notNull(),
  hash: text("hash").notNull(),
  prevHash: text("prev_hash"),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAuditLogSchema = createInsertSchema(auditLogTable).omit({ timestamp: true });
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogTable.$inferSelect;
