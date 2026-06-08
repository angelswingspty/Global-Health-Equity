import { Router, type IRouter } from "express";
import healthRouter from "./health";
import contactRouter from "./contact";
import volunteerRouter from "./volunteer";
import newsletterRouter from "./newsletter";
import statsRouter from "./stats";
import blogRouter from "./blog";

const router: IRouter = Router();

router.use(healthRouter);
router.use(contactRouter);
router.use(volunteerRouter);
router.use(newsletterRouter);
router.use(statsRouter);
router.use(blogRouter);

export default router;
