# User-User Collaborative Filtering - Setup & Testing Guide

## Overview

This implementation provides a simple user-user collaborative filtering recommendation system based on cosine similarity between users' liked items (movies and music).

## What Was Implemented

### Backend Changes

1. **User Model** (`/backend/models/userModel.js`)
   - Added `likedMovies` array field (references Movie model)
   - Added `likedMusic` array field (references Music model)

2. **Collaborative Filtering Utility** (`/backend/utils/collaborativeFiltering.js`)
   - `cosineSimilarity()`: Calculates similarity between two users
   - `getCollaborativeRecommendations()`: Finds most similar user and returns recommendations

3. **Recommendation Controller** (`/backend/controllers/recommendationController.js`)
   - Added `getUserCollaborativeRecommendations()` endpoint handler
   - Fetches all users, calculates similarities, returns movie/music recommendations

4. **Recommendation Routes** (`/backend/routes/recommendationRoutes.js`)
   - Added route: `GET /api/recommendations/user/:userId`
   - Public access (no authentication required for testing)

### Frontend Changes

1. **Recommendations Component** (`/project/src/pages/Recommendations.tsx`)
   - React component to display recommendations
   - Fetches from `/api/recommendations/user/:userId`
   - Displays movies and music in responsive grid layout
   - Includes loading states and error handling

## How It Works

### Algorithm

1. **Cosine Similarity Calculation**
   ```
   similarity = |A ∩ B| / sqrt(|A| × |B|)
   ```
   - A = Items liked by current user
   - B = Items liked by other user
   - Higher score = more similar users

2. **Recommendation Generation**
   - Calculate similarity with all other users
   - Find the most similar user
   - Return items they liked that current user hasn't liked yet

### Example Scenario

**User A** likes:
- Movies: Inception, Interstellar
- Music: (none)

**User B** likes:
- Movies: Inception, Interstellar, The Dark Knight
- Music: Bohemian Rhapsody

**Result**: User A gets recommended:
- The Dark Knight (movie)
- Bohemian Rhapsody (music)

## Setup Instructions

### 1. Database Seeding

You need to populate the database with users and their liked items.

#### Option A: Manual MongoDB Commands

```bash
# Connect to MongoDB
mongosh your_database_name
```

```javascript
// Get some movie and music IDs
const movieIds = db.movies.find({}, {_id: 1}).limit(10).toArray();
const musicIds = db.musics.find({}, {_id: 1}).limit(10).toArray();

// Get user IDs
const users = db.users.find({}, {_id: 1}).limit(5).toArray();

// Add liked movies and music to users
db.users.updateOne(
  {_id: users[0]._id},
  {$set: {
    likedMovies: [movieIds[0]._id, movieIds[1]._id],
    likedMusic: [musicIds[0]._id, musicIds[1]._id]
  }}
);

db.users.updateOne(
  {_id: users[1]._id},
  {$set: {
    likedMovies: [movieIds[0]._id, movieIds[1]._id, movieIds[2]._id],
    likedMusic: [musicIds[0]._id, musicIds[2]._id]
  }}
);

// Verify
db.users.find({}, {name: 1, likedMovies: 1, likedMusic: 1});
```

#### Option B: Create a Seed Script

Create `/backend/scripts/seedUserLikes.js`:

```javascript
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/userModel.js";
import Movie from "../models/movieModel.js";
import Music from "../models/musicModel.js";
import connectDB from "../config/db.js";

dotenv.config();

async function seedUserLikes() {
  try {
    await connectDB();
    
    // Get sample movies and music
    const movies = await Movie.find({}).limit(20);
    const music = await Music.find({}).limit(20);
    
    if (movies.length === 0 || music.length === 0) {
      console.log("❌ No movies or music found. Seed them first!");
      process.exit(1);
    }
    
    // Get users
    const users = await User.find({});
    
    if (users.length < 2) {
      console.log("❌ Need at least 2 users. Create them first!");
      process.exit(1);
    }
    
    // Simulate user preferences
    for (let i = 0; i < users.length; i++) {
      const numMovies = Math.floor(Math.random() * 5) + 3; // 3-7 movies
      const numMusic = Math.floor(Math.random() * 5) + 3; // 3-7 songs
      
      const likedMovies = movies
        .sort(() => 0.5 - Math.random())
        .slice(0, numMovies)
        .map(m => m._id);
        
      const likedMusic = music
        .sort(() => 0.5 - Math.random())
        .slice(0, numMusic)
        .map(m => m._id);
      
      await User.findByIdAndUpdate(users[i]._id, {
        likedMovies,
        likedMusic
      });
      
      console.log(`✓ Updated ${users[i].name} with ${numMovies} movies and ${numMusic} songs`);
    }
    
    console.log("✅ Successfully seeded user likes!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

seedUserLikes();
```

