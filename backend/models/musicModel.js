import mongoose from "mongoose";

const musicSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    artist: {
      type: String,
      required: true,
      trim: true,
    },
    genre: {
      type: String,
      required: true,
    },
    album: {
      type: String,
      default: "",
    },
    coverUrl: {
      type: String,
      default: "",
    },
    duration: {
      type: String,
      default: "",
    },
    popularity: {
      type: Number,
      default: 0,
    },
    danceability: {
      type: Number,
      default: 0.5,
    },
    energy: {
      type: Number,
      default: 0.5,
    },
    valence: {
      type: Number,
      default: 0.5,
    },
    tempo: {
      type: Number,
      default: 120,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
musicSchema.index({ artist: 1 });
musicSchema.index({ genre: 1 });
musicSchema.index({ title: "text", artist: "text", album: "text" });
musicSchema.index({ popularity: -1 });

export default mongoose.model("Music", musicSchema);
