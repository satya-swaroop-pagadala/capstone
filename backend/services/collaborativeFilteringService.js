import mongoose from "mongoose";
import UserInteraction from "../models/userInteractionModel.js";
import Movie from "../models/movieModel.js";
import Music from "../models/musicModel.js";

/**
 * Advanced Collaborative Filtering Service
 * Uses Cosine Similarity for User-Based Collaborative Filtering
 * Works with UserInteraction model (likes, favorites, ratings)
 */

class CollaborativeFilteringService {
  /**
   * Calculate cosine similarity between two users based on their interactions
   * @param {Set} userAItems - Set of item IDs user A interacted with
   * @param {Set} userBItems - Set of item IDs user B interacted with
   * @returns {number} - Similarity score between 0 and 1
   */
  calculateCosineSimilarity(userAItems, userBItems) {
    if (userAItems.size === 0 || userBItems.size === 0) return 0;

    // Find common items (intersection)
    let commonCount = 0;
    for (const item of userAItems) {
      if (userBItems.has(item)) commonCount++;
    }

    if (commonCount === 0) return 0;

    // Cosine similarity = |A ∩ B| / sqrt(|A| * |B|)
    const similarity = commonCount / Math.sqrt(userAItems.size * userBItems.size);
    return similarity;
  }

  /**
   * Calculate Jaccard similarity (alternative metric)
   * @param {Set} setA - Set of items
   * @param {Set} setB - Set of items
   * @returns {number} - Similarity score between 0 and 1
   */
  calculateJaccardSimilarity(setA, setB) {
    if (setA.size === 0 && setB.size === 0) return 0;

    let intersection = 0;
    for (const item of setA) {
      if (setB.has(item)) intersection++;
    }

    const union = setA.size + setB.size - intersection;
    return union > 0 ? intersection / union : 0;
  }

