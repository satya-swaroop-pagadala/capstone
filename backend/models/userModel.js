import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a name"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Please add an email"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please add a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Please add a password"],
      minlength: 6,
      select: false, // Don't return password by default
    },
    avatar: {
      type: String,
      default: "https://api.dicebear.com/7.x/avataaars/svg?seed=",
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    likedMovies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Movie",
      },
    ],
    likedMusic: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Music",
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to hash password and set avatar
userSchema.pre("save", async function (next) {
  try {
    // Set avatar if not already set
    if (!this.avatar || this.avatar === "https://api.dicebear.com/7.x/avataaars/svg?seed=") {
      this.avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${this.name}`;
    }

    // Hash password only if it's modified
    if (!this.isModified("password")) {
      return next();
    }

    console.log('🔐 Hashing password...');
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    console.log('✅ Password hashed successfully');
    
    next();
  } catch (error) {
    console.error('❌ Error in pre-save middleware:', error);
    next(error);
  }
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("User", userSchema);
