import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/userModel.js";
import Favorite from "../models/favoriteModel.js";
import connectDB from "../config/db.js";

dotenv.config();

async function syncFavoritesToUserLikes() {
  try {
    console.log("🔄 Starting sync of favorites to user likes...");
    
    await connectDB();
    
    // Get all users
    const users = await User.find({});
    console.log(`👥 Found ${users.length} users`);
    
    let updatedCount = 0;
    
    for (const user of users) {
      // Get all favorites for this user
      const favorites = await Favorite.find({ userId: user._id });
      
      if (favorites.length === 0) {
        console.log(`⏭️  Skipping ${user.email} - no favorites`);
        continue;
      }
      
      // Separate movies and music
      const movieIds = favorites
        .filter(f => f.itemType === 'Movie')
        .map(f => f.itemId);
      
      const musicIds = favorites
        .filter(f => f.itemType === 'Music')
        .map(f => f.itemId);
      
      // Update user with liked items
      await User.findByIdAndUpdate(user._id, {
        likedMovies: movieIds,
        likedMusic: musicIds
      });
      
      console.log(`✓ ${user.email}:`);
      console.log(`  - ${movieIds.length} movies`);
      console.log(`  - ${musicIds.length} music tracks`);
      
      updatedCount++;
    }
    
    console.log(`\n✅ Successfully synced ${updatedCount} users!`);
    console.log("\n📝 Next steps:");
    console.log("Now when you like/unlike items, they will automatically sync.");
    console.log("Test collaborative filtering:");
    console.log(`  curl http://localhost:5001/api/recommendations/user/${users[0]?._id}`);
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error syncing favorites:", error);
    process.exit(1);
  }
}

syncFavoritesToUserLikes();
