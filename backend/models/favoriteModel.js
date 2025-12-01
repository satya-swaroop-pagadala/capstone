import mongoose from "mongoose";

const favoriteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // Index for faster queries
    },
    itemId: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    itemType: {
      type: String,
      required: true,
      enum: ["Movie", "Music"],
    },
    // Movie/Music details for display without additional queries
    title: {
      type: String,
      required: false,
    },
    posterPath: {
      type: String,
      required: false,
    },
    rating: {
      type: Number,
      required: false,
    },
    releaseDate: {
      type: String,
      required: false,
    },
    // Music-specific field
    artist: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure one user can't favorite the same item twice
favoriteSchema.index({ userId: 1, itemId: 1, itemType: 1 }, { unique: true });

export default mongoose.model("Favorite", favoriteSchema);
