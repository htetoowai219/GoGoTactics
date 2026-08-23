import { Router } from "express";
import authRoutes from "./auth.routes.js";
import userRoutes from "./user.routes.js";
import lineupRoutes from "./lineup.routes.js";
import commentRoutes from "./comment.routes.js";
import reportRoutes from "./report.routes.js";
import gamedataRoutes from "./gamedata.routes.js";
import searchRoutes from "./search.routes.js";
import uploadRoutes from "./upload.routes.js";
import adminRoutes from "./admin.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/lineups", lineupRoutes);
router.use("/comments", commentRoutes);
router.use("/reports", reportRoutes);
router.use("/game-data", gamedataRoutes);
router.use("/search", searchRoutes);
router.use("/uploads", uploadRoutes);
router.use("/admin", adminRoutes);

export default router;
