import UserInteraction from "../models/userInteractionModel.js";
import Movie from "../models/movieModel.js";
import Music from "../models/musicModel.js";
import collaborativeFilteringService from "./collaborativeFilteringService.js";

/**
 * Hybrid Recommendation System
 * Combines Content-Based, Collaborative, and Mood-Based filtering
 */

class RecommendationEngine {
  /**
   * Get personalized movie recommendations
   * @param {String} userId - User ID
   * @param {String} mood - Optional mood filter
   * @param {Number} limit - Number of recommendations
   */
  async getMovieRecommendations(userId, mood = null, limit = 20) {
    try {
      // 1. Content-Based Recommendations (40% weight)
      const contentBased = await this.getContentBasedMovies(userId, limit);

      // 2. Collaborative Filtering (30% weight)
      const collaborative = await this.getCollaborativeMovies(userId, limit);

      // 3. Mood-Based Recommendations (30% weight)
      const moodBased = mood
        ? await this.getMoodBasedMovies(userId, mood, limit)
        : [];

      // 4. Combine and score recommendations
      const combined = this.combineRecommendations(
        [
          { items: contentBased, weight: 0.4 },
          { items: collaborative, weight: 0.3 },
          { items: moodBased, weight: mood ? 0.3 : 0 },
        ],
        limit
      );

      // 5. Get liked movies for display
      const likedMovies = await this.getLikedMovies(userId);

      return {
        recommendations: combined,
        liked: likedMovies,
        mood: mood,
      };
    } catch (error) {
      console.error("Error getting movie recommendations:", error);
      throw error;
    }
  }

  /**
   * Get personalized music recommendations
   * @param {String} userId - User ID
   * @param {String} mood - Optional mood filter
   * @param {Number} limit - Number of recommendations
   */
  async getMusicRecommendations(userId, mood = null, limit = 20) {
    try {
      // 1. Content-Based Recommendations (40% weight)
      const contentBased = await this.getContentBasedMusic(userId, limit);

      // 2. Collaborative Filtering (30% weight)
      const collaborative = await this.getCollaborativeMusic(userId, limit);

      // 3. Mood-Based Recommendations (30% weight)
      const moodBased = mood
        ? await this.getMoodBasedMusic(userId, mood, limit)
        : [];

      // 4. Combine and score recommendations
      const combined = this.combineRecommendations(
        [
          { items: contentBased, weight: 0.4 },
          { items: collaborative, weight: 0.3 },
          { items: moodBased, weight: mood ? 0.3 : 0 },
        ],
        limit
      );

      // 5. Get liked music for display
      const likedMusic = await this.getLikedMusic(userId);

      return {
        recommendations: combined,
        liked: likedMusic,
        mood: mood,
      };
    } catch (error) {
      console.error("Error getting music recommendations:", error);
      throw error;
    }
  }

  /**
   * Content-Based Filtering for Movies
   * Recommends movies similar to what user has liked (genre, mood, rating)
   */
  async getContentBasedMovies(userId, limit = 20) {
    try {
      // Get user's liked movies
      const userLikes = await UserInteraction.find({
        user: userId,
        itemType: "movie",
        interactionType: { $in: ["like", "favorite"] },
      })
        .populate("itemId")
        .limit(50);

      if (userLikes.length === 0) {
        // Return popular movies if no history
        return await Movie.find().sort({ popularity: -1 }).limit(limit);
      }

      // Extract genres and moods from liked movies
      const likedGenres = new Set();
      const likedMoods = new Set();
      const likedIds = new Set();

      userLikes.forEach((interaction) => {
        if (interaction.itemId) {
          likedIds.add(interaction.itemId._id.toString());
          interaction.itemId.genre?.forEach((g) => likedGenres.add(g));
          interaction.itemId.mood?.forEach((m) => likedMoods.add(m));
        }
      });

      // Find similar movies
      const recommendations = await Movie.find({
        _id: { $nin: Array.from(likedIds) },
        $or: [
          { genre: { $in: Array.from(likedGenres) } },
          { mood: { $in: Array.from(likedMoods) } },
        ],
      })
        .sort({ popularity: -1, rating: -1 })
        .limit(limit * 2);

      // Score based on genre/mood overlap
      const scored = recommendations.map((movie) => {
        let score = 0;
        movie.genre?.forEach((g) => {
          if (likedGenres.has(g)) score += 2;
        });
        movie.mood?.forEach((m) => {
          if (likedMoods.has(m)) score += 1;
        });
        score += (movie.popularity || 0) / 1000;
        score += (movie.rating || 0) / 2;

        return { ...movie.toObject(), recommendationScore: score };
      });

      return scored.sort((a, b) => b.recommendationScore - a.recommendationScore).slice(0, limit);
    } catch (error) {
      console.error("Error in content-based movie filtering:", error);
      return [];
    }
  }

