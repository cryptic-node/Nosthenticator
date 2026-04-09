import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, credentialsTable } from "@workspace/db";
import { GetCodeParams } from "@workspace/api-zod";
import { generateTOTP, generateHOTPCode } from "../lib/totp";

const router: IRouter = Router();

function buildLiveCode(cred: typeof credentialsTable.$inferSelect) {
  const secret = cred.secret ?? "JBSWY3DPEHPK3PXP";
  const digits = cred.digits ?? 6;
  const period = cred.period ?? 30;
  const algorithm = cred.algorithm ?? "SHA1";
  const counter = cred.counter ?? 0;

  let code: string;
  let timeRemaining: number;

  if (cred.type === "hotp") {
    code = generateHOTPCode(secret, counter, digits, algorithm);
    timeRemaining = 0; // HOTP doesn't expire by time
  } else {
    const result = generateTOTP(secret, digits, period, algorithm);
    code = result.code;
    timeRemaining = result.timeRemaining;
  }

  return {
    credentialId: cred.id,
    label: cred.label,
    issuer: cred.issuer,
    code,
    timeRemaining,
    period: period,
    digits,
    favorite: cred.favorite,
  };
}

router.get("/codes", async (_req, res): Promise<void> => {
  const creds = await db
    .select()
    .from(credentialsTable)
    .where(eq(credentialsTable.type, "totp"));

  const hotpCreds = await db
    .select()
    .from(credentialsTable)
    .where(eq(credentialsTable.type, "hotp"));

  const allCodes = [...creds, ...hotpCreds].map(buildLiveCode);

  // Sort favorites first, then by label
  allCodes.sort((a, b) => {
    if (a.favorite && !b.favorite) return -1;
    if (!a.favorite && b.favorite) return 1;
    return a.label.localeCompare(b.label);
  });

  res.json(allCodes);
});

router.get("/codes/:id", async (req, res): Promise<void> => {
  const params = GetCodeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [cred] = await db
    .select()
    .from(credentialsTable)
    .where(eq(credentialsTable.id, params.data.id));

  if (!cred || (cred.type !== "totp" && cred.type !== "hotp")) {
    res.status(404).json({ error: "TOTP/HOTP credential not found" });
    return;
  }

  res.json(buildLiveCode(cred));
});

export default router;
