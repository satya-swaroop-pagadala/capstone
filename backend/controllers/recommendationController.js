import asyncHandler from "express-async-handler";
import recommendationService from "../services/recommendationService.js";

/**
 * @desc    Get personalized movie recommendations
 * @route   GET /api/recommendations/movies
 * @access  Private
 */
export const getMovieRecommendations = asyncHandler(async (req, res) => {
  const { mood, limit = 20 } = req.query;
  const userId = req.user._id;

  const recommendations = await recommendationService.getMovieRecommendations(
    userId,
    mood,
    parseInt(limit)
  );

  res.json({
    success: true,
    data: recommendations,
  });
});

/**
 * @desc    Get personalized music recommendations
 * @route   GET /api/recommendations/music
 * @access  Private
 */
export const getMusicRecommendations = asyncHandler(async (req, res) => {
  const { mood, limit = 20 } = req.query;
  const userId = req.user._id;

  const recommendations = await recommendationService.getMusicRecommendations(
    userId,
    mood,
    parseInt(limit)
  );

  res.json({
    success: true,
    data: recommendations,
  });
});

/**
 * @desc    Track user interaction (like, view, rating)
 * @route   POST /api/recommendations/interact
 * @access  Private
 */
export const trackInteraction = asyncHandler(async (req, res) => {
  const { itemId, itemType, interactionType, rating, mood, duration } = req.body;
  const userId = req.user._id;

  if (!itemId || !itemType || !interactionType) {
    res.status(400);
    throw new Error("Please provide itemId, itemType, and interactionType");
  }

  const interaction = await recommendationService.trackInteraction(
    userId,
    itemId,
    itemType,
    interactionType,
    { rating, mood, duration }
  );

  res.status(201).json({
    success: true,
    data: interaction,
  });
});

/**
 * @desc    Get user's liked movies
 * @route   GET /api/recommendations/liked/movies
 * @access  Private
 */
export const getLikedMovies = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const likedMovies = await recommendationService.getLikedMovies(userId);

  res.json({
    success: true,
    data: likedMovies,
  });
});

/**
 * @desc    Get user's liked music
 * @route   GET /api/recommendations/liked/music
 * @access  Private
 */
export const getLikedMusic = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const likedMusic = await recommendationService.getLikedMusic(userId);

  res.json({
    success: true,
    data: likedMusic,
  });
});
