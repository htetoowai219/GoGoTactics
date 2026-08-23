import multer from "multer";
import { ApiError } from "../utils/ApiError.js";

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 5 * 1024 * 1024;

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE, files: 1 },
  fileFilter(_req, file, cb) {
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      cb(new ApiError(400, "Only JPEG, PNG, WebP or GIF images are allowed"));
      return;
    }
    cb(null, true);
  },
});
