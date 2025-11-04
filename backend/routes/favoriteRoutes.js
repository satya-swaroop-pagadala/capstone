import express from "express";
import {
  getFavorites,
  addFavorite,
  removeFavorite,
  removeFavoriteByItem,
} from "../controllers/favoriteController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Allow both authenticated and guest access for favorites
router.route("/").get(getFavorites).post(addFavorite);
router.route("/:id").delete(removeFavorite);
router.route("/item/:itemId").delete(removeFavoriteByItem);

export default router;
