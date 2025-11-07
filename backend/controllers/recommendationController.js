import asyncHandler from "express-async-handler";
import recommendationService from "../services/recommendationService.js";
import collaborativeFilteringService from "../services/collaborativeFilteringService.js";
import User from "../models/userModel.js";
import Movie from "../models/movieModel.js";
import Music from "../models/musicModel.js";
import { getCollaborativeRecommendations } from "../utils/collaborativeFiltering.js";

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

/**
 * @desc    Get collaborative filtering movie recommendations
 * @route   GET /api/recommendations/collaborative/movies
 * @access  Private
 */
export const getCollaborativeMovies = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const {
    k = 30,
    limit = 20,
    minOverlap = 2,
    similarityMetric = "cosine",
  } = req.query;

  const result = await collaborativeFilteringService.getCollaborativeMovieRecommendations(
    userId,
    {
      k: parseInt(k),
      limit: parseInt(limit),
      minOverlap: parseInt(minOverlap),
      similarityMetric,
    }
  );

  // If no CF recommendations, fall back to content-based
  if (result.recommendations.length === 0) {
    const fallback = await recommendationService.getMovieRecommendations(
      userId,
      null,
      parseInt(limit)
    );

    return res.json({
      success: true,
      source: "fallback_content_based",
      reason: result.reason || "cf_failed",
      message: result.message || "Collaborative filtering returned no results. Using content-based recommendations.",
      data: {
        recommendations: fallback.recommendations || [],
        neighbors: [],
        stats: result.stats,
      },
    });
  }

  res.json({
    success: true,
    source: "collaborative_filtering",
    data: result,
  });
});

/**
 * @desc    Get collaborative filtering music recommendations
 * @route   GET /api/recommendations/collaborative/music
 * @access  Private
 */
export const getCollaborativeMusic = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const {
    k = 30,
    limit = 20,
    minOverlap = 2,
    similarityMetric = "cosine",
  } = req.query;

  const result = await collaborativeFilteringService.getCollaborativeMusicRecommendations(
    userId,
    {
      k: parseInt(k),
      limit: parseInt(limit),
      minOverlap: parseInt(minOverlap),
      similarityMetric,
    }
  );

  // If no CF recommendations, fall back to content-based
  if (result.recommendations.length === 0) {
    const fallback = await recommendationService.getMusicRecommendations(
      userId,
      null,
      parseInt(limit)
    );

    return res.json({
      success: true,
      source: "fallback_content_based",
      reason: result.reason || "cf_failed",
      message: result.message || "Collaborative filtering returned no results. Using content-based recommendations.",
      data: {
        recommendations: fallback.recommendations || [],
        neighbors: [],
        stats: result.stats,
      },
    });
  }

  res.json({
    success: true,
    source: "collaborative_filtering",
    data: result,
  });
});

/**
 * @desc    Audit collaborative filtering data readiness
 * @route   GET /api/recommendations/collaborative/audit
 * @access  Private (Admin recommended)
 */
export const auditCFData = asyncHandler(async (req, res) => {
  const audit = await collaborativeFilteringService.auditCollaborativeFilteringData();

  res.json({
    success: true,
    data: audit,
  });
});

/**
 * @desc    Get simple user-user collaborative filtering recommendations
 * @route   GET /api/recommendations/user/:userId
 * @access  Public (for testing)
 */
export const getUserCollaborativeRecommendations = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Fetch all users with their liked items
    const users = await User.find({}).select('likedMovies likedMusic');
    
    // Get recommended item IDs
    const recommendedIds = getCollaborativeRecommendations(users, userId);
    
    // Fetch the actual movie and music documents
    const movies = await Movie.find({ _id: { $in: recommendedIds } });
    const music = await Music.find({ _id: { $in: recommendedIds } });
    
    res.json({ 
      success: true,
      movies, 
      music,
      totalRecommendations: movies.length + music.length
    });
  } catch (err) {
    console.error('Error in getUserCollaborativeRecommendations:', err);
    res.status(500).json({ 
      success: false,
      error: "Error generating recommendations",
      message: err.message 
    });
  }
});
