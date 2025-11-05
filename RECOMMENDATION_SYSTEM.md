# 🎯 Hybrid Recommendation System Documentation

## Overview

This app now features a **Hybrid Recommendation System** that combines three powerful algorithms to provide personalized movie and music recommendations:

1. **Content-Based Filtering** (40% weight)
2. **Collaborative Filtering** (30% weight)
3. **Mood-Based Recommendations** (30% weight)

---

## 🚀 Features

### ✅ Personalized Recommendations
- **Movies**: Get movie suggestions based on your viewing history, preferences, and mood
- **Music**: Get song suggestions based on your listening history, audio features, and mood

### ✅ User Interaction Tracking
- **Likes**: Track movies/music you love
- **Views**: Record what you've watched/listened to
- **Ratings**: Rate content from 1-5 stars
- **Favorites**: Mark your absolute favorites

### ✅ Mood-Based Discovery
- Filter recommendations by your current mood
- Mood options: happy, sad, energetic, calm, romantic, angry, motivational, relaxing

---

## 📡 API Endpoints

### **1. Get Movie Recommendations**
```http
GET /api/recommendations/movies?mood=happy&limit=20
```

**Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Query Parameters:**
- `mood` (optional): Filter by mood (happy, sad, energetic, calm, romantic, angry, motivational, relaxing)
- `limit` (optional): Number of recommendations (default: 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "_id": "...",
        "title": "The Shawshank Redemption",
        "genre": ["Drama"],
        "mood": ["inspirational", "hopeful"],
        "rating": 9.3,
        "releaseYear": 1994,
        "posterUrl": "...",
        "overview": "...",
        "popularity": 1500,
        "recommendationScore": 8.5
      }
    ],
    "liked": [
      // Movies you've previously liked
    ],
    "mood": "happy"
  }
}
```

---

### **2. Get Music Recommendations**
```http
GET /api/recommendations/music?mood=energetic&limit=20
```

**Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Query Parameters:**
- `mood` (optional): Filter by mood
- `limit` (optional): Number of recommendations (default: 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "_id": "...",
        "title": "Lose Yourself",
        "artist": "Eminem",
        "genre": "Hip-Hop",
        "album": "8 Mile",
        "duration": "5:26",
        "popularity": 950,
        "energy": 0.9,
        "valence": 0.7,
        "danceability": 0.8,
        "recommendationScore": 7.8
      }
    ],
    "liked": [
      // Music you've previously liked
    ],
    "mood": "energetic"
  }
}
```

---

### **3. Track User Interaction**
```http
POST /api/recommendations/interact
```

**Headers:**
```
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
```

**Body:**
```json
{
  "itemId": "60d5ecb68b25a02d4c8b4567",
  "itemType": "movie",
  "interactionType": "like",
  "rating": 5,
  "mood": "happy",
  "duration": 120
}
```

**Parameters:**
- `itemId` (required): ID of the movie or music
- `itemType` (required): "movie" or "music"
- `interactionType` (required): "view", "like", "rating", or "favorite"
- `rating` (optional): Rating from 1-5
- `mood` (optional): Mood when interacting
- `duration` (optional): Time spent (in seconds)

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "user": "...",
    "itemId": "...",
    "itemType": "movie",
    "interactionType": "like",
    "rating": 5,
    "mood": "happy",
    "createdAt": "2025-11-05T..."
  }
}
```

---

### **4. Get Liked Movies**
```http
GET /api/recommendations/liked/movies
```

**Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "title": "Inception",
      "genre": ["Sci-Fi", "Thriller"],
      ...
    }
  ]
}
```

---

### **5. Get Liked Music**
```http
GET /api/recommendations/liked/music
```

**Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "title": "Bohemian Rhapsody",
      "artist": "Queen",
      ...
    }
  ]
}
```

---

## 🧠 How It Works

### **1. Content-Based Filtering (40% weight)**

Recommends items similar to what you've liked before:

**For Movies:**
- Analyzes genres (Action, Drama, Comedy, etc.)
- Considers moods (exciting, emotional, funny, etc.)
- Factors in ratings and popularity

**For Music:**
- Analyzes genres (Hip-Hop, Rock, Pop, etc.)
- Compares artists
- Uses audio features (energy, valence, danceability, tempo)

**Algorithm:**
```javascript
// Calculates similarity score based on:
score = (genre_overlap × 2) + (mood_overlap × 1) + (popularity / 1000) + (rating / 2)
```

---

### **2. Collaborative Filtering (30% weight)**

Recommends items liked by users with similar taste:

1. Finds users who liked the same items as you
2. Gets items those users also liked
3. Ranks by how many similar users liked each item

**Algorithm:**
```javascript
// Finds "taste neighbors"
similarUsers = users who liked ≥3 of the same items as you

// Recommends items they liked
score = count of similar users who liked this item
```

---

### **3. Mood-Based Recommendations (30% weight)**

Filters by your current mood:

**For Movies:**
- Filters by mood tags (e.g., "happy" movies for happy mood)
- Sorts by popularity and rating

**For Music:**
- Maps mood to audio features:
  - `happy`: high energy (0.7), high valence (0.8)
  - `sad`: low energy (0.3), low valence (0.2)
  - `energetic`: very high energy (0.9), high valence (0.7)
  - `calm`: low energy (0.3), medium valence (0.5)

**Algorithm:**
```javascript
// Finds music with similar audio features
energy_diff = |track.energy - mood.energy|
valence_diff = |track.valence - mood.valence|
similarity = 1 - (energy_diff + valence_diff) / 2
```

---

### **4. Hybrid Combination**

Final recommendations combine all three methods:

```javascript
final_score = (content_score × 0.4) + 
              (collaborative_score × 0.3) + 
              (mood_score × 0.3)
