import mongoose from "mongoose";

const userInteractionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    itemType: {
      type: String,
      enum: ["movie", "music"],
      required: true,
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "itemType",
    },
    interactionType: {
      type: String,
      enum: ["view", "like", "rating", "favorite"],
      required: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    mood: {
      type: String,
      default: null,
    },
    duration: {
      type: Number, // Time spent on item in seconds
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
userInteractionSchema.index({ user: 1, itemType: 1 });
userInteractionSchema.index({ user: 1, interactionType: 1 });
userInteractionSchema.index({ itemId: 1, interactionType: 1 });

const UserInteraction = mongoose.model("UserInteraction", userInteractionSchema);

export default UserInteraction;
