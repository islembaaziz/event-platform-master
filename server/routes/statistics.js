import express from "express";
import { protect, authorize } from "../middleware/auth.js";
import { getOverallStatistics } from "../controllers/statisticsController.js";

const router = express.Router();

router.get("/", protect, authorize("organizer", "administrator"), getOverallStatistics);

export default router;