```

Items are ranked by `final_score` and top N are returned.

---

## 💡 Usage Examples

### **Example 1: Get Happy Movie Recommendations**

```javascript
// Frontend code
const getMovieRecommendations = async () => {
  try {
    const response = await fetch(
      'https://your-backend.com/api/recommendations/movies?mood=happy&limit=10',
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    const data = await response.json();
    console.log('Recommended movies:', data.data.recommendations);
    console.log('Your liked movies:', data.data.liked);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

---

### **Example 2: Track Movie Like**

```javascript
// When user clicks "Like" button
const likeMovie = async (movieId) => {
  try {
    await fetch('https://your-backend.com/api/recommendations/interact', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        itemId: movieId,
        itemType: 'movie',
        interactionType: 'like',
        mood: 'happy' // current user mood
      })
    });
    
    console.log('Movie liked!');
  } catch (error) {
    console.error('Error:', error);
  }
};
```

---

### **Example 3: Track Song Rating**

```javascript
// When user rates a song
const rateSong = async (songId, rating) => {
  try {
    await fetch('https://your-backend.com/api/recommendations/interact', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        itemId: songId,
        itemType: 'music',
        interactionType: 'rating',
        rating: rating // 1-5 stars
      })
    });
    
    console.log('Song rated!');
  } catch (error) {
    console.error('Error:', error);
  }
};
```

---

## 🎨 Frontend Integration

### **Display Recommendations**

```javascript
// React component example
import { useState, useEffect } from 'react';

function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState([]);
  const [liked, setLiked] = useState([]);
  const [mood, setMood] = useState('happy');
  
  useEffect(() => {
    fetchRecommendations();
  }, [mood]);
  
  const fetchRecommendations = async () => {
    const response = await fetch(
      `/api/recommendations/movies?mood=${mood}`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );
    const data = await response.json();
    setRecommendations(data.data.recommendations);
    setLiked(data.data.liked);
  };
  
  return (
    <div>
      <h2>Your Liked Movies</h2>
      <div className="grid">
        {liked.map(movie => (
          <MovieCard key={movie._id} movie={movie} />
        ))}
      </div>
      
      <h2>Recommended for You</h2>
      <MoodSelector mood={mood} onChange={setMood} />
      <div className="grid">
        {recommendations.map(movie => (
          <MovieCard 
            key={movie._id} 
            movie={movie}
            onLike={() => likeMovie(movie._id)}
          />
        ))}
      </div>
    </div>
  );
}
```

---

## 📊 Database Models

### **UserInteraction Model**

Stores all user interactions:

```javascript
{
  user: ObjectId,           // Reference to User
  itemType: "movie|music",  // Type of content
  itemId: ObjectId,         // Reference to Movie or Music
  interactionType: "view|like|rating|favorite",
  rating: Number,           // 1-5 stars
  mood: String,             // Mood during interaction
  duration: Number,         // Time spent (seconds)
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔧 Configuration

### **Adjust Recommendation Weights**

Edit `backend/services/recommendationService.js`:

```javascript
// In getMovieRecommendations or getMusicRecommendations
const combined = this.combineRecommendations(
  [
    { items: contentBased, weight: 0.5 },      // Increase content-based
    { items: collaborative, weight: 0.2 },     // Decrease collaborative
    { items: moodBased, weight: 0.3 },         // Keep mood-based
  ],
  limit
);
```

### **Add New Moods**

Edit `getMoodFeatures()` method:

```javascript
getMoodFeatures(mood) {
  const moodMap = {
    // ... existing moods
    excited: { energy: 0.95, valence: 0.9, danceability: 0.85 },
    melancholic: { energy: 0.25, valence: 0.15, danceability: 0.2 },
  };
  
  return moodMap[mood.toLowerCase()] || { energy: 0.5, valence: 0.5, danceability: 0.5 };
}
```

---

## 🚀 Getting Started

### **1. Start the Backend**

```bash
cd backend
npm install
npm start
```

### **2. Test the API**

```bash
# Login first
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Get recommendations (use token from login)
curl -X GET "http://localhost:5000/api/recommendations/movies?mood=happy" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### **3. Track Interactions**

```bash
# Like a movie
curl -X POST http://localhost:5000/api/recommendations/interact \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"itemId":"MOVIE_ID","itemType":"movie","interactionType":"like"}'
```

---

## 📈 Performance Tips

1. **Index Optimization**: The system uses indexes on `user`, `itemType`, and `interactionType` for fast queries
2. **Caching**: Consider caching recommendations for 1-2 hours to reduce database load
3. **Pagination**: Use the `limit` parameter to control response size
4. **Background Jobs**: Run recommendation pre-computation as a background job for popular users

---

## 🎉 Benefits

- **Personalized**: Tailored to each user's unique taste
- **Diverse**: Combines multiple algorithms for variety
- **Mood-Aware**: Adapts to user's current emotional state
- **Learning**: Gets better as users interact more
- **Scalable**: Optimized queries with proper indexing

---

**Enjoy your new intelligent recommendation system!** 🎬🎵

