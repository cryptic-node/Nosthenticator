import { Router, type IRouter } from "express";
import { eq, desc, and, sql } from "drizzle-orm";
import { db, nostrKeysTable, signingRequestsTable, auditLogTable } from "@workspace/db";
import {
  ApproveSigningRequestParams,
  RejectSigningRequestParams,
  GetAuditLogQueryParams,
} from "@workspace/api-zod";
import { randomUUID, createHash } from "crypto";

const router: IRouter = Router();

function computeHash(entry: {
  id: string;
  keyId: string;
  npub: string;
  eventKind: number;
  action: string;
  transport: string;
  clientFingerprint: string;
  prevHash: string | null;
  timestamp: string;
}): string {
  const data = JSON.stringify(entry);
  return createHash("sha256").update(data).digest("hex");
}

router.get("/signing/pending", async (_req, res): Promise<void> => {
  const requests = await db
    .select()
    .from(signingRequestsTable)
    .where(eq(signingRequestsTable.status, "pending"))
    .orderBy(desc(signingRequestsTable.createdAt));
  res.json(requests);
});

router.post("/signing/pending/:id/approve", async (req, res): Promise<void> => {
  const params = ApproveSigningRequestParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [request] = await db
    .select()
    .from(signingRequestsTable)
    .where(
      and(
        eq(signingRequestsTable.id, params.data.id),
        eq(signingRequestsTable.status, "pending")
      )
    );

  if (!request) {
    res.status(404).json({ error: "Pending request not found" });
    return;
  }

  await db
    .update(signingRequestsTable)
    .set({ status: "approved" })
    .where(eq(signingRequestsTable.id, request.id));

  await db
    .update(nostrKeysTable)
    .set({
      signingCount: sql`${nostrKeysTable.signingCount} + 1`,
      lastUsedAt: new Date(),
    })
    .where(eq(nostrKeysTable.id, request.keyId));

  const [lastEntry] = await db
    .select({ hash: auditLogTable.hash })
    .from(auditLogTable)
    .orderBy(desc(auditLogTable.timestamp))
    .limit(1);

  const prevHash = lastEntry?.hash ?? null;
  const entryId = randomUUID();
  const now = new Date().toISOString();

  const hash = computeHash({
    id: entryId,
    keyId: request.keyId,
    npub: request.npub,
    eventKind: request.eventKind,
    action: "approved",
    transport: request.transport,
    clientFingerprint: request.clientFingerprint,
    prevHash,
    timestamp: now,
  });

  await db.insert(auditLogTable).values({
    id: entryId,
    keyId: request.keyId,
    npub: request.npub,
    eventKind: request.eventKind,
    action: "approved",
    transport: request.transport,
    clientFingerprint: request.clientFingerprint,
    hash,
    prevHash,
  });

  const signature = createHash("sha256")
    .update(request.eventHex + entryId)
    .digest("hex");

  res.json({
    requestId: request.id,
    signature,
    signedAt: now,
  });
});

router.post("/signing/pending/:id/reject", async (req, res): Promise<void> => {
  const params = RejectSigningRequestParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [request] = await db
    .select()
    .from(signingRequestsTable)
    .where(
      and(
        eq(signingRequestsTable.id, params.data.id),
        eq(signingRequestsTable.status, "pending")
      )
    );

  if (!request) {
    res.status(404).json({ error: "Pending request not found" });
    return;
  }

  const [updated] = await db
    .update(signingRequestsTable)
    .set({ status: "rejected" })
    .where(eq(signingRequestsTable.id, request.id))
    .returning();

  const [lastEntry] = await db
    .select({ hash: auditLogTable.hash })
    .from(auditLogTable)
    .orderBy(desc(auditLogTable.timestamp))
    .limit(1);

  const prevHash = lastEntry?.hash ?? null;
  const entryId = randomUUID();
  const now = new Date().toISOString();

  const hash = computeHash({
    id: entryId,
    keyId: request.keyId,
    npub: request.npub,
    eventKind: request.eventKind,
    action: "rejected",
    transport: request.transport,
    clientFingerprint: request.clientFingerprint,
    prevHash,
    timestamp: now,
  });

  await db.insert(auditLogTable).values({
    id: entryId,
    keyId: request.keyId,
    npub: request.npub,
    eventKind: request.eventKind,
    action: "rejected",
    transport: request.transport,
    clientFingerprint: request.clientFingerprint,
    hash,
    prevHash,
  });

  res.json(updated);
});

router.get("/signing/log", async (req, res): Promise<void> => {
  const parsed = GetAuditLogQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { keyId, limit = 50, offset = 0 } = parsed.data;

  const query = db
    .select()
    .from(auditLogTable)
    .orderBy(desc(auditLogTable.timestamp))
    .limit(limit)
    .offset(offset);

  if (keyId) {
    query.where(eq(auditLogTable.keyId, keyId));
  }

  const [entries, countResult] = await Promise.all([
    query,
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(auditLogTable)
      .then(([r]) => r?.count ?? 0),
  ]);

  res.json({ entries, total: countResult });
});

export default router;
