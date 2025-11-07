import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/userModel.js";
import Movie from "../models/movieModel.js";
import Music from "../models/musicModel.js";
import connectDB from "../config/db.js";

dotenv.config();

async function seedUserLikes() {
  try {
    console.log("🌱 Starting user likes seeding...");
    
    await connectDB();
    
    // Get sample movies and music
    const movies = await Movie.find({}).limit(30);
    const music = await Music.find({}).limit(30);
    
    console.log(`📊 Found ${movies.length} movies and ${music.length} music tracks`);
    
    if (movies.length === 0 || music.length === 0) {
      console.log("❌ No movies or music found in database!");
      console.log("Please seed movies and music first:");
      console.log("  cd backend && node seed.js");
      process.exit(1);
    }
    
    // Get users
    const users = await User.find({});
    
    console.log(`👥 Found ${users.length} users`);
    
    if (users.length < 2) {
      console.log("❌ Need at least 2 users for collaborative filtering!");
      console.log("Please create users first (signup via the frontend or create manually)");
      process.exit(1);
    }
    
    console.log("\n🎯 Simulating user preferences...\n");
    
    // Strategy: Create overlapping preferences to enable collaborative filtering
    // User 0 and User 1 will have some overlap
    // User 2+ will have varying overlaps
    
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      
      // Determine number of likes (3-8 items each)
      const numMovies = Math.floor(Math.random() * 6) + 3;
      const numMusic = Math.floor(Math.random() * 6) + 3;
      
      let likedMovies, likedMusic;
      
      if (i === 0) {
        // First user gets random selection
        likedMovies = movies
          .sort(() => 0.5 - Math.random())
          .slice(0, numMovies)
          .map(m => m._id);
          
        likedMusic = music
          .sort(() => 0.5 - Math.random())
          .slice(0, numMusic)
          .map(m => m._id);
      } else if (i === 1) {
        // Second user gets 70% overlap with first user
        const firstUser = await User.findById(users[0]._id);
        const overlapMovies = Math.floor(firstUser.likedMovies.length * 0.7);
        const overlapMusic = Math.floor(firstUser.likedMusic.length * 0.7);
        
        // Take some from first user
        likedMovies = [
          ...firstUser.likedMovies.slice(0, overlapMovies),
          ...movies
            .filter(m => !firstUser.likedMovies.some(id => id.equals(m._id)))
            .sort(() => 0.5 - Math.random())
            .slice(0, numMovies - overlapMovies)
            .map(m => m._id)
        ];
        
        likedMusic = [
          ...firstUser.likedMusic.slice(0, overlapMusic),
          ...music
            .filter(m => !firstUser.likedMusic.some(id => id.equals(m._id)))
            .sort(() => 0.5 - Math.random())
            .slice(0, numMusic - overlapMusic)
            .map(m => m._id)
        ];
      } else {
        // Other users get random with possible overlap
        likedMovies = movies
          .sort(() => 0.5 - Math.random())
          .slice(0, numMovies)
          .map(m => m._id);
          
        likedMusic = music
          .sort(() => 0.5 - Math.random())
          .slice(0, numMusic)
          .map(m => m._id);
      }
      
      // Update user
      await User.findByIdAndUpdate(user._id, {
        likedMovies,
        likedMusic
      });
      
      console.log(`✓ ${user.name || user.email}:`);
      console.log(`  - ${likedMovies.length} movies`);
      console.log(`  - ${likedMusic.length} music tracks`);
      
      // Show some sample titles
      const sampleMovieTitles = await Movie.find({
        _id: { $in: likedMovies.slice(0, 3) }
      }).select('title');
      
      if (sampleMovieTitles.length > 0) {
        console.log(`  - Sample movies: ${sampleMovieTitles.map(m => m.title).join(', ')}`);
      }
      
      console.log('');
    }
    
    console.log("✅ Successfully seeded user likes!");
    console.log("\n📝 Next steps:");
    console.log("1. Start the backend: cd backend && npm start");
    console.log("2. Test the endpoint:");
    console.log(`   curl http://localhost:5000/api/recommendations/user/${users[0]._id}`);
    console.log("3. Or run the test script:");
    console.log("   ./test-user-collaborative.sh");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding user likes:", error);
    process.exit(1);
  }
}

seedUserLikes();