  /**
   * Content-Based Filtering for Music
   * Recommends music similar to what user has liked (genre, artist, audio features)
   */
  async getContentBasedMusic(userId, limit = 20) {
    try {
      // Get user's liked music
      const userLikes = await UserInteraction.find({
        user: userId,
        itemType: "music",
        interactionType: { $in: ["like", "favorite"] },
      })
        .populate("itemId")
        .limit(50);

      if (userLikes.length === 0) {
        // Return popular music if no history
        return await Music.find().sort({ popularity: -1 }).limit(limit);
      }

      // Extract genres, artists, and audio features
      const likedGenres = new Set();
      const likedArtists = new Set();
      const likedIds = new Set();
      let avgEnergy = 0,
        avgValence = 0,
        avgDanceability = 0;
      let count = 0;

      userLikes.forEach((interaction) => {
        if (interaction.itemId) {
          likedIds.add(interaction.itemId._id.toString());
          if (interaction.itemId.genre) likedGenres.add(interaction.itemId.genre);
          if (interaction.itemId.artist) likedArtists.add(interaction.itemId.artist);
          avgEnergy += interaction.itemId.energy || 0.5;
          avgValence += interaction.itemId.valence || 0.5;
          avgDanceability += interaction.itemId.danceability || 0.5;
          count++;
        }
      });

      avgEnergy /= count || 1;
      avgValence /= count || 1;
      avgDanceability /= count || 1;

      // Find similar music
      const recommendations = await Music.find({
        _id: { $nin: Array.from(likedIds) },
        $or: [
          { genre: { $in: Array.from(likedGenres) } },
          { artist: { $in: Array.from(likedArtists) } },
        ],
      })
        .sort({ popularity: -1 })
        .limit(limit * 2);

      // Score based on similarity
      const scored = recommendations.map((music) => {
        let score = 0;

        if (likedGenres.has(music.genre)) score += 3;
        if (likedArtists.has(music.artist)) score += 2;

        // Audio feature similarity (Euclidean distance)
        const energyDiff = Math.abs((music.energy || 0.5) - avgEnergy);
        const valenceDiff = Math.abs((music.valence || 0.5) - avgValence);
        const danceabilityDiff = Math.abs((music.danceability || 0.5) - avgDanceability);
        const featureSimilarity = 1 - (energyDiff + valenceDiff + danceabilityDiff) / 3;
        score += featureSimilarity * 2;

        score += (music.popularity || 0) / 1000;

        return { ...music.toObject(), recommendationScore: score };
      });

      return scored.sort((a, b) => b.recommendationScore - a.recommendationScore).slice(0, limit);
    } catch (error) {
      console.error("Error in content-based music filtering:", error);
      return [];
    }
  }

  /**
   * Collaborative Filtering for Movies
   * Uses improved cosine similarity algorithm
   */
  async getCollaborativeMovies(userId, limit = 20) {
    try {
      const result = await collaborativeFilteringService.getCollaborativeMovieRecommendations(
        userId,
        { k: 30, limit: limit * 2, minOverlap: 2 }
      );

      // Return just the recommendations array for hybrid combination
      return result.recommendations.slice(0, limit);
    } catch (error) {
      console.error("Error in collaborative movie filtering:", error);
      return [];
    }
  }

  /**
   * Collaborative Filtering for Music
   * Uses improved cosine similarity algorithm
   */
  async getCollaborativeMusic(userId, limit = 20) {
    try {
      const result = await collaborativeFilteringService.getCollaborativeMusicRecommendations(
        userId,
        { k: 30, limit: limit * 2, minOverlap: 2 }
      );

      // Return just the recommendations array for hybrid combination
      return result.recommendations.slice(0, limit);
    } catch (error) {
      console.error("Error in collaborative music filtering:", error);
      return [];
    }
  }

