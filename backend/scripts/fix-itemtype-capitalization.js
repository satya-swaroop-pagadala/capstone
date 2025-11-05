import mongoose from 'mongoose';
import UserInteraction from '../models/userInteractionModel.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Migration Script: Fix itemType capitalization in UserInteraction collection
 * Converts "movie" -> "Movie" and "music" -> "Music"
 */

const fixItemTypeCapitalization = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Update all "movie" to "Movie"
    const movieResult = await UserInteraction.updateMany(
      { itemType: "movie" },
      { $set: { itemType: "Movie" } }
    );
    console.log(`✅ Updated ${movieResult.modifiedCount} "movie" records to "Movie"`);

    // Update all "music" to "Music"
    const musicResult = await UserInteraction.updateMany(
      { itemType: "music" },
      { $set: { itemType: "Music" } }
    );
    console.log(`✅ Updated ${musicResult.modifiedCount} "music" records to "Music"`);

    console.log('\n📊 Migration Summary:');
    console.log(`   🎬 Movies updated: ${movieResult.modifiedCount}`);
    console.log(`   🎵 Music updated: ${musicResult.modifiedCount}`);
    console.log(`   📦 Total: ${movieResult.modifiedCount + musicResult.modifiedCount}`);

    await mongoose.disconnect();
    console.log('\n✅ Migration complete! Database disconnected.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

// Run migration
fixItemTypeCapitalization();
