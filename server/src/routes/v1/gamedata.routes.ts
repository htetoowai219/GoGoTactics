import { Router } from "express";
import * as gamedata from "../../controllers/gamedata.controller.js";

const router = Router();

router.get("/all", gamedata.getAllGameData);
router.get("/:entity", gamedata.listResource);

export default router;
