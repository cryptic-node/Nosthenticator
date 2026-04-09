import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, credentialsTable, activityLogTable } from "@workspace/db";
import {
  CreateCredentialBody,
  GetCredentialParams,
  UpdateCredentialParams,
  UpdateCredentialBody,
  DeleteCredentialParams,
  ToggleFavoriteParams,
  ListCredentialsQueryParams,
} from "@workspace/api-zod";
import { randomUUID } from "crypto";

const router: IRouter = Router();

router.get("/credentials", async (req, res): Promise<void> => {
  const parsed = ListCredentialsQueryParams.safeParse(req.query);
  const { type, favorites } = parsed.success ? parsed.data : {};

  let query = db.select().from(credentialsTable).orderBy(
    credentialsTable.favorite,
    credentialsTable.sortOrder,
    desc(credentialsTable.createdAt)
  );

  const rows = await query;
  const filtered = rows.filter((r) => {
    if (type && r.type !== type) return false;
    if (favorites && !r.favorite) return false;
    return true;
  });

  res.json(filtered.map(formatCredential));
});

router.post("/credentials", async (req, res): Promise<void> => {
  const parsed = CreateCredentialBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const d = parsed.data;
  const id = randomUUID();

  const [cred] = await db
    .insert(credentialsTable)
    .values({
      id,
      type: d.type,
      label: d.label,
      issuer: d.issuer,
      accountName: d.accountName,
      secret: d.secret ?? null,
      algorithm: d.algorithm ?? "SHA1",
      digits: d.digits ?? 6,
      period: d.period ?? 30,
      npub: d.npub ?? null,
      secretMode: d.secretMode ?? "none",
    })
    .returning();

  await db.insert(activityLogTable).values({
    id: randomUUID(),
    credentialId: id,
    credentialLabel: d.label,
    eventType: "credential_added",
    description: `Added ${d.type === "nostr" ? "Nostr identity" : "authenticator account"}: ${d.label}`,
  });

  res.status(201).json(formatCredential(cred));
});

router.get("/credentials/:id", async (req, res): Promise<void> => {
  const params = GetCredentialParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [cred] = await db
    .select()
    .from(credentialsTable)
    .where(eq(credentialsTable.id, params.data.id));

  if (!cred) {
    res.status(404).json({ error: "Credential not found" });
    return;
  }

  res.json(formatCredential(cred));
});

router.put("/credentials/:id", async (req, res): Promise<void> => {
  const params = UpdateCredentialParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpdateCredentialBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const updates: Record<string, unknown> = {};
  if (body.data.label !== undefined) updates.label = body.data.label;
  if (body.data.issuer !== undefined) updates.issuer = body.data.issuer;
  if (body.data.accountName !== undefined) updates.accountName = body.data.accountName;
  if (body.data.favorite !== undefined) updates.favorite = body.data.favorite;
  if (body.data.secretMode !== undefined) updates.secretMode = body.data.secretMode;

  const [cred] = await db
    .update(credentialsTable)
    .set(updates)
    .where(eq(credentialsTable.id, params.data.id))
    .returning();

  if (!cred) {
    res.status(404).json({ error: "Credential not found" });
    return;
  }

  res.json(formatCredential(cred));
});

router.delete("/credentials/:id", async (req, res): Promise<void> => {
  const params = DeleteCredentialParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [cred] = await db
    .delete(credentialsTable)
    .where(eq(credentialsTable.id, params.data.id))
    .returning();

  if (!cred) {
    res.status(404).json({ error: "Credential not found" });
    return;
  }

  await db.insert(activityLogTable).values({
    id: randomUUID(),
    credentialId: params.data.id,
    credentialLabel: cred.label,
    eventType: "credential_deleted",
    description: `Removed credential: ${cred.label}`,
  });

  res.sendStatus(204);
});

router.post("/credentials/:id/favorite", async (req, res): Promise<void> => {
  const params = ToggleFavoriteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(credentialsTable)
    .where(eq(credentialsTable.id, params.data.id));

  if (!existing) {
    res.status(404).json({ error: "Credential not found" });
    return;
  }

  const [cred] = await db
    .update(credentialsTable)
    .set({ favorite: !existing.favorite })
    .where(eq(credentialsTable.id, params.data.id))
    .returning();

  res.json(formatCredential(cred));
});

function formatCredential(cred: typeof credentialsTable.$inferSelect) {
  return {
    id: cred.id,
    type: cred.type,
    label: cred.label,
    issuer: cred.issuer,
    accountName: cred.accountName,
    algorithm: cred.algorithm,
    digits: cred.digits,
    period: cred.period,
    counter: cred.counter,
    npub: cred.npub,
    secretMode: cred.secretMode,
    favorite: cred.favorite,
    createdAt: cred.createdAt,
    lastUsedAt: cred.lastUsedAt,
  };
}

export default router;
