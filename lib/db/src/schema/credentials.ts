import { pgTable, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const credentialsTable = pgTable("credentials", {
  id: text("id").primaryKey(),
  type: text("type").notNull(), // totp | hotp | nostr
  label: text("label").notNull(),
  issuer: text("issuer").notNull(),
  accountName: text("account_name").notNull(),
  secret: text("secret"), // base32 TOTP/HOTP secret or nsec
  algorithm: text("algorithm").default("SHA1"), // SHA1 | SHA256 | SHA512
  digits: integer("digits").default(6),
  period: integer("period").default(30), // TOTP period in seconds
  counter: integer("counter").default(0), // HOTP counter
  npub: text("npub"), // Nostr public key
  secretMode: text("secret_mode").default("none"), // none | auth-only | full-signer
  favorite: boolean("favorite").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
});

export const insertCredentialSchema = createInsertSchema(credentialsTable).omit({ createdAt: true });
export type InsertCredential = z.infer<typeof insertCredentialSchema>;
export type Credential = typeof credentialsTable.$inferSelect;