Run it:
```bash
cd backend
node scripts/seedUserLikes.js
```

### 2. Testing the API

#### Using the Test Script

```bash
chmod +x test-user-collaborative.sh
./test-user-collaborative.sh
```

#### Using curl

```bash
# Replace USER_ID with actual user ID from your database
curl http://localhost:5000/api/recommendations/user/USER_ID | jq '.'
```

#### Using the Browser

1. Get a user ID from MongoDB
2. Open: `http://localhost:5000/api/recommendations/user/YOUR_USER_ID`

### 3. Frontend Integration

#### Option A: Add to Existing Dashboard

In your main App or Dashboard component:

```tsx
import { useContext } from 'react';
import Recommendations from './pages/Recommendations';
import { AuthContext } from './context/AuthContext'; // adjust path

function Dashboard() {
  const { user } = useContext(AuthContext); // Get logged-in user
  
  return (
    <div>
      {/* Your existing dashboard content */}
      
      {user && <Recommendations userId={user._id} />}
    </div>
  );
}
```

#### Option B: Create a Dedicated Route

In `App.tsx`:

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Recommendations from './pages/Recommendations';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Existing routes */}
        <Route 
          path="/recommendations" 
          element={<Recommendations userId={currentUserId} />} 
        />
      </Routes>
    </BrowserRouter>
  );
}
```

## Testing Checklist

- [ ] Backend is running (`npm start` in /backend)
- [ ] Database has movies and music seeded
- [ ] Database has at least 2 users
- [ ] Users have `likedMovies` and `likedMusic` populated
- [ ] Endpoint responds: `GET /api/recommendations/user/:userId`
- [ ] Response includes both movies and music arrays
- [ ] Frontend component displays recommendations

## Troubleshooting

### No recommendations returned

**Cause**: Current user has no liked items, or no similar users found.

**Solution**: 
```javascript
// Add likes to the user
db.users.updateOne(
  {_id: ObjectId("USER_ID")},
  {$push: {likedMovies: ObjectId("MOVIE_ID")}}
);
```

### Error: "User not found"

**Cause**: Invalid user ID in the request.

**Solution**: Verify user ID exists:
```javascript
db.users.find({_id: ObjectId("USER_ID")});
```

### Similarity score always 0

**Cause**: No overlapping likes between users.

**Solution**: Manually create overlap:
```javascript
// Make two users like the same movie
const movieId = db.movies.findOne()._id;

db.users.updateMany(
  {},
  {$push: {likedMovies: movieId}}
);
```

### Frontend shows CORS error

**Cause**: Frontend and backend URLs don't match.

**Solution**: Check `project/vite.config.ts` proxy settings:
```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
});
```

## API Response Format

```json
{
  "success": true,
  "movies": [
    {
      "_id": "...",
      "title": "The Dark Knight",
      "genre": ["Action", "Drama"],
      "rating": 9.0,
      "posterUrl": "..."
    }
  ],
  "music": [
    {
      "_id": "...",
      "title": "Bohemian Rhapsody",
      "artist": "Queen",
      "genre": "Rock",
      "coverUrl": "..."
    }
  ],
  "totalRecommendations": 2
}
```

## Next Steps

1. **Add Like/Unlike Functionality**: Create endpoints to add/remove items from user's liked lists
2. **Improve Algorithm**: Use multiple similar users instead of just the top one
3. **Add Weights**: Give more weight to recent likes
4. **Hybrid Approach**: Combine with content-based filtering
5. **Track Interactions**: Log when users view/like recommended items

## MongoDB Quick Commands Reference

```javascript
// List users with their likes
db.users.find({}, {name: 1, email: 1, likedMovies: 1, likedMusic: 1}).pretty()

// Count likes per user
db.users.aggregate([
  {$project: {
    name: 1,
    movieCount: {$size: {$ifNull: ["$likedMovies", []]}},
    musicCount: {$size: {$ifNull: ["$likedMusic", []]}}
  }}
])

// Find users with common movie likes
db.users.find({
  likedMovies: {$in: [ObjectId("SPECIFIC_MOVIE_ID")]}
}, {name: 1})

// Clear all likes (reset)
db.users.updateMany({}, {$set: {likedMovies: [], likedMusic: []}})
```
