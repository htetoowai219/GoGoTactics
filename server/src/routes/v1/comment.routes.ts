import { Router } from "express";
import * as comments from "../../controllers/comment.controller.js";
import { authenticate } from "../../middleware/auth.js";

const router = Router();

router.post("/:id/like", authenticate, comments.likeComment);
router.delete("/:id", authenticate, comments.deleteComment);

export default router;
