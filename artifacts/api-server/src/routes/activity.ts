import { Router, type IRouter } from "express";
import { eq, desc, sql } from "drizzle-orm";
import { db, activityLogTable } from "@workspace/db";
import { GetActivityQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/activity", async (req, res): Promise<void> => {
  const parsed = GetActivityQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { limit = 50, offset = 0, credentialId } = parsed.data;

  const baseQuery = db.select().from(activityLogTable);
  const withWhere = credentialId
    ? baseQuery.where(eq(activityLogTable.credentialId, credentialId))
    : baseQuery;
  const entries = await withWhere
    .orderBy(desc(activityLogTable.timestamp))
    .limit(limit)
    .offset(offset);

  const countQuery = credentialId
    ? db.select({ count: sql<number>`count(*)::int` }).from(activityLogTable)
        .where(eq(activityLogTable.credentialId, credentialId))
    : db.select({ count: sql<number>`count(*)::int` }).from(activityLogTable);

  const [{ count: total }] = await countQuery;

  res.json({ entries, total });
});

export default router;
