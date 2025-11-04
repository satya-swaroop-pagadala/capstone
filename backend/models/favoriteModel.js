import mongoose from "mongoose";

const favoriteSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      default: "guest", // For now, using guest user. Later can be replaced with actual user ID
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "itemType",
    },
    itemType: {
      type: String,
      required: true,
      enum: ["Movie", "Music"],
    },
  },
  {
    timestamps: true,
  }
);

// Ensure one user can't favorite the same item twice
favoriteSchema.index({ userId: 1, itemId: 1, itemType: 1 }, { unique: true });

export default mongoose.model("Favorite", favoriteSchema);
