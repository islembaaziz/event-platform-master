import express from "express";
import {
  protect,
  canManageContent,
  canModifyOwnContent,
} from "../middleware/auth.js";
import {
  checkLikeStatus,
  commentOnPublication,
  createPublication,
  deletePublication,
  getAllPublications,
  getPublicationById,
  likePublication,
  updatePublication,
} from "../controllers/publicationsControllers.js";

const router = express.Router();

// Get publications (public - all users can view)
router.get("/", getAllPublications);

// Get single publication (public - all users can view)
router.get("/:id", getPublicationById);

// Create publication (only organizers and administrators)
router.post("/", protect, canManageContent, createPublication);

// Update publication (only organizers and administrators, and only own content)
router.put("/:id", protect, canModifyOwnContent, updatePublication);

// Delete publication (only organizers and administrators, and only own content)
router.delete("/:id", protect, canModifyOwnContent, deletePublication);

// Like publication (all authenticated users can like)
router.post("/:id/like", protect, likePublication);

// Comment on publication (all authenticated users can comment)
router.post("/:id/comment", protect, commentOnPublication);

// Check if user liked publication
router.get("/:id/like-status", protect, checkLikeStatus);

export default router;