  /**
   * Get movie recommendations using User-Based Collaborative Filtering
   * @param {string} userId - Target user ID
   * @param {Object} options - Configuration options
   * @returns {Promise<Array>} - Array of recommended movies with scores
   */
  async getCollaborativeMovieRecommendations(userId, options = {}) {
    const {
      k = 30, // Number of similar users to consider
      limit = 20, // Number of recommendations to return
      minOverlap = 2, // Minimum common likes to consider user as neighbor
      similarityMetric = "cosine", // 'cosine' or 'jaccard'
    } = options;

    try {
      const userObjectId = new mongoose.Types.ObjectId(userId);

      // 1. Get all user-movie interactions (likes and favorites)
      const allInteractions = await UserInteraction.find({
        itemType: "movie",
        interactionType: { $in: ["like", "favorite"] },
      })
        .select("user itemId")
        .lean();

      if (allInteractions.length === 0) {
        return { recommendations: [], neighbors: [], reason: "no_data" };
      }

      // 2. Build user-item matrix
      const userItemMap = new Map(); // userId -> Set of itemIds
      allInteractions.forEach((interaction) => {
        const uid = interaction.user.toString();
        if (!userItemMap.has(uid)) {
          userItemMap.set(uid, new Set());
        }
        userItemMap.get(uid).add(interaction.itemId.toString());
      });

      // 3. Get target user's liked movies
      const targetUserId = userObjectId.toString();
      const targetUserItems = userItemMap.get(targetUserId);

      if (!targetUserItems || targetUserItems.size < minOverlap) {
        return {
          recommendations: [],
          neighbors: [],
          reason: "insufficient_user_data",
          message: `User has only ${targetUserItems?.size || 0} interactions. Need at least ${minOverlap}.`,
        };
      }

      // 4. Calculate similarity with all other users
      const similarities = [];
      for (const [otherUserId, otherUserItems] of userItemMap.entries()) {
        if (otherUserId === targetUserId) continue;

        // Quick overlap check before expensive similarity calculation
        let overlap = 0;
        for (const item of targetUserItems) {
          if (otherUserItems.has(item)) {
            overlap++;
            if (overlap >= minOverlap) break;
          }
        }

        if (overlap < minOverlap) continue;

        // Calculate similarity
        const similarity =
          similarityMetric === "jaccard"
            ? this.calculateJaccardSimilarity(targetUserItems, otherUserItems)
            : this.calculateCosineSimilarity(targetUserItems, otherUserItems);

        if (similarity > 0) {
          similarities.push({
            userId: otherUserId,
            similarity,
            items: otherUserItems,
            overlap,
          });
        }
      }

      if (similarities.length === 0) {
        return {
          recommendations: [],
          neighbors: [],
          reason: "no_similar_users",
          message: "No users found with sufficient overlap.",
        };
      }

      // 5. Get top-k most similar users (neighbors)
      similarities.sort((a, b) => b.similarity - a.similarity);
      const neighbors = similarities.slice(0, k);

      // 6. Aggregate recommendations from neighbors
      const itemScores = new Map(); // itemId -> weighted score

      neighbors.forEach((neighbor) => {
        neighbor.items.forEach((itemId) => {
          // Skip items the target user already interacted with
          if (targetUserItems.has(itemId)) return;

          // Weight the recommendation by neighbor's similarity
          const currentScore = itemScores.get(itemId) || 0;
          itemScores.set(itemId, currentScore + neighbor.similarity);
        });
      });

      if (itemScores.size === 0) {
        return {
          recommendations: [],
          neighbors: neighbors.slice(0, 10).map((n) => ({
            similarity: n.similarity,
            overlap: n.overlap,
          })),
          reason: "no_new_items",
          message: "All neighbor items already seen by user.",
        };
      }

      // 7. Sort by score and get top N item IDs
      const sortedItems = Array.from(itemScores.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([itemId, score]) => ({ itemId, score }));

      // 8. Fetch movie documents
      const movieIds = sortedItems.map((item) =>
        mongoose.Types.ObjectId(item.itemId)
      );
      const movies = await Movie.find({ _id: { $in: movieIds } }).lean();

      // 9. Map scores to movies and preserve order
      const scoreMap = new Map(sortedItems.map((item) => [item.itemId, item.score]));
      const recommendations = movies
        .map((movie) => ({
          ...movie,
          recommendationScore: scoreMap.get(movie._id.toString()) || 0,
          source: "collaborative_filtering",
        }))
        .sort((a, b) => b.recommendationScore - a.recommendationScore);

      return {
        recommendations,
        neighbors: neighbors.slice(0, 10).map((n) => ({
          similarity: n.similarity,
          overlap: n.overlap,
          itemCount: n.items.size,
        })),
        stats: {
          totalUsers: userItemMap.size,
          similarUsers: similarities.length,
          topKNeighbors: neighbors.length,
          candidateItems: itemScores.size,
          targetUserItems: targetUserItems.size,
        },
      };
    } catch (error) {
      console.error("Error in collaborative movie filtering:", error);
      throw error;
    }
  }

