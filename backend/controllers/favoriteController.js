import Favorite from "../models/favoriteModel.js";
import Movie from "../models/movieModel.js";
import Music from "../models/musicModel.js";

// @desc    Get all favorites for a user
// @route   GET /api/favorites
// @access  Private
export const getFavorites = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : req.query.userId || "guest";
    const favorites = await Favorite.find({ userId })
      .populate("itemId")
      .sort({ createdAt: -1 });

    res.json(favorites);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add a favorite
// @route   POST /api/favorites
// @access  Private
export const addFavorite = async (req, res) => {
  try {
    const { itemId, itemType } = req.body;
    const userId = req.user ? req.user._id : req.body.userId || "guest";

    // Check if item exists
    const Model = itemType === "Movie" ? Movie : Music;
    const item = await Model.findById(itemId);

    if (!item) {
      return res.status(404).json({ message: `${itemType} not found` });
    }

    // Check if already favorited
    const existingFavorite = await Favorite.findOne({ userId, itemId, itemType });

    if (existingFavorite) {
      return res.status(400).json({ message: "Already in favorites" });
    }

    const favorite = new Favorite({
      userId,
      itemId,
      itemType,
    });

    const createdFavorite = await favorite.save();
    const populatedFavorite = await Favorite.findById(createdFavorite._id).populate("itemId");

    res.status(201).json(populatedFavorite);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Remove a favorite
// @route   DELETE /api/favorites/:id
// @access  Public
export const removeFavorite = async (req, res) => {
  try {
    const favorite = await Favorite.findById(req.params.id);

    if (favorite) {
      await favorite.deleteOne();
      res.json({ message: "Favorite removed" });
    } else {
      res.status(404).json({ message: "Favorite not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove favorite by itemId and itemType
// @route   DELETE /api/favorites/item/:itemId
// @access  Public
export const removeFavoriteByItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { itemType, userId = "guest" } = req.query;

    const favorite = await Favorite.findOneAndDelete({ userId, itemId, itemType });

    if (favorite) {
      res.json({ message: "Favorite removed" });
    } else {
      res.status(404).json({ message: "Favorite not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
