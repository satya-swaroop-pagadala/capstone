import express from "express";
import {
  getMovieRecommendations,
  getMusicRecommendations,
  trackInteraction,
  getLikedMovies,
  getLikedMusic,
  getCollaborativeMovies,
  getCollaborativeMusic,
  auditCFData,
  getUserCollaborativeRecommendations,
} from "../controllers/recommendationController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Simple user-user collaborative filtering (public for testing - no auth required)
router.get("/user/:userId", getUserCollaborativeRecommendations);

// All other routes require authentication
router.use(protect);

// Get personalized recommendations (hybrid)
router.get("/movies", getMovieRecommendations);
router.get("/music", getMusicRecommendations);

// Get collaborative filtering recommendations (pure CF)
router.get("/collaborative/movies", getCollaborativeMovies);
router.get("/collaborative/music", getCollaborativeMusic);

// Audit CF data readiness
router.get("/collaborative/audit", auditCFData);

// Track user interactions
router.post("/interact", trackInteraction);

// Get liked items
router.get("/liked/movies", getLikedMovies);
router.get("/liked/music", getLikedMusic);

export default router;
