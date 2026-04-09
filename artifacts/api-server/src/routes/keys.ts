import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, nostrKeysTable } from "@workspace/db";
import {
  CreateKeyBody,
  GetKeyParams,
  DeleteKeyParams,
} from "@workspace/api-zod";
import { randomUUID } from "crypto";

const router: IRouter = Router();

router.get("/keys", async (req, res): Promise<void> => {
  const keys = await db
    .select()
    .from(nostrKeysTable)
    .orderBy(desc(nostrKeysTable.createdAt));
  res.json(keys);
});

router.post("/keys", async (req, res): Promise<void> => {
  const parsed = CreateKeyBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const id = randomUUID();
  const [key] = await db
    .insert(nostrKeysTable)
    .values({ id, ...parsed.data })
    .returning();

  res.status(201).json(key);
});

router.get("/keys/:id", async (req, res): Promise<void> => {
  const params = GetKeyParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [key] = await db
    .select()
    .from(nostrKeysTable)
    .where(eq(nostrKeysTable.id, params.data.id));

  if (!key) {
    res.status(404).json({ error: "Key not found" });
    return;
  }

  res.json(key);
});

router.delete("/keys/:id", async (req, res): Promise<void> => {
  const params = DeleteKeyParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [key] = await db
    .delete(nostrKeysTable)
    .where(eq(nostrKeysTable.id, params.data.id))
    .returning();

  if (!key) {
    res.status(404).json({ error: "Key not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
