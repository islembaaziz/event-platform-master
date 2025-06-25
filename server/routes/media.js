import express from "express";
import {
  protect,
  canManageContent,
  canModifyOwnContent,
} from "../middleware/auth.js";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import {
  checkLikeStatus,
  commentOnMediaItem,
  deleteMediaItem,
  getMediaItemById,
  getMediaItems,
  likeMediaItem,
  updateMediaItem,
} from "../controllers/mediaControllers.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Get media items (public - all users can view)
router.get("/", getMediaItems);

// Upload media (only organizers and administrators)
router.post("/upload", protect, canManageContent, getMediaItemById);

// Update media item (only organizers and administrators, and only own content)
router.put("/:id", protect, canModifyOwnContent, updateMediaItem);

// Delete media item (only organizers and administrators, and only own content)
router.delete("/:id", protect, canModifyOwnContent, deleteMediaItem);

// Like media (all authenticated users can like)
router.post("/:id/like", protect, likeMediaItem);

// Comment on media (all authenticated users can comment)
router.post("/:id/comment", protect, commentOnMediaItem);

// Check if user liked media
router.get("/:id/like-status", protect, checkLikeStatus);

export default router;
