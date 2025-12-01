import mongoose from "mongoose";

// Mongoose 8.x settings
mongoose.set('strictQuery', false);

const connectDB = async () => {
  try {
    // Set Node.js environment variable for OpenSSL compatibility
    process.env.NODE_OPTIONS = '--tls-min-v1.0';

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Timeouts
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      family: 4, // Use IPv4, skip trying IPv6
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📦 Database: ${conn.connection.name}`);

  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.error('Full error:', error);

    // Don't exit process to allow server to run without DB for testing
    console.log('⚠️  Server will continue without database connection');
    console.log('💡 Please check your MongoDB Atlas connection string and network access settings');
  }
};

// Handle connection events
mongoose.connection.on('error', (err) => {
  console.error(`❌ MongoDB connection error: ${err}`);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️  MongoDB disconnected');
});

mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connected successfully');
});

export default connectDB;
