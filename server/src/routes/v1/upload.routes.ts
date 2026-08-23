import { Router } from "express";
import * as uploads from "../../controllers/upload.controller.js";
import { authenticate } from "../../middleware/auth.js";
import { upload } from "../../middleware/upload.js";
import { uploadLimiter } from "../../middleware/rateLimiters.js";

const router = Router();

router.post(
  "/image",
  uploadLimiter,
  authenticate,
  upload.single("image"),
  uploads.uploadImageHandler,
);
router.delete("/image", authenticate, uploads.deleteImageHandler);

export default router;
