import mongoose from "mongoose";
import dotenv from "dotenv";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import Movie from "./models/movieModel.js";
import Music from "./models/musicModel.js";
import connectDB from "./config/db.js";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

// Read JSON files - using real-world datasets
const moviesData = JSON.parse(
  readFileSync(join(__dirname, "data", "movies_real.json"), "utf-8")
);
const musicData = JSON.parse(
  readFileSync(join(__dirname, "data", "music_real.json"), "utf-8")
);

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    console.log("🗑️  Dropping existing collections and indexes...");
    
    // Drop collections entirely to remove all indexes
    try {
      await mongoose.connection.db.dropCollection("movies");
      console.log("✅ Movies collection dropped");
    } catch (err) {
      console.log("ℹ️  Movies collection doesn't exist, creating new...");
    }
    
    try {
      await mongoose.connection.db.dropCollection("musics");
      console.log("✅ Music collection dropped");
    } catch (err) {
      console.log("ℹ️  Music collection doesn't exist, creating new...");
    }

    console.log("📦 Seeding movies (this may take a moment)...");
    
    // Insert movies in batches to avoid memory issues
    const movieBatchSize = 1000;
    let movieCount = 0;
    for (let i = 0; i < moviesData.length; i += movieBatchSize) {
      const batch = moviesData.slice(i, i + movieBatchSize);
      await Movie.insertMany(batch);
      movieCount += batch.length;
      console.log(`   Inserted ${movieCount}/${moviesData.length} movies...`);
    }
    console.log(`✅ ${movieCount} movies added`);

    console.log("🎵 Seeding music (this may take a few moments)...");
    
    // Insert music in batches to avoid memory issues
    const musicBatchSize = 2000;
    let musicCount = 0;
    for (let i = 0; i < musicData.length; i += musicBatchSize) {
      const batch = musicData.slice(i, i + musicBatchSize);
      await Music.insertMany(batch);
      musicCount += batch.length;
      console.log(`   Inserted ${musicCount}/${musicData.length} songs...`);
    }
    console.log(`✅ ${musicCount} songs added`);

    // Get statistics
    const moods = await Movie.distinct("mood");
    const genres = await Movie.distinct("genre");
    const artists = await Music.distinct("artist");

    console.log("\n🎉 Database seeded successfully!");
    console.log("\n📊 Summary:");
    console.log(`   Movies: ${movieCount}`);
    console.log(`   Songs: ${musicCount}`);
    console.log(`   Unique Moods: ${moods.length}`);
    console.log(`   Unique Movie Genres: ${genres.length}`);
    console.log(`   Unique Artists: ${artists.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
};

seedDatabase();