  /**
   * Get music recommendations using User-Based Collaborative Filtering
   * @param {string} userId - Target user ID
   * @param {Object} options - Configuration options
   * @returns {Promise<Array>} - Array of recommended music with scores
   */
  async getCollaborativeMusicRecommendations(userId, options = {}) {
    const {
      k = 30,
      limit = 20,
      minOverlap = 2,
      similarityMetric = "cosine",
    } = options;

    try {
      const userObjectId = new mongoose.Types.ObjectId(userId);

      // 1. Get all user-music interactions
      const allInteractions = await UserInteraction.find({
        itemType: "music",
        interactionType: { $in: ["like", "favorite"] },
      })
        .select("user itemId")
        .lean();

      if (allInteractions.length === 0) {
        return { recommendations: [], neighbors: [], reason: "no_data" };
      }

      // 2. Build user-item matrix
      const userItemMap = new Map();
      allInteractions.forEach((interaction) => {
        const uid = interaction.user.toString();
        if (!userItemMap.has(uid)) {
          userItemMap.set(uid, new Set());
        }
        userItemMap.get(uid).add(interaction.itemId.toString());
      });

      // 3. Get target user's liked music
      const targetUserId = userObjectId.toString();
      const targetUserItems = userItemMap.get(targetUserId);

      if (!targetUserItems || targetUserItems.size < minOverlap) {
        return {
          recommendations: [],
          neighbors: [],
          reason: "insufficient_user_data",
          message: `User has only ${targetUserItems?.size || 0} interactions. Need at least ${minOverlap}.`,
        };
      }

      // 4. Calculate similarity with all other users
      const similarities = [];
      for (const [otherUserId, otherUserItems] of userItemMap.entries()) {
        if (otherUserId === targetUserId) continue;

        let overlap = 0;
        for (const item of targetUserItems) {
          if (otherUserItems.has(item)) {
            overlap++;
            if (overlap >= minOverlap) break;
          }
        }

        if (overlap < minOverlap) continue;

        const similarity =
          similarityMetric === "jaccard"
            ? this.calculateJaccardSimilarity(targetUserItems, otherUserItems)
            : this.calculateCosineSimilarity(targetUserItems, otherUserItems);

        if (similarity > 0) {
          similarities.push({
            userId: otherUserId,
            similarity,
            items: otherUserItems,
            overlap,
          });
        }
      }

      if (similarities.length === 0) {
        return {
          recommendations: [],
          neighbors: [],
          reason: "no_similar_users",
        };
      }

      // 5. Get top-k neighbors
      similarities.sort((a, b) => b.similarity - a.similarity);
      const neighbors = similarities.slice(0, k);

      // 6. Aggregate recommendations
      const itemScores = new Map();
      neighbors.forEach((neighbor) => {
        neighbor.items.forEach((itemId) => {
          if (targetUserItems.has(itemId)) return;
          const currentScore = itemScores.get(itemId) || 0;
          itemScores.set(itemId, currentScore + neighbor.similarity);
        });
      });

      if (itemScores.size === 0) {
        return {
          recommendations: [],
          neighbors: neighbors.slice(0, 10).map((n) => ({
            similarity: n.similarity,
            overlap: n.overlap,
          })),
          reason: "no_new_items",
        };
      }

      // 7. Sort and get top N
      const sortedItems = Array.from(itemScores.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([itemId, score]) => ({ itemId, score }));

      // 8. Fetch music documents
      const musicIds = sortedItems.map((item) =>
        mongoose.Types.ObjectId(item.itemId)
      );
      const musicTracks = await Music.find({ _id: { $in: musicIds } }).lean();

      // 9. Map scores and preserve order
      const scoreMap = new Map(sortedItems.map((item) => [item.itemId, item.score]));
      const recommendations = musicTracks
        .map((music) => ({
          ...music,
          recommendationScore: scoreMap.get(music._id.toString()) || 0,
          source: "collaborative_filtering",
        }))
        .sort((a, b) => b.recommendationScore - a.recommendationScore);

      return {
        recommendations,
        neighbors: neighbors.slice(0, 10).map((n) => ({
          similarity: n.similarity,
          overlap: n.overlap,
          itemCount: n.items.size,
        })),
        stats: {
          totalUsers: userItemMap.size,
          similarUsers: similarities.length,
          topKNeighbors: neighbors.length,
          candidateItems: itemScores.size,
          targetUserItems: targetUserItems.size,
        },
      };
    } catch (error) {
      console.error("Error in collaborative music filtering:", error);
      throw error;
    }
  }