  /**
   * Mood-Based Recommendations for Movies
   */
  async getMoodBasedMovies(userId, mood, limit = 20) {
    try {
      // Get user's liked movie IDs to exclude
      const userLikes = await UserInteraction.find({
        user: userId,
        itemType: "movie",
        interactionType: { $in: ["like", "favorite"] },
      }).select("itemId");

      const likedIds = userLikes.map((like) => like.itemId);

      // Find movies matching the mood
      const moodMovies = await Movie.find({
        mood: mood,
        _id: { $nin: likedIds },
      })
        .sort({ popularity: -1, rating: -1 })
        .limit(limit);

      return moodMovies.map((movie) => ({
        ...movie.toObject(),
        recommendationScore: movie.rating || 0,
      }));
    } catch (error) {
      console.error("Error in mood-based movie filtering:", error);
      return [];
    }
  }

  /**
   * Mood-Based Recommendations for Music
   * Maps mood to audio features (energy, valence)
   */
  async getMoodBasedMusic(userId, mood, limit = 20) {
    try {
      // Get user's liked music IDs to exclude
      const userLikes = await UserInteraction.find({
        user: userId,
        itemType: "music",
        interactionType: { $in: ["like", "favorite"] },
      }).select("itemId");

      const likedIds = userLikes.map((like) => like.itemId);

      // Map mood to audio features
      const moodFeatures = this.getMoodFeatures(mood);

      // Find music matching mood characteristics
      const moodMusic = await Music.find({
        _id: { $nin: likedIds },
        energy: {
          $gte: moodFeatures.energy - 0.2,
          $lte: moodFeatures.energy + 0.2,
        },
        valence: {
          $gte: moodFeatures.valence - 0.2,
          $lte: moodFeatures.valence + 0.2,
        },
      })
        .sort({ popularity: -1 })
        .limit(limit);

      return moodMusic.map((music) => ({
        ...music.toObject(),
        recommendationScore: music.popularity || 0,
      }));
    } catch (error) {
      console.error("Error in mood-based music filtering:", error);
      return [];
    }
  }

  /**
   * Map mood to audio features
   */
  getMoodFeatures(mood) {
    const moodMap = {
      happy: { energy: 0.7, valence: 0.8, danceability: 0.7 },
      sad: { energy: 0.3, valence: 0.2, danceability: 0.3 },
      energetic: { energy: 0.9, valence: 0.7, danceability: 0.8 },
      calm: { energy: 0.3, valence: 0.5, danceability: 0.3 },
      romantic: { energy: 0.4, valence: 0.6, danceability: 0.5 },
      angry: { energy: 0.9, valence: 0.3, danceability: 0.6 },
      motivational: { energy: 0.8, valence: 0.7, danceability: 0.7 },
      relaxing: { energy: 0.2, valence: 0.6, danceability: 0.2 },
    };

    return (
      moodMap[mood.toLowerCase()] || { energy: 0.5, valence: 0.5, danceability: 0.5 }
    );
  }

  /**
   * Combine multiple recommendation sources with weights
   */
  combineRecommendations(sources, limit) {
    const combinedScores = {};

    sources.forEach(({ items, weight }) => {
      items.forEach((item) => {
        const id = item._id.toString();
        if (!combinedScores[id]) {
          combinedScores[id] = {
            item: item,
            totalScore: 0,
          };
        }
        combinedScores[id].totalScore += (item.recommendationScore || 1) * weight;
      });
    });

    return Object.values(combinedScores)
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, limit)
      .map((entry) => entry.item);
  }

  /**
   * Get liked movies for a user
   */
  async getLikedMovies(userId) {
    try {
      const liked = await UserInteraction.find({
        user: userId,
        itemType: "movie",
        interactionType: { $in: ["like", "favorite"] },
      })
        .populate("itemId")
        .sort({ createdAt: -1 })
        .limit(20);

      return liked.map((interaction) => interaction.itemId).filter(Boolean);
    } catch (error) {
      console.error("Error getting liked movies:", error);
      return [];
    }
  }

  /**
   * Get liked music for a user
   */
  async getLikedMusic(userId) {
    try {
      const liked = await UserInteraction.find({
        user: userId,
        itemType: "music",
        interactionType: { $in: ["like", "favorite"] },
      })
        .populate("itemId")
        .sort({ createdAt: -1 })
        .limit(20);

      return liked.map((interaction) => interaction.itemId).filter(Boolean);
    } catch (error) {
      console.error("Error getting liked music:", error);
      return [];
    }
  }

  /**
   * Track user interaction
   */
  async trackInteraction(userId, itemId, itemType, interactionType, data = {}) {
    try {
      const interaction = await UserInteraction.create({
        user: userId,
        itemId,
        itemType,
        interactionType,
        ...data,
      });

      return interaction;
    } catch (error) {
      console.error("Error tracking interaction:", error);
      throw error;
    }
  }
}

export default new RecommendationEngine();
