import mongoose from "mongoose";

const movieSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    genre: {
      type: [String],
      required: true,
    },
    mood: {
      type: [String],
      default: [],
    },
    rating: {
      type: Number,
      min: 0,
      max: 10,
      default: 0,
    },
    releaseYear: {
      type: Number,
    },
    posterUrl: {
      type: String,
      default: "",
    },
    overview: {
      type: String,
      default: "",
    },
    popularity: {
      type: Number,
      default: 0,
    },
    voteCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
movieSchema.index({ mood: 1 });
movieSchema.index({ genre: 1 });
movieSchema.index({ title: "text", overview: "text" });
movieSchema.index({ popularity: -1 });

export default mongoose.model("Movie", movieSchema);
