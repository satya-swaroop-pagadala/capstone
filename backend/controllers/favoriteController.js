import Favorite from "../models/favoriteModel.js";
import Movie from "../models/movieModel.js";
import Music from "../models/musicModel.js";
import User from "../models/userModel.js";
import UserInteraction from "../models/userInteractionModel.js";

// @desc    Get all favorites for a user
// @route   GET /api/favorites
// @access  Private
const getFavorites = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log('🔍 getFavorites - userId:', userId);
    console.log('🔍 getFavorites - user email:', req.user.email);
    
    const favorites = await Favorite.find({ userId });
    console.log('🔍 getFavorites - found favorites:', favorites.length);
    console.log('🔍 getFavorites - favorite userIds:', favorites.map(f => f.userId.toString()));
    
    res.json({ favorites });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add a favorite
// @route   POST /api/favorites
// @access  Private
const addFavorite = async (req, res) => {
  try {
    const { itemId, itemType, title, posterPath, rating, releaseDate, artist } = req.body;
    
    // Get userId from authenticated user
    const userId = req.user._id;

    // Check if already favorited
    const existingFavorite = await Favorite.findOne({
      userId,
      itemId,
      itemType,
    });

    if (existingFavorite) {
      return res
        .status(400)
        .json({ message: "Item already in favorites" });
    }

    const favorite = await Favorite.create({
      userId,
      itemId,
      itemType,
      title,
      posterPath,
      rating,
      releaseDate,
      artist,
    });

    // Also add to User's likedMovies or likedMusic array for collaborative filtering
    if (itemType === 'Movie') {
      await User.findByIdAndUpdate(userId, {
        $addToSet: { likedMovies: itemId }
      });
    } else if (itemType === 'Music') {
      await User.findByIdAndUpdate(userId, {
        $addToSet: { likedMusic: itemId }
      });
    }

    console.log('Added favorite:', { userId, itemId, itemType });
    res.status(201).json({ favorite });
  } catch (error) {
    console.error('Error adding favorite:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove a favorite by ID
// @route   DELETE /api/favorites/:id
// @access  Private
const removeFavorite = async (req, res) => {
  try {
    const userId = req.user._id;
    const favorite = await Favorite.findOne({ _id: req.params.id, userId });

    if (!favorite) {
      return res.status(404).json({ message: "Favorite not found" });
    }

    // Remove from User's likedMovies or likedMusic array
    if (favorite.itemType === 'Movie') {
      await User.findByIdAndUpdate(userId, {
        $pull: { likedMovies: favorite.itemId }
      });
    } else if (favorite.itemType === 'Music') {
      await User.findByIdAndUpdate(userId, {
        $pull: { likedMusic: favorite.itemId }
      });
    }

    // Remove related interaction records so analytics stay in sync
    await UserInteraction.deleteMany({
      user: userId,
      itemId: favorite.itemId,
      itemType: { $in: [favorite.itemType, favorite.itemType?.toLowerCase(), favorite.itemType?.toUpperCase()] },
      interactionType: { $in: ["like", "favorite"] },
    });

    await favorite.deleteOne();
    console.log('Removed favorite:', { userId, favoriteId: req.params.id });
    res.json({ message: "Favorite removed" });
  } catch (error) {
    console.error('Error removing favorite:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove a favorite by item
// @route   DELETE /api/favorites/item/:itemId
// @access  Private
const removeFavoriteByItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { itemType } = req.query;
    const userId = req.user._id;

    const normalizedType = typeof itemType === 'string' ? itemType.trim() : '';
    const candidateTypes = normalizedType
      ? Array.from(new Set([
          normalizedType,
          normalizedType.toLowerCase(),
          normalizedType.toUpperCase(),
          normalizedType.charAt(0).toUpperCase() + normalizedType.slice(1).toLowerCase(),
        ]))
      : [];

    console.log('🔍 removeFavoriteByItem attempt:', {
      userId: userId?.toString(),
      itemId,
      itemTypeCandidates: candidateTypes,
    });

    const favorite = await Favorite.findOne({
      userId,
      itemId,
      ...(candidateTypes.length
        ? { itemType: { $in: candidateTypes } }
        : {}),
    });

    if (!favorite) {
      console.warn('⚠️ Favorite not found for removal', {
        userId: userId?.toString(),
        itemId,
        requestedType: itemType,
      });
      return res.status(404).json({ message: "Favorite not found" });
    }

    await favorite.deleteOne();

    // Remove from User's likedMovies or likedMusic array
    const effectiveType = favorite.itemType || normalizedType;
    if (effectiveType?.toLowerCase() === 'movie') {
      await User.findByIdAndUpdate(userId, {
        $pull: { likedMovies: itemId }
      });
    } else if (effectiveType?.toLowerCase() === 'music') {
      await User.findByIdAndUpdate(userId, {
        $pull: { likedMusic: itemId }
      });
    }

    // Remove related interaction records to keep liked lists in sync
    const interactionTypeCandidates = effectiveType
      ? [effectiveType, effectiveType.toLowerCase(), effectiveType.toUpperCase()]
      : candidateTypes;

    await UserInteraction.deleteMany({
      user: userId,
      itemId: favorite.itemId,
      ...(interactionTypeCandidates.length
        ? { itemType: { $in: interactionTypeCandidates } }
        : {}),
      interactionType: { $in: ["like", "favorite"] },
    });

    console.log('Removed favorite by item:', { userId, itemId, itemType: favorite.itemType });
    res.json({ message: "Favorite removed" });
  } catch (error) {
    console.error('Error removing favorite by item:', error);
    res.status(500).json({ message: error.message });
  }
};

export { getFavorites, addFavorite, removeFavorite, removeFavoriteByItem };
