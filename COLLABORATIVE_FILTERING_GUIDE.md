# Collaborative Filtering Implementation Guide

## 🎯 What Was Implemented

I've implemented a **proper User-Based Collaborative Filtering** system with **Cosine Similarity** that works with your actual schema and data. This is a significant upgrade from the naive counting approach.

---

## 🏗️ Architecture

### Files Created/Modified

#### **NEW FILES:**
1. **`backend/services/collaborativeFilteringService.js`** (520 lines)
   - Core CF algorithm with cosine similarity
   - Handles both movies and music
   - Includes data audit functionality
   - Proper error handling and edge cases

2. **`test-collaborative-filtering.sh`**
   - Test script for all CF endpoints

#### **MODIFIED FILES:**
1. **`backend/controllers/recommendationController.js`**
   - Added 3 new controller functions
   - Added fallback logic to content-based filtering

2. **`backend/routes/recommendationRoutes.js`**
   - Added 3 new endpoints for CF

3. **`backend/services/recommendationService.js`**
   - Replaced naive CF with improved algorithm
   - Now calls the new CF service

---

## 📡 New API Endpoints

### 1. **Collaborative Movie Recommendations**
```bash
GET /api/recommendations/collaborative/movies
```

**Query Parameters:**
- `k` (default: 30) - Number of similar users to consider
- `limit` (default: 20) - Number of recommendations to return
- `minOverlap` (default: 2) - Minimum common likes required
- `similarityMetric` - Either `'cosine'` or `'jaccard'`

**Example:**
```bash
curl -X GET \
  "http://localhost:5000/api/recommendations/collaborative/movies?k=30&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "source": "collaborative_filtering",
  "data": {
    "recommendations": [
      {
        "_id": "...",
        "title": "The Shawshank Redemption",
        "genre": ["Drama"],
        "rating": 9.3,
        "recommendationScore": 2.45,
        "source": "collaborative_filtering"
      }
    ],
    "neighbors": [
      {
        "similarity": 0.87,
        "overlap": 15,
        "itemCount": 42
      }
    ],
    "stats": {
      "totalUsers": 156,
      "similarUsers": 34,
      "topKNeighbors": 30,
      "candidateItems": 87,
      "targetUserItems": 23
    }
  }
}
```

### 2. **Collaborative Music Recommendations**
```bash
GET /api/recommendations/collaborative/music
```
Same parameters and structure as movies.

### 3. **Data Audit Endpoint**
```bash
GET /api/recommendations/collaborative/audit
```

**Purpose:** Check if you have enough data for CF to work effectively

**Example:**
```bash
curl -X GET \
  "http://localhost:5000/api/recommendations/collaborative/audit" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "movies": {
      "totalInteractions": 342,
      "uniqueUsers": 45,
      "avgInteractionsPerUser": 7.6,
      "minInteractionsPerUser": 1,
      "maxInteractionsPerUser": 89,
      "isViableForCF": true,
      "recommendation": "✅ Sufficient data for collaborative filtering"
    },
    "music": {
      "totalInteractions": 156,
      "uniqueUsers": 23,
      "avgInteractionsPerUser": 6.78,
      "isViableForCF": true,
      "recommendation": "✅ Sufficient data for collaborative filtering"
    },
    "overall": {
      "totalInteractions": 498,
      "totalUniqueUsers": 52,
      "readyForCF": true
    }
  }
}
```

---

## 🧮 How the Algorithm Works

### **Cosine Similarity Formula**

For two users A and B:

```
similarity(A, B) = |A ∩ B| / √(|A| × |B|)
```

Where:
- `|A ∩ B|` = Number of items both users liked
- `|A|` = Total items user A liked
- `|B|` = Total items user B liked

**Example:**
- User A liked: [Movie1, Movie2, Movie3, Movie4, Movie5] (5 movies)
- User B liked: [Movie2, Movie3, Movie6, Movie7] (4 movies)
- Common: [Movie2, Movie3] (2 movies)

```
similarity = 2 / √(5 × 4) = 2 / 4.47 = 0.447
```

### **Recommendation Process**

1. **Build User-Item Matrix**
   - Load all user interactions from `UserInteraction` model
   - Create mapping: `userId → Set of liked itemIds`

2. **Find Similar Users**
   - For target user, compare with all other users
   - Calculate similarity score
   - Filter users with `minOverlap` common items
   - Keep top-k most similar users

3. **Aggregate Recommendations**
   - For each neighbor's liked items:
     - Skip if target user already liked it
     - Add neighbor's similarity score to item's total score
   - Items liked by more similar users get higher scores

4. **Rank and Return**
   - Sort items by total score (descending)
   - Fetch movie/music documents
   - Return top N recommendations

---

## 🔄 Integration with Hybrid System

Your existing hybrid recommendation endpoints (`/api/recommendations/movies` and `/api/recommendations/music`) now use the **improved CF algorithm** automatically.

**Hybrid Weighting:**
- Content-Based: 40%
- **Collaborative Filtering**: 30% (now using cosine similarity!)
- Mood-Based: 30%

---

## 📊 When CF Works vs. Fails

### ✅ **CF Works Well When:**
- You have 20+ active users
- Users have 5+ interactions each
- There's overlap in user preferences
- Users have diverse tastes (not everyone likes the same thing)

### ❌ **CF Fails When:**
- Too few users (< 10)
- Too few interactions per user (< 3)
- No overlap in preferences
- **Cold start**: New users with no history

