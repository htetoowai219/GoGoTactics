import { Router } from "express";
import * as users from "../../controllers/user.controller.js";
import { authenticate, optionalAuth } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import {
  updateProfileSchema,
  changePasswordSchema,
} from "../../validators/auth.schema.js";

const router = Router();

router.get("/me/saved", authenticate, users.getSavedLineups);
router.get("/me/liked", authenticate, users.getLikedLineups);
router.put("/me", authenticate, validate(updateProfileSchema), users.updateProfile);
router.put(
  "/me/password",
  authenticate,
  validate(changePasswordSchema),
  users.changePassword,
);

router.get("/:username", optionalAuth, users.getProfile);
router.get("/:username/lineups", optionalAuth, users.getUserLineups);
router.post("/:id/follow", authenticate, users.followUser);
router.delete("/:id/follow", authenticate, users.unfollowUser);

export default router;
