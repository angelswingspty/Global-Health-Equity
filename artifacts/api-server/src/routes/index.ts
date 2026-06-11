import { Router, type IRouter } from "express";
import healthRouter from "./health";
import contactRouter from "./contact";
import volunteerRouter from "./volunteer";
import newsletterRouter from "./newsletter";
import statsRouter from "./stats";
import blogRouter from "./blog";
import telehealthAuthRouter from "./telehealth-auth";
import telehealthAppointmentsRouter from "./telehealth-appointments";
import telehealthMessagesRouter from "./telehealth-messages";
import telehealthDocumentsRouter from "./telehealth-documents";
import telehealthPrescriptionsRouter from "./telehealth-prescriptions";
import telehealthAdminRouter from "./telehealth-admin";
import patientIntakeRouter from "./patient-intake";
import volunteerAuthRouter from "./volunteer-auth";
import volunteerPortalRouter from "./volunteer-portal";

const router: IRouter = Router();

router.use(healthRouter);
router.use(contactRouter);
router.use(volunteerRouter);
router.use(newsletterRouter);
router.use(statsRouter);
router.use(blogRouter);
router.use(telehealthAuthRouter);
router.use(telehealthAppointmentsRouter);
router.use(telehealthMessagesRouter);
router.use(telehealthDocumentsRouter);
router.use(telehealthPrescriptionsRouter);
router.use(telehealthAdminRouter);
router.use(patientIntakeRouter);
router.use(volunteerAuthRouter);
router.use(volunteerPortalRouter);

export default router;
