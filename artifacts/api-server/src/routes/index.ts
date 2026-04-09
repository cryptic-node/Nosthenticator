import { Router, type IRouter } from "express";
import healthRouter from "./health";
import credentialsRouter from "./credentials";
import codesRouter from "./codes";
import nostrRouter from "./nostr";
import activityRouter from "./activity";
import vaultRouter from "./vault";

const router: IRouter = Router();

router.use(healthRouter);
router.use(credentialsRouter);
router.use(codesRouter);
router.use(nostrRouter);
router.use(activityRouter);
router.use(vaultRouter);

export default router;
