# 🚀 Quick Start: User-User Collaborative Filtering

## ✅ What's Been Implemented

### Backend
- ✅ User model extended with `likedMovies` and `likedMusic` arrays
- ✅ Cosine similarity algorithm in `/backend/utils/collaborativeFiltering.js`
- ✅ New endpoint: `GET /api/recommendations/user/:userId`
- ✅ Controller and routes added to existing recommendation system

### Frontend
- ✅ New component: `/project/src/pages/Recommendations.tsx`
- ✅ Responsive grid layout for movies and music
- ✅ Loading states and error handling

## 🎯 How to Test (3 Simple Steps)

### Step 1: Seed User Likes

```bash
cd backend
node scripts/seedUserLikes.js
```

**What this does:**
- Takes existing users from your database
- Randomly assigns liked movies and music
- Creates overlap between users for testing collaborative filtering

### Step 2: Start the Backend (if not running)

```bash
cd backend
npm start
```

Backend should start on `http://localhost:5000`

### Step 3: Test the API

#### Option A: Use the Test Script

```bash
# From project root
./test-user-collaborative.sh
```

This interactive script will:
- Check if backend is running
- Prompt you for a user ID
- Display recommendations in formatted JSON

#### Option B: Manual Testing

```bash
# Get a user ID first
mongosh your_database_name
> db.users.findOne({}, {_id: 1})

# Test the endpoint (replace USER_ID)
curl http://localhost:5000/api/recommendations/user/USER_ID | jq '.'
```

#### Option C: Browser Testing

Open in browser:
```
http://localhost:5000/api/recommendations/user/YOUR_USER_ID
```

## 📊 Expected Response

```json
{
  "success": true,
  "movies": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "The Dark Knight",
      "genre": ["Action", "Crime", "Drama"],
      "rating": 9.0,
      "posterUrl": "https://..."
    }
  ],
  "music": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "title": "Bohemian Rhapsody",
      "artist": "Queen",
      "genre": "Rock",
      "coverUrl": "https://..."
    }
  ],
  "totalRecommendations": 2
}
```

## 🎨 Using the Frontend Component

### In Your Dashboard or App.tsx

```tsx
import Recommendations from './pages/Recommendations';

function Dashboard() {
  const userId = "YOUR_USER_ID"; // Get from auth context
  
  return (
    <div>
      <h1>Dashboard</h1>
      <Recommendations userId={userId} />
    </div>
  );
}
```

### With Authentication Context

```tsx
import { useAuth } from './context/AuthContext';
import Recommendations from './pages/Recommendations';

function Dashboard() {
  const { user } = useAuth();
  
  return (
    <div>
      {user && <Recommendations userId={user._id} />}
    </div>
  );
}
```

## 🔍 Verifying It Works

### Check Database

```javascript
// In mongosh
use your_database_name

// See which users have likes
db.users.find({}, {
  name: 1, 
  email: 1,
  likedMovies: 1, 
  likedMusic: 1
}).pretty()

// Count likes
db.users.aggregate([
  {$project: {
    name: 1,
    totalMovies: {$size: {$ifNull: ["$likedMovies", []]}},
    totalMusic: {$size: {$ifNull: ["$likedMusic", []]}}
  }}
])
```

### Check Logs

When you call the endpoint, backend console should show:

```
Most similar user has similarity score: 0.707
Recommending 5 items
```

## 🐛 Troubleshooting

### "No recommendations available"

**Cause:** User has no liked items, or no similar users exist.

**Fix:**
```bash
cd backend
node scripts/seedUserLikes.js
```

### "User not found"

**Cause:** Invalid user ID.

**Fix:** Get valid user ID:
```javascript
// In mongosh
db.users.find({}, {_id: 1, name: 1})
```

### CORS Error in Frontend

**Fix:** Check `/project/vite.config.ts` has proxy configured:
```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api': 'http://localhost:5000'
    }
  }
});
```

### Module Import Error

**Cause:** Using CommonJS `require` in ES6 module.

**Note:** The implementation uses ES6 imports (`import/export`) to match your existing codebase.

## 🧪 Manual Testing Scenarios

### Scenario 1: Test User Similarity

```javascript
// In mongosh

// Get two user IDs
const user1 = db.users.findOne({})._id;
const user2 = db.users.find({}).skip(1).limit(1).toArray()[0]._id;

// Get a movie both should like
const movie = db.movies.findOne({})._id;

// Make both like the same movie
db.users.updateOne({_id: user1}, {$push: {likedMovies: movie}});
db.users.updateOne({_id: user2}, {$push: {likedMovies: movie}});

// Add unique movie to user2
const uniqueMovie = db.movies.find({_id: {$ne: movie}}).limit(1).toArray()[0]._id;
db.users.updateOne({_id: user2}, {$push: {likedMovies: uniqueMovie}});

// Now test: user1 should get uniqueMovie recommended
```

Then call:
```bash
curl http://localhost:5000/api/recommendations/user/USER1_ID
```

Should include `uniqueMovie` in results!

### Scenario 2: No Overlap Test

```javascript
// Clear one user's likes
db.users.updateOne(
  {_id: ObjectId("USER_ID")},
  {$set: {likedMovies: [], likedMusic: []}}
);
```

Call endpoint - should return empty recommendations.

## 📈 Next Steps to Improve

1. **Add Like Button:** Create endpoint to add items to user's likes
   ```javascript
   // POST /api/users/:userId/likes
   { itemId: "...", itemType: "movie" }
   ```

2. **Use Multiple Similar Users:** Instead of top 1, use top 5
   ```javascript
   const topSimilar = similarities.slice(0, 5);
   ```

3. **Add Confidence Scores:** Return similarity score with recommendations
   ```javascript
   {
     recommendations: [...],
     similarityScore: 0.707,
     basedOnUsers: [...]
   }
   ```

4. **Filter by Genre:** Let users filter recommended items
   ```javascript
   GET /api/recommendations/user/:userId?genre=Action
   ```

5. **Track Recommendation Success:** Log when users interact with recommendations

## 📁 Files Modified/Created

### Modified
- `/backend/models/userModel.js` - Added likedMovies/likedMusic
- `/backend/controllers/recommendationController.js` - Added controller
- `/backend/routes/recommendationRoutes.js` - Added route

### Created
- `/backend/utils/collaborativeFiltering.js` - Core algorithm
- `/backend/scripts/seedUserLikes.js` - Seeding script
- `/project/src/pages/Recommendations.tsx` - Frontend component
- `/test-user-collaborative.sh` - Testing script
- `/USER_COLLABORATIVE_FILTERING_GUIDE.md` - Full documentation
- `/QUICKSTART_USER_CF.md` - This file

## 🎉 Success Criteria

✅ Backend responds to `/api/recommendations/user/:userId`  
✅ Response includes movies and music arrays  
✅ Frontend component displays recommendations  
✅ Similar users get similar recommendations  
✅ Users with unique likes get unique recommendations  

## 💡 Key Concepts

**Cosine Similarity:**
- Measures angle between two vectors
- Range: 0 (no similarity) to 1 (identical)
- Formula: intersection / sqrt(size_A × size_B)

**User-User CF:**
- Find users with similar taste
- Recommend what they liked
- Works best with many users

**Current Limitation:**
- Only uses top 1 similar user
- No weighting by recency
- No genre/mood filtering

These can be improved in future iterations!

---

Need help? Check the full guide: `USER_COLLABORATIVE_FILTERING_GUIDE.md`
