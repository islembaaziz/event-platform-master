import express from "express";
import {
  protect,
  canManageContent,
  canModifyOwnContent,
} from "../middleware/auth.js";
import {
  checkLikeStatus,
  commentOnEvent,
  createEvent,
  deleteEvent,
  getAllEvents,
  getEventById,
  getEventComments,
  likeEvent,
  updateEvent,
} from "../controllers/eventsControllers.js";

const router = express.Router();

// Get all events (public - all users can view)
router.get("/", getAllEvents);

// Get single event (public - all users can view)
router.get("/:id", getEventById);

// Create new event (only organizers and administrators)
router.post("/", protect, canManageContent, createEvent);

// Update event (only organizers and administrators, and only own content)
router.put("/:id", protect, canModifyOwnContent, updateEvent);

// Delete event (only organizers and administrators, and only own content)
router.delete("/:id", protect, canModifyOwnContent, deleteEvent);

// Like event (all authenticated users can like)
router.post("/:id/like", protect, likeEvent);

// Comment on event (all authenticated users can comment)
router.post("/:id/comment", protect, commentOnEvent);

// Get event comments (public)
router.get("/:id/comments", getEventComments);

// Check if user liked event (requires authentication)
router.get("/:id/like-status", protect, checkLikeStatus);

export default router;
