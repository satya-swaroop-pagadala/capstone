import Favorite from "../models/favoriteModel.js";
import Movie from "../models/movieModel.js";
import Music from "../models/musicModel.js";

// @desc    Get all favorites for a user
// @route   GET /api/favorites
// @access  Private
const getFavorites = async (req, res) => {
  try {
    const userId = req.user._id;
    const favorites = await Favorite.find({ userId });
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

    const favorite = await Favorite.findOneAndDelete({
      userId,
      itemId,
      itemType,
    });

    if (!favorite) {
      return res.status(404).json({ message: "Favorite not found" });
    }

    console.log('Removed favorite by item:', { userId, itemId, itemType });
    res.json({ message: "Favorite removed" });
  } catch (error) {
    console.error('Error removing favorite by item:', error);
    res.status(500).json({ message: error.message });
  }
};
