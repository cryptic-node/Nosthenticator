import { Router, type IRouter } from "express";
import healthRouter from "./health";
import keysRouter from "./keys";
import signingRouter from "./signing";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use(keysRouter);
router.use(signingRouter);
router.use(statsRouter);

export default router;