  /**
   * Audit the data to determine if collaborative filtering is viable
   * @returns {Promise<Object>} - Statistics about user interactions
   */
  async auditCollaborativeFilteringData() {
    try {
      // Get interaction counts
      const movieInteractions = await UserInteraction.countDocuments({
        itemType: "movie",
        interactionType: { $in: ["like", "favorite"] },
      });

      const musicInteractions = await UserInteraction.countDocuments({
        itemType: "music",
        interactionType: { $in: ["like", "favorite"] },
      });

      // Get unique users with interactions
      const movieUsers = await UserInteraction.distinct("user", {
        itemType: "movie",
        interactionType: { $in: ["like", "favorite"] },
      });

      const musicUsers = await UserInteraction.distinct("user", {
        itemType: "music",
        interactionType: { $in: ["like", "favorite"] },
      });

      // Get interactions per user statistics
      const movieUserStats = await UserInteraction.aggregate([
        {
          $match: {
            itemType: "movie",
            interactionType: { $in: ["like", "favorite"] },
          },
        },
        {
          $group: {
            _id: "$user",
            interactionCount: { $sum: 1 },
          },
        },
        {
          $group: {
            _id: null,
            avgInteractions: { $avg: "$interactionCount" },
            minInteractions: { $min: "$interactionCount" },
            maxInteractions: { $max: "$interactionCount" },
            totalUsers: { $sum: 1 },
          },
        },
      ]);

      const musicUserStats = await UserInteraction.aggregate([
        {
          $match: {
            itemType: "music",
            interactionType: { $in: ["like", "favorite"] },
          },
        },
        {
          $group: {
            _id: "$user",
            interactionCount: { $sum: 1 },
          },
        },
        {
          $group: {
            _id: null,
            avgInteractions: { $avg: "$interactionCount" },
            minInteractions: { $min: "$interactionCount" },
            maxInteractions: { $max: "$interactionCount" },
            totalUsers: { $sum: 1 },
          },
        },
      ]);

      const movieStats = movieUserStats[0] || {
        avgInteractions: 0,
        minInteractions: 0,
        maxInteractions: 0,
        totalUsers: 0,
      };

      const musicStats = musicUserStats[0] || {
        avgInteractions: 0,
        minInteractions: 0,
        maxInteractions: 0,
        totalUsers: 0,
      };

      // Determine if CF is viable
      const movieCFViable =
        movieStats.totalUsers >= 10 && movieStats.avgInteractions >= 3;
      const musicCFViable =
        musicStats.totalUsers >= 10 && musicStats.avgInteractions >= 3;

      return {
        movies: {
          totalInteractions: movieInteractions,
          uniqueUsers: movieUsers.length,
          avgInteractionsPerUser: Math.round(movieStats.avgInteractions * 100) / 100,
          minInteractionsPerUser: movieStats.minInteractions,
          maxInteractionsPerUser: movieStats.maxInteractions,
          isViableForCF: movieCFViable,
          recommendation: movieCFViable
            ? "✅ Sufficient data for collaborative filtering"
            : "❌ Not enough data. Need 10+ users with 3+ interactions each.",
        },
        music: {
          totalInteractions: musicInteractions,
          uniqueUsers: musicUsers.length,
          avgInteractionsPerUser: Math.round(musicStats.avgInteractions * 100) / 100,
          minInteractionsPerUser: musicStats.minInteractions,
          maxInteractionsPerUser: musicStats.maxInteractions,
          isViableForCF: musicCFViable,
          recommendation: musicCFViable
            ? "✅ Sufficient data for collaborative filtering"
            : "❌ Not enough data. Need 10+ users with 3+ interactions each.",
        },
        overall: {
          totalInteractions: movieInteractions + musicInteractions,
          totalUniqueUsers: new Set([...movieUsers, ...musicUsers]).size,
          readyForCF: movieCFViable || musicCFViable,
        },
      };
    } catch (error) {
      console.error("Error auditing CF data:", error);
      throw error;
    }
  }
}

export default new CollaborativeFilteringService();
