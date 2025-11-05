import express from "express";
import {
  getMovieRecommendations,
  getMusicRecommendations,
  trackInteraction,
  getLikedMovies,
  getLikedMusic,
} from "../controllers/recommendationController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get personalized recommendations
router.get("/movies", getMovieRecommendations);
router.get("/music", getMusicRecommendations);

// Track user interactions
router.post("/interact", trackInteraction);

// Get liked items
router.get("/liked/movies", getLikedMovies);
router.get("/liked/music", getLikedMusic);

export default router;
