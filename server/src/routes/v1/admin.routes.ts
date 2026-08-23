import { Router } from "express";
import * as admin from "../../controllers/admin.controller.js";
import { authenticate, requireAdmin } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import {
  adminUserStatusSchema,
  adminLineupStatusSchema,
  adminFeatureSchema,
  adminResolveReportSchema,
} from "../../validators/gamedata.schema.js";

const router = Router();

router.use(authenticate, requireAdmin);

router.get("/stats", admin.getStats);

router.get("/users", admin.listUsers);
router.patch(
  "/users/:id/status",
  validate(adminUserStatusSchema),
  admin.setUserStatus,
);

router.get("/lineups", admin.listAllLineups);
router.patch(
  "/lineups/:id/status",
  validate(adminLineupStatusSchema),
  admin.setLineupStatus,
);
router.patch(
  "/lineups/:id/feature",
  validate(adminFeatureSchema),
  admin.setLineupFeatured,
);
router.delete("/lineups/:id", admin.adminDeleteLineup);

router.delete("/comments/:id", admin.adminDeleteComment);

router.get("/reports", admin.listReports);
router.patch(
  "/reports/:id",
  validate(adminResolveReportSchema),
  admin.resolveReport,
);

router.post("/game-data/:entity", admin.createGameEntity);
router.put("/game-data/:entity/:id", admin.updateGameEntity);
router.delete("/game-data/:entity", admin.bulkDeleteGameEntities);
router.delete("/game-data/:entity/:id", admin.deleteGameEntity);

export default router;
