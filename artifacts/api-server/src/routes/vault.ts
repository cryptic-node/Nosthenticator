import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, credentialsTable, nostrRequestsTable, activityLogTable } from "@workspace/db";
import { ExportVaultBody, ImportVaultBody } from "@workspace/api-zod";
import { createHash, randomUUID } from "crypto";

const router: IRouter = Router();

router.get("/vault/stats", async (_req, res): Promise<void> => {
  const [total, totpCount, nostrCount, pendingCount, todayApprovals, lastActivity] =
    await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(credentialsTable).then(([r]) => r?.count ?? 0),
      db.select({ count: sql<number>`count(*)::int` }).from(credentialsTable).where(eq(credentialsTable.type, "totp")).then(([r]) => r?.count ?? 0),
      db.select({ count: sql<number>`count(*)::int` }).from(credentialsTable).where(eq(credentialsTable.type, "nostr")).then(([r]) => r?.count ?? 0),
      db.select({ count: sql<number>`count(*)::int` }).from(nostrRequestsTable).where(eq(nostrRequestsTable.status, "pending")).then(([r]) => r?.count ?? 0),
      db.select({ count: sql<number>`count(*)::int` }).from(activityLogTable)
        .where(sql`timestamp >= now() - interval '1 day'`)
        .then(([r]) => r?.count ?? 0),
      db.select({ ts: activityLogTable.timestamp }).from(activityLogTable)
        .orderBy(sql`timestamp desc`).limit(1).then(([r]) => r?.ts ?? null),
    ]);

  res.json({
    totalCredentials: total,
    totpCount,
    nostrCount,
    pendingRequests: pendingCount,
    todayApprovals,
    lastActivity,
  });
});

router.post("/vault/export", async (req, res): Promise<void> => {
  const parsed = ExportVaultBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { includeSecrets } = parsed.data;

  const creds = await db.select().from(credentialsTable);

  const items = creds.map((c) => ({
    id: c.id,
    type: c.type,
    label: c.label,
    issuer: c.issuer,
    accountName: c.accountName,
    algorithm: c.algorithm,
    digits: c.digits,
    period: c.period,
    npub: c.npub,
    secretMode: c.secretMode,
    favorite: c.favorite,
    secret: includeSecrets ? c.secret : undefined,
  }));

  const payload = JSON.stringify({
    version: 1,
    createdAt: new Date().toISOString(),
    items,
  });

  const data = Buffer.from(payload).toString("base64");
  const checksum = createHash("sha256").update(data).digest("hex");

  await db.insert(activityLogTable).values({
    id: randomUUID(),
    eventType: "export",
    description: `Vault exported — ${creds.length} credentials${includeSecrets ? " (with secrets)" : " (public only)"}`,
  });

  res.json({
    version: 1,
    createdAt: new Date().toISOString(),
    itemCount: creds.length,
    includesSecrets: includeSecrets,
    data,
    checksum,
  });
});

router.post("/vault/import", async (req, res): Promise<void> => {
  const parsed = ImportVaultBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  let payload: { version: number; items: Array<Record<string, unknown>> };
  try {
    const decoded = Buffer.from(parsed.data.data, "base64").toString("utf-8");
    payload = JSON.parse(decoded);
  } catch {
    res.status(400).json({ error: "Invalid bundle data" });
    return;
  }

  if (!payload.items || !Array.isArray(payload.items)) {
    res.status(400).json({ error: "Invalid bundle format" });
    return;
  }

  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const item of payload.items) {
    try {
      const existing = await db
        .select()
        .from(credentialsTable)
        .where(eq(credentialsTable.id, item.id as string));

      if (existing.length > 0) {
        skipped++;
        continue;
      }

      await db.insert(credentialsTable).values({
        id: (item.id as string) ?? randomUUID(),
        type: item.type as string,
        label: item.label as string,
        issuer: item.issuer as string,
        accountName: item.accountName as string,
        secret: (item.secret as string) ?? null,
        algorithm: (item.algorithm as string) ?? "SHA1",
        digits: (item.digits as number) ?? 6,
        period: (item.period as number) ?? 30,
        npub: (item.npub as string) ?? null,
        secretMode: (item.secretMode as string) ?? "none",
        favorite: Boolean(item.favorite),
      });
      imported++;
    } catch (e: unknown) {
      errors.push(`Failed to import ${item.label as string}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  if (imported > 0) {
    await db.insert(activityLogTable).values({
      id: randomUUID(),
      eventType: "import",
      description: `Vault import: ${imported} added, ${skipped} skipped`,
    });
  }

  res.json({ imported, skipped, errors });
});

export default router;
