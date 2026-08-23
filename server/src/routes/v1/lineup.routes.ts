import { Router } from "express";
import * as lineups from "../../controllers/lineup.controller.js";
import * as comments from "../../controllers/comment.controller.js";
import { authenticate, optionalAuth } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import {
  createLineupSchema,
  updateLineupSchema,
} from "../../validators/lineup.schema.js";
import {
  createCommentSchema,
  ratingSchema,
} from "../../validators/interaction.schema.js";

const router = Router();

router.get("/", optionalAuth, lineups.listLineupsHandler);
router.get("/featured", lineups.getFeatured);
router.post(
  "/",
  authenticate,
  validate(createLineupSchema),
  lineups.createLineup,
);

router.get("/:slug", optionalAuth, lineups.getLineupBySlug);
router.get("/by-id/:id/edit", authenticate, lineups.getLineupByIdForEdit);
router.put(
  "/:id",
  authenticate,
  validate(updateLineupSchema),
  lineups.updateLineup,
);
router.delete("/:id", authenticate, lineups.deleteLineup);

router.post("/:id/like", authenticate, lineups.likeLineup);
router.delete("/:id/like", authenticate, lineups.unlikeLineup);
router.post("/:id/save", authenticate, lineups.saveLineup);
router.delete("/:id/save", authenticate, lineups.unsaveLineup);
router.put(
  "/:id/rating",
  authenticate,
  validate(ratingSchema),
  lineups.rateLineup,
);
router.post("/:id/view", lineups.trackView);

router.get("/:id/comments", optionalAuth, comments.listComments);
router.post(
  "/:id/comments",
  authenticate,
  validate(createCommentSchema),
  comments.createComment,
);

export default router;
