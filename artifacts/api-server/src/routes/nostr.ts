import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, nostrRequestsTable, activityLogTable } from "@workspace/db";
import {
  CreateNostrRequestBody,
  ListNostrRequestsQueryParams,
  ApproveNostrRequestParams,
  RejectNostrRequestParams,
} from "@workspace/api-zod";
import { randomUUID } from "crypto";

const router: IRouter = Router();

router.get("/nostr/requests", async (req, res): Promise<void> => {
  const parsed = ListNostrRequestsQueryParams.safeParse(req.query);
  const status = parsed.success ? parsed.data.status : undefined;

  let rows = await db
    .select()
    .from(nostrRequestsTable)
    .orderBy(nostrRequestsTable.createdAt);

  // Expire stale requests
  const now = new Date();
  rows = rows.map((r) => {
    if (r.status === "pending" && r.expiresAt < now) {
      return { ...r, status: "expired" };
    }
    return r;
  });

  if (status) {
    rows = rows.filter((r) => r.status === status);
  }

  res.json(rows.reverse());
});

router.post("/nostr/requests", async (req, res): Promise<void> => {
  const parsed = CreateNostrRequestBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const d = parsed.data;
  const id = randomUUID();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  const [request] = await db
    .insert(nostrRequestsTable)
    .values({
      id,
      credentialId: d.credentialId ?? null,
      requesterName: d.requesterName,
      requesterOrigin: d.requesterOrigin,
      actionType: d.actionType,
      actionSummary: d.actionSummary,
      riskLevel: d.riskLevel,
      status: "pending",
      expiresAt,
    })
    .returning();

  res.status(201).json(request);
});

router.post("/nostr/requests/:id/approve", async (req, res): Promise<void> => {
  const params = ApproveNostrRequestParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(nostrRequestsTable)
    .where(
      and(
        eq(nostrRequestsTable.id, params.data.id),
        eq(nostrRequestsTable.status, "pending")
      )
    );

  if (!existing) {
    res.status(404).json({ error: "Pending request not found" });
    return;
  }

  const [updated] = await db
    .update(nostrRequestsTable)
    .set({ status: "approved" })
    .where(eq(nostrRequestsTable.id, params.data.id))
    .returning();

  await db.insert(activityLogTable).values({
    id: randomUUID(),
    credentialId: existing.credentialId,
    credentialLabel: existing.requesterName,
    eventType: "nostr_approved",
    description: `Approved: ${actionTypeLabel(existing.actionType)} for ${existing.requesterName} (${existing.requesterOrigin})`,
  });

  res.json(updated);
});

router.post("/nostr/requests/:id/reject", async (req, res): Promise<void> => {
  const params = RejectNostrRequestParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(nostrRequestsTable)
    .where(
      and(
        eq(nostrRequestsTable.id, params.data.id),
        eq(nostrRequestsTable.status, "pending")
      )
    );

  if (!existing) {
    res.status(404).json({ error: "Pending request not found" });
    return;
  }

  const [updated] = await db
    .update(nostrRequestsTable)
    .set({ status: "rejected" })
    .where(eq(nostrRequestsTable.id, params.data.id))
    .returning();

  await db.insert(activityLogTable).values({
    id: randomUUID(),
    credentialId: existing.credentialId,
    credentialLabel: existing.requesterName,
    eventType: "nostr_rejected",
    description: `Rejected: ${actionTypeLabel(existing.actionType)} from ${existing.requesterName} (${existing.requesterOrigin})`,
  });

  res.json(updated);
});

function actionTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    sign_in: "Sign in",
    authorize_action: "Authorize action",
    link_device: "Link device",
    recovery: "Account recovery",
    key_rotation: "Key rotation",
  };
  return labels[type] ?? type;
}

export default router;
