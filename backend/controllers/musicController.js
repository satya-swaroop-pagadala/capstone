import Music from "../models/musicModel.js";

// @desc    Get all music with optional filtering
// @route   GET /api/music
// @access  Public
export const getMusic = async (req, res) => {
  try {
    const { artist, genre, search, limit = 50, page = 1 } = req.query;
    const query = {};

    if (artist) {
      query.artist = new RegExp(artist, 'i'); // Case-insensitive search
    }

    if (genre) {
      query.genre = new RegExp(genre, 'i');
    }

    if (search) {
      query.$text = { $search: search };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const music = await Music.find(query)
      .sort({ popularity: -1 })
      .limit(parseInt(limit))
      .skip(skip);
    
    const total = await Music.countDocuments(query);
    
    res.json({
      music,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get music by artist
// @route   GET /api/music/artist/:artist
// @access  Public
export const getMusicByArtist = async (req, res) => {
  try {
    const { artist } = req.params;
    const { limit = 20 } = req.query;
    
    const music = await Music.find({ 
      artist: new RegExp(artist, 'i') 
    })
      .sort({ popularity: -1 })
      .limit(parseInt(limit));
    
    res.json(music);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all unique artists
// @route   GET /api/music/artists/all
// @access  Public
export const getAllArtists = async (req, res) => {
  try {
    const { search, limit = 50 } = req.query;
    let query = {};
    
    if (search) {
      query.artist = new RegExp(search, 'i');
    }
    
    const artists = await Music.aggregate([
      ...(search ? [{ $match: query }] : []),
      {
        $group: {
          _id: "$artist",
          trackCount: { $sum: 1 },
          avgPopularity: { $avg: "$popularity" }
        }
      },
      { $sort: { trackCount: -1 } },
      { $limit: parseInt(limit) }
    ]);
    
    res.json(artists.map(a => ({
      name: a._id,
      trackCount: a.trackCount,
      avgPopularity: Math.round(a.avgPopularity)
    })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get available genres
// @route   GET /api/music/genres/all
// @access  Public
export const getAllGenres = async (req, res) => {
  try {
    const genres = await Music.distinct("genre");
    res.json(genres.sort());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single music by ID
// @route   GET /api/music/:id
// @access  Public
export const getMusicById = async (req, res) => {
  try {
    const music = await Music.findById(req.params.id);

    if (music) {
      res.json(music);
    } else {
      res.status(404).json({ message: "Music not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new music
// @route   POST /api/music
// @access  Public
export const createMusic = async (req, res) => {
  try {
    const music = new Music(req.body);
    const createdMusic = await music.save();
    res.status(201).json(createdMusic);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update a music
// @route   PUT /api/music/:id
// @access  Public
export const updateMusic = async (req, res) => {
  try {
    const music = await Music.findById(req.params.id);

    if (music) {
      Object.assign(music, req.body);
      const updatedMusic = await music.save();
      res.json(updatedMusic);
    } else {
      res.status(404).json({ message: "Music not found" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a music
// @route   DELETE /api/music/:id
// @access  Public
export const deleteMusic = async (req, res) => {
  try {
    const music = await Music.findById(req.params.id);

    if (music) {
      await music.deleteOne();
      res.json({ message: "Music removed" });
    } else {
      res.status(404).json({ message: "Music not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
