import { Router } from "express";
import * as reports from "../../controllers/report.controller.js";
import { authenticate } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { reportSchema } from "../../validators/interaction.schema.js";

const router = Router();

router.post("/", authenticate, validate(reportSchema), reports.createReport);
router.get("/me", authenticate, reports.listMyReports);

export default router;
