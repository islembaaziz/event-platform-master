import express from "express";
import { protect, authorize } from "../middleware/auth.js";
import {
  createUser,
  deleteUser,
  deleteOwnAccount,
  getAllUsers,
  getUserProfile,
  getUserSettings,
  updateUser,
  updateUserProfile,
  updateUserRole,
  updateUserSettings,
} from "../controllers/usersControllers.js";

const router = express.Router();

// ===== User Profile Routes =====
router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, updateUserProfile);

// ===== User Settings Routes =====
router.get("/settings", protect, getUserSettings);
router.put("/settings", protect, updateUserSettings);

// ===== Self Account Deletion (MUST BE BEFORE /:id) =====
router.delete("/account", protect, deleteOwnAccount);

// ===== Admin Routes =====
router.get("/", protect, authorize("administrator"), getAllUsers);
router.post("/", protect, authorize("administrator"), createUser);
router.put("/:id", protect, authorize("administrator"), updateUser);
router.put("/:id/role", protect, authorize("administrator"), updateUserRole);
router.delete("/:id", protect, authorize("administrator"), deleteUser);

export default router;
