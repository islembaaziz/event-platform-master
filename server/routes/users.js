import express from "express";
import { protect, authorize } from "../middleware/auth.js";
import {
  createUser,
  deleteUser,
  getAllUsers,
  getUserProfile,
  getUserSettings,
  updateUser,
  updateUserProfile,
  updateUserRole,
  updateUserSettings,
} from "../controllers/usersControllers.js";

const router = express.Router();

// Get all users (admin only)
router.get("/", protect, authorize("administrator"), getAllUsers);

// Get user profile
router.get("/profile", protect, getUserProfile);

// Update user profile
router.put("/profile", protect, updateUserProfile);

// Create new user (admin only)
router.post("/", protect, authorize("administrator"), createUser);

// Update user (admin only)
router.put("/:id", protect, authorize("administrator"), updateUser);

// Update user role (admin only)
router.put(
  "/:id/role",
  protect,
  authorize("administrator"),
  updateUserRole
);

// Delete user (admin only)
router.delete(
  "/:id",
  protect,
  authorize("administrator"),
  deleteUser
);

// Get user settings
router.get("/settings", protect, getUserSettings);

// Update user settings
router.put("/settings", protect, updateUserSettings);

export default router;