**Your System Handles This:** If CF returns no results, it automatically falls back to content-based recommendations!

---

## 🧪 Testing Instructions

### **Step 1: Check Data Readiness**
```bash
# Make the test script executable
chmod +x test-collaborative-filtering.sh

# Run it (you'll need a JWT token)
./test-collaborative-filtering.sh
```

### **Step 2: Manual Testing**

1. **Login and get JWT token:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}'
```

2. **Check if you have enough data:**
```bash
curl -X GET \
  "http://localhost:5000/api/recommendations/collaborative/audit" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

3. **Test CF recommendations:**
```bash
curl -X GET \
  "http://localhost:5000/api/recommendations/collaborative/movies?k=20&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🎛️ Tuning Parameters

### **k (Number of Neighbors)**
- **Low (5-10)**: Only very similar users influence recommendations
  - Pro: Higher precision
  - Con: Fewer recommendations
  
- **Medium (20-40)**: Balanced approach (RECOMMENDED)
  - Pro: Good mix of precision and coverage
  
- **High (50+)**: Include more users
  - Pro: More diverse recommendations
  - Con: May include less similar users

### **minOverlap**
- **Low (1-2)**: Include users with minimal overlap (RECOMMENDED for small datasets)
- **Medium (3-5)**: Require moderate overlap
- **High (6+)**: Only very similar users (needs large dataset)

### **similarityMetric**
- **`cosine`**: Better for sparse data, handles different activity levels (RECOMMENDED)
- **`jaccard`**: Simpler, good for binary data

---

## 🚀 Next Steps

### **Immediate:**
1. ✅ Run the audit endpoint to check your data
2. ✅ Test both CF endpoints with your JWT token
3. ✅ Compare CF vs Hybrid vs Content-based results

### **If Insufficient Data:**
```javascript
// You need to add more user interactions
// This can be done through your frontend when users:
// - Like/favorite items
// - Rate items
// - Add to playlists

// Example interaction tracking:
POST /api/recommendations/interact
{
  "itemId": "movie_id_here",
  "itemType": "movie",
  "interactionType": "like"
}
```

### **For Production:**
1. **Caching**: Cache CF results (they don't need to update in real-time)
2. **Batch Processing**: Pre-compute similarities periodically
3. **Database Indexes**: Already handled in your UserInteraction model
4. **Monitoring**: Track CF success rate vs fallback rate

---

## 🐛 Troubleshooting

### **"No recommendations returned"**
**Cause:** Not enough data or no similar users
**Solution:** 
1. Check audit endpoint
2. Lower `minOverlap` to 1
3. Increase `k` to 50+
4. Verify UserInteraction data exists

### **"Recommendations seem random"**
**Cause:** Similarity scores too low
**Solution:**
1. Check if users have enough overlap
2. Try `jaccard` similarity instead
3. Verify data quality in UserInteraction

### **"Always returns fallback"**
**Cause:** Current user has no interactions
**Solution:**
1. User needs to like/favorite some items first
2. Use pure content-based for new users

---

## 💡 Key Improvements Over Original Code

| Aspect | Original Code | My Implementation |
|--------|---------------|-------------------|
| **Similarity Metric** | Simple counting | Cosine similarity (normalized) |
| **Data Source** | Wrong model (Favorite) | Correct (UserInteraction) |
| **Schema Compatibility** | ❌ Didn't match | ✅ Perfect match |
| **Edge Cases** | ❌ None | ✅ Cold start, sparse data |
| **Fallback** | ❌ None | ✅ Auto-fallback |
| **Monitoring** | ❌ None | ✅ Audit endpoint |
| **Both Media Types** | ❌ Movies only | ✅ Movies + Music |
| **Weight by Similarity** | ❌ No | ✅ Yes |
| **Error Handling** | ❌ Basic | ✅ Comprehensive |

---

## 📖 Example Use Cases

### **Use Case 1: "Find me movies like users with my taste"**
```javascript
// Cosine similarity ensures users with 100 likes and users with 10 likes
// are compared fairly - it normalizes by their activity level
```

### **Use Case 2: "I'm a new user"**
```javascript
// System automatically falls back to content-based or popular items
// Once you like 2+ items, CF kicks in
```

### **Use Case 3: "Show me diverse recommendations"**
```javascript
// Increase k=50 and lower minOverlap=1
// This includes more neighbors with varied tastes
```

---

## ✅ Verification Checklist

- [x] CF service uses correct UserInteraction model
- [x] Works with actual MongoDB schema (_id, not id)
- [x] Handles both movies and music
- [x] Proper cosine similarity implementation
- [x] Weighted scoring based on user similarity
- [x] Automatic fallback to content-based
- [x] Data audit functionality
- [x] Comprehensive error handling
- [x] Cold start protection
- [x] Integrated with existing hybrid system
- [x] Test script provided
- [x] Full documentation

---

## 🎓 Learning Resources

**What is Collaborative Filtering?**
- Recommends items based on user behavior patterns
- "Users who liked X also liked Y"
- Works without knowing item content

**Cosine vs Jaccard:**
- **Cosine**: Better when users have different activity levels
- **Jaccard**: Simpler, treats all users equally

**Cold Start Problem:**
- New users have no history → no CF recommendations
- Solution: Use content-based or popularity-based fallback

---

**Need help?** Check the audit endpoint first, it will tell you exactly what's needed!
