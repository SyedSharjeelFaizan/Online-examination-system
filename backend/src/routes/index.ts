import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import examsRouter from "./exams";
import questionsRouter from "./questions";
import sessionsRouter from "./sessions";
import codeRouter from "./code";
import analyticsRouter from "./analytics";
import aiRouter from "./ai";
import notificationsRouter from "./notifications";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(examsRouter);
router.use(questionsRouter);
router.use(sessionsRouter);
router.use(codeRouter);
router.use(analyticsRouter);
router.use(aiRouter);
router.use(notificationsRouter);

export default router;
