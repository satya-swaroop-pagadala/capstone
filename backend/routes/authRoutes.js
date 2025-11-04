import express from "express";
import {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  getUsers,
} from "../controllers/authController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/signup", registerUser);
router.post("/login", loginUser);
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);
router.get("/users", protect, admin, getUsers);

export default router;
