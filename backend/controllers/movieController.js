import Movie from "../models/movieModel.js";

// Normalize incoming query params (string, array, comma-separated) into a clean array
const normalizeQueryValue = (value) => {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .flatMap((item) => String(item).split(","))
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed
          .flatMap((item) => String(item).split(","))
          .map((item) => item.trim())
          .filter(Boolean);
      }
    } catch (error) {
      // Ignore JSON parse errors and fall back to comma splitting
    }

    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [value].filter(Boolean);
};

// @desc    Get all movies with optional filtering
// @route   GET /api/movies
// @access  Public
export const getMovies = async (req, res) => {
  try {
    const { mood, genre, search, limit = 50, page = 1 } = req.query;
    const query = {};

    const genreFilters = normalizeQueryValue(genre);
    if (genreFilters.length > 0) {
      query.genre = { $in: genreFilters };
    }

    const moodFilters = normalizeQueryValue(mood);
    if (moodFilters.length > 0) {
      query.mood = { $in: moodFilters };
    }

    if (search) {
      query.$text = { $search: search };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const movies = await Movie.find(query)
      .sort({ popularity: -1, rating: -1 })
      .limit(parseInt(limit))
      .skip(skip);
    
    const total = await Movie.countDocuments(query);
    
    res.json({
      movies,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   GET /api/movies/mood/:mood
// @access  Public
export const getMoviesByMood = async (req, res) => {
  try {
    const { mood } = req.params;
    const { limit = 20 } = req.query;
    
    const movies = await Movie.find({ mood: { $in: [mood] } })
      .sort({ popularity: -1, rating: -1 })
      .limit(parseInt(limit));
    
    res.json(movies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get available moods
// @route   GET /api/movies/moods/all
// @access  Public
export const getAllMoods = async (req, res) => {
  try {
    const moods = await Movie.distinct("mood");
    res.json(moods.sort());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get available genres
// @route   GET /api/movies/genres/all
// @access  Public
export const getAllGenres = async (req, res) => {
  try {
    const genres = await Movie.distinct("genre");
    res.json(genres.sort());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get trending movies worldwide
// @route   GET /api/movies/trending
// @access  Public
export const getTrendingMovies = async (req, res) => {
  try {
    const { limit = 50, page = 1 } = req.query;
    const currentYear = new Date().getFullYear();
    
    // Get movies from recent years (last 3 years) sorted by popularity and rating
    const query = {
      releaseYear: { $gte: currentYear - 3 }
    };
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const movies = await Movie.find(query)
      .sort({ popularity: -1, voteCount: -1, rating: -1 })
      .limit(parseInt(limit))
      .skip(skip);
    
    const total = await Movie.countDocuments(query);
    
    res.json({
      movies,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single movie by ID
// @route   GET /api/movies/:id
// @access  Public
export const getMovieById = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);

    if (movie) {
      res.json(movie);
    } else {
      res.status(404).json({ message: "Movie not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new movie
// @route   POST /api/movies
// @access  Public
export const createMovie = async (req, res) => {
  try {
    const movie = new Movie(req.body);
    const createdMovie = await movie.save();
    res.status(201).json(createdMovie);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update a movie
// @route   PUT /api/movies/:id
// @access  Public
export const updateMovie = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);

    if (movie) {
      Object.assign(movie, req.body);
      const updatedMovie = await movie.save();
      res.json(updatedMovie);
    } else {
      res.status(404).json({ message: "Movie not found" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a movie
// @route   DELETE /api/movies/:id
// @access  Public
export const deleteMovie = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);

    if (movie) {
      await movie.deleteOne();
      res.json({ message: "Movie removed" });
    } else {
      res.status(404).json({ message: "Movie not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
