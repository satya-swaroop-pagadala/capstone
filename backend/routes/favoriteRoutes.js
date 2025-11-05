import express from "express";
import {
  getFavorites,
  addFavorite,
  removeFavorite,
  removeFavoriteByItem,
} from "../controllers/favoriteController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Protected routes - require authentication
router.route("/").get(protect, getFavorites).post(protect, addFavorite);
router.route("/:id").delete(protect, removeFavorite);
router.route("/item/:itemId").delete(protect, removeFavoriteByItem);

export default router;
