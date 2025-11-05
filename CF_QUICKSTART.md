# Collaborative Filtering - Quick Start

## ✅ What Was Done

I've implemented **proper User-Based Collaborative Filtering with Cosine Similarity** for your recommendation system. This is production-ready code that:

1. ✅ Works with your **actual schema** (UserInteraction model)
2. ✅ Uses **cosine similarity** (better than simple counting)
3. ✅ Handles **both movies and music**
4. ✅ Has **automatic fallback** to content-based when CF fails
5. ✅ Includes **data audit** to check if CF will work
6. ✅ Properly **weights recommendations** by user similarity

---

## 🚀 How to Use

### **1. Test Your Data First**

Before using CF, check if you have enough data:

```bash
# Get your JWT token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}'

# Check data readiness
curl -X GET \
  "http://localhost:5000/api/recommendations/collaborative/audit" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" | jq '.'
```

**You need:**
- At least 10 users with interactions
- Average 3+ likes/favorites per user

### **2. Get Collaborative Recommendations**

```bash
# Movie recommendations
curl -X GET \
  "http://localhost:5000/api/recommendations/collaborative/movies?limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" | jq '.'

# Music recommendations  
curl -X GET \
  "http://localhost:5000/api/recommendations/collaborative/music?limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" | jq '.'
```

### **3. Or Use Automated Test Script**

```bash
cd /Users/dhanushg/Desktop/project-bolt-sb1-n9f8dnts\ 2
./test-collaborative-filtering.sh
```

---

## 📡 New API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/recommendations/collaborative/movies` | Pure CF movie recommendations |
| `GET /api/recommendations/collaborative/music` | Pure CF music recommendations |
| `GET /api/recommendations/collaborative/audit` | Check if data is ready for CF |

**Query Parameters:**
- `k=30` - Number of similar users to consider (10-50)
- `limit=20` - Number of recommendations (1-50)
- `minOverlap=2` - Min common items required (1-5)
- `similarityMetric=cosine` - Use `cosine` or `jaccard`

---

## 🔄 Your Existing Endpoints Are Enhanced

Your hybrid endpoints now use the **improved CF** automatically:

- `GET /api/recommendations/movies` - Now uses cosine similarity CF
- `GET /api/recommendations/music` - Now uses cosine similarity CF

No frontend changes needed! They just work better now.

---

## 💡 How It Works (Simple Explanation)

**Before (Naive CF):**
```
Find users who liked same movies → Count how many liked each movie → Return top counts
```
❌ Problem: Treats all users equally, no similarity weighting

**Now (Cosine Similarity CF):**
```
1. Calculate similarity score for each user pair (0-1)
2. Find top-k most similar users to you
3. Recommend items they liked, weighted by their similarity to you
4. Higher similarity = stronger recommendation
```
✅ Better: Recommendations from very similar users get higher scores

---

## 📊 Example

**Your Liked Movies:**
- The Shawshank Redemption
- The Godfather
- The Dark Knight
- Inception
- Interstellar

**User A (Similarity: 0.89)** also likes:
- Fight Club ← Gets high score (0.89)
- Pulp Fiction ← Gets high score (0.89)

**User B (Similarity: 0.23)** also likes:
- Frozen ← Gets low score (0.23)

**Result:** You'll get Fight Club and Pulp Fiction recommended, not Frozen!

---

## 🐛 Troubleshooting

### **"No recommendations returned"**
**Check:**
1. Run the audit endpoint - do you have enough data?
2. Has the user liked any items?
3. Are there other users with overlapping preferences?

**Fix:**
```bash
# Lower the requirements
GET /api/recommendations/collaborative/movies?minOverlap=1&k=50
```

### **"Always getting content-based fallback"**
**Cause:** Not enough user interaction data

**Solution:**
```javascript
// Users need to like/favorite items first
POST /api/recommendations/interact
{
  "itemId": "movie_id",
  "itemType": "movie",
  "interactionType": "like"
}
```

---

## 📁 Files Modified

```
✅ NEW: backend/services/collaborativeFilteringService.js (520 lines)
✅ NEW: test-collaborative-filtering.sh
✅ NEW: COLLABORATIVE_FILTERING_GUIDE.md

✏️ MODIFIED: backend/controllers/recommendationController.js (+130 lines)
✏️ MODIFIED: backend/routes/recommendationRoutes.js (+8 lines)
✏️ MODIFIED: backend/services/recommendationService.js (-120 lines, improved)
```

---

## 🎯 Key Advantages

| Feature | Value |
|---------|-------|
| **Accuracy** | Better similarity calculation (cosine) |
| **Robustness** | Auto-fallback if insufficient data |
| **Scalability** | Works with growing user base |
| **Monitoring** | Audit endpoint shows data health |
| **Flexibility** | Tune k, minOverlap, similarity metric |
| **Coverage** | Both movies and music |

---

## ⚡ Performance Notes

- **For < 1000 users:** Real-time CF works fine
- **For 1000+ users:** Consider caching CF results
- **Database:** Already optimized with UserInteraction indexes

---

## 🎓 What You Should Know

**Collaborative Filtering works best when:**
- Multiple users have interacted with multiple items
- There's diversity in user preferences
- Users have some overlap in taste

**It fails when:**
- New user (cold start) → Uses content-based fallback
- Unique taste (no similar users) → Uses content-based fallback
- Very few users → Uses content-based fallback

**Your system handles all these cases automatically!**

---

## ✅ Testing Checklist

- [ ] Backend is running (`cd backend && npm start`)
- [ ] You have a user account (register/login)
- [ ] User has liked at least 2 movies or music tracks
- [ ] Run audit endpoint to check data
- [ ] Test CF movie endpoint
- [ ] Test CF music endpoint
- [ ] Compare with hybrid endpoint
- [ ] Try different parameters (k, minOverlap)

---

## 📚 Full Documentation

For detailed explanation, algorithm details, and advanced usage:
→ See `COLLABORATIVE_FILTERING_GUIDE.md`

---

## 🙏 Questions?

**"How do I know if CF is working?"**
- Check the `source` field in response: `"collaborative_filtering"` or `"fallback_content_based"`
- Check the `neighbors` array - should have similar users listed

**"Why am I getting fallback results?"**
- Run the audit endpoint - it tells you exactly what's missing

**"Can I use both CF and content-based?"**
- Yes! Use `/api/recommendations/movies` - it's hybrid (combines both)
- Or use `/api/recommendations/collaborative/movies` for pure CF

**"Which similarity metric should I use?"**
- Start with `cosine` (default) - it's better for most cases
- Try `jaccard` if your users have similar activity levels

---

**Ready to test? Run the audit endpoint first!** 🚀
