import { Router, type IRouter } from "express";
import { eq, sql, and, gte } from "drizzle-orm";
import { db, nostrKeysTable, signingRequestsTable, auditLogTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/stats/summary", async (_req, res): Promise<void> => {
  const [
    keysResult,
    signedResult,
    rejectedResult,
    pendingResult,
    todayResult,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(nostrKeysTable),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(auditLogTable)
      .where(eq(auditLogTable.action, "approved")),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(auditLogTable)
      .where(eq(auditLogTable.action, "rejected")),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(signingRequestsTable)
      .where(eq(signingRequestsTable.status, "pending")),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(auditLogTable)
      .where(
        and(
          eq(auditLogTable.action, "approved"),
          gte(auditLogTable.timestamp, sql`now() - interval '1 day'`)
        )
      ),
  ]);

  res.json({
    totalKeys: keysResult[0]?.count ?? 0,
    totalSigned: signedResult[0]?.count ?? 0,
    totalRejected: rejectedResult[0]?.count ?? 0,
    pendingCount: pendingResult[0]?.count ?? 0,
    todaySigned: todayResult[0]?.count ?? 0,
  });
});

router.get("/stats/activity", async (_req, res): Promise<void> => {
  const rows = await db.execute(sql`
    SELECT
      date_trunc('day', timestamp)::date::text AS date,
      SUM(CASE WHEN action = 'approved' THEN 1 ELSE 0 END)::int AS approved,
      SUM(CASE WHEN action = 'rejected' THEN 1 ELSE 0 END)::int AS rejected
    FROM audit_log
    WHERE timestamp >= now() - interval '30 days'
    GROUP BY date_trunc('day', timestamp)
    ORDER BY date_trunc('day', timestamp) ASC
  `);

  res.json(rows.rows);
});

export default router;
