# 🚀 Pre-Deployment Checklist & Verification

## ✅ Quick Status Check

**Backend Code:** ✅ No syntax errors  
**CF Service:** ✅ Properly integrated  
**API Routes:** ✅ Configured correctly  

---

## 📋 Complete Pre-Deployment Checklist

### **1. Backend Verification**

#### A. Start Backend Server
```bash
cd backend
npm start
```

**Expected Output:**
```
✓ MongoDB connected
✓ Server running on port 5000
```

**If it fails:**
- Check MongoDB connection string in `.env`
- Ensure MongoDB is running
- Check for port conflicts

#### B. Test Health Endpoint
```bash
curl http://localhost:5000/api/health
```

**Expected:** `{ "status": "ok" }` or similar

---

### **2. Test Collaborative Filtering**

#### A. Login to Get JWT Token
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "yourpassword"
  }'
```

**Save the token from response.**

#### B. Run Data Audit
```bash
curl -X GET \
  "http://localhost:5000/api/recommendations/collaborative/audit" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" | jq '.'
```

**Check:**
- [ ] Response is 200 OK
- [ ] Shows number of users and interactions
- [ ] Indicates if CF is viable

#### C. Test CF Movie Endpoint
```bash
curl -X GET \
  "http://localhost:5000/api/recommendations/collaborative/movies?limit=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" | jq '.'
```

**Check:**
- [ ] Response is 200 OK
- [ ] Returns recommendations or fallback
- [ ] No error messages

#### D. Test CF Music Endpoint
```bash
curl -X GET \
  "http://localhost:5000/api/recommendations/collaborative/music?limit=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" | jq '.'
```

---

### **3. Test Existing Endpoints (Ensure Nothing Broke)**

#### A. Hybrid Movie Recommendations
```bash
curl -X GET \
  "http://localhost:5000/api/recommendations/movies?limit=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" | jq '.'
```

#### B. Hybrid Music Recommendations
```bash
curl -X GET \
  "http://localhost:5000/api/recommendations/music?limit=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" | jq '.'
```

#### C. Get Movies List
```bash
curl -X GET \
  "http://localhost:5000/api/movies?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" | jq '.'
```

---

### **4. Frontend Verification**

#### A. Start Frontend
```bash
cd project
npm run dev
```

**Expected:** Frontend runs on `http://localhost:5173` (or similar)

#### B. Manual Testing
- [ ] Login works
- [ ] Movie page loads
- [ ] Music page loads
- [ ] Recommendations display
- [ ] Like/favorite buttons work
- [ ] No console errors

---

### **5. Environment Variables Check**

#### Backend `.env` must have:
```bash
# Check these exist and are correct
cat backend/.env
```

**Required:**
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
NODE_ENV=production  # for deployment
```

#### Frontend `.env` (if exists):
```env
VITE_API_URL=http://localhost:5000  # local
# or
VITE_API_URL=https://your-backend-url.com  # production
```

---

### **6. Dependencies Check**

#### Backend
```bash
cd backend
npm install
```

**Verify these are installed:**
- ✅ express
- ✅ mongoose
- ✅ jsonwebtoken
- ✅ bcryptjs
- ✅ cors
- ✅ dotenv

#### Frontend
```bash
cd project
npm install
```

---

### **7. Database Verification**

#### A. Check MongoDB Connection
```bash
# If using MongoDB Atlas, test connection:
mongosh "your_connection_string"
```

#### B. Verify Collections Exist
```javascript
use your_database_name
show collections
```

**Required collections:**
- ✅ users
- ✅ movies
- ✅ musics
- ✅ userinteractions
- ✅ favorites

#### C. Check Sample Data
```javascript
db.userinteractions.countDocuments()
db.movies.countDocuments()
db.musics.countDocuments()
```

---

### **8. Performance Check**

#### Test Response Times
```bash
# Should be < 500ms
time curl -X GET \
  "http://localhost:5000/api/recommendations/collaborative/movies?limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" > /dev/null
```

**Acceptable:**
- ✅ < 200ms: Excellent
- ✅ 200-500ms: Good
- ⚠️ 500-1000ms: Acceptable but consider optimization
- ❌ > 1000ms: Need optimization (caching, indexing)

---

### **9. Error Handling Verification**

#### Test Invalid Requests
```bash
# No auth token
curl -X GET \
  "http://localhost:5000/api/recommendations/collaborative/movies"

# Expected: 401 Unauthorized

# Invalid parameters
curl -X GET \
  "http://localhost:5000/api/recommendations/collaborative/movies?k=invalid" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Expected: Still works (uses defaults)
```

---

### **10. Build for Production**

#### Backend (No build needed, but verify)
```bash
cd backend
NODE_ENV=production node server.js
```

**Should start without errors**

#### Frontend
```bash
cd project
npm run build
```

**Expected:**
```
✓ built in Xs
dist/ directory created
```

**Verify dist folder:**
```bash
ls -la project/dist/
```

Should contain:
- ✅ index.html
- ✅ assets/ folder
- ✅ Static files

---

## 🔧 Common Issues & Fixes

### **"Cannot connect to MongoDB"**
```bash
# Check connection string
echo $MONGODB_URI

# Test connection
mongosh "your_connection_string"
```

**Fix:**
- Update `.env` with correct connection string
- Ensure MongoDB is running
- Check IP whitelist (if using Atlas)

### **"Module not found" errors**
```bash
# Reinstall dependencies
cd backend
rm -rf node_modules package-lock.json
npm install

cd ../project
rm -rf node_modules package-lock.json
npm install
```

### **"Port already in use"**
```bash
# Find and kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Or change port in .env
PORT=5001
```

### **"JWT token invalid"**
- Token might be expired (re-login)
- Check JWT_SECRET matches between login and verification
- Ensure token is being sent in Authorization header

---

## 📦 Deployment Steps

### **For Railway/Render/Heroku:**

#### 1. Prepare Backend
```bash
cd backend

# Ensure package.json has start script
"scripts": {
  "start": "node server.js"
}

# Create Procfile (if needed)
echo "web: node server.js" > Procfile
```

#### 2. Environment Variables
Set these in your deployment platform:
- `MONGODB_URI`
- `JWT_SECRET`
- `PORT` (usually auto-set)
- `NODE_ENV=production`

#### 3. Deploy Backend
```bash
# Push to your deployment platform
git add .
git commit -m "Add collaborative filtering"
git push origin main
```

#### 4. Prepare Frontend
```bash
cd project

# Build
npm run build

# Update API URL to production backend
# Edit .env.production
VITE_API_URL=https://your-backend-url.com
```

#### 5. Deploy Frontend (Vercel/Netlify)
```bash
# If using Vercel
vercel --prod

# If using Netlify
netlify deploy --prod --dir=dist
```

---

## ✅ Final Verification Checklist

Before declaring ready for deployment:

### Backend
- [ ] Server starts without errors
- [ ] MongoDB connects successfully
- [ ] All API endpoints respond
- [ ] CF audit endpoint works
- [ ] CF recommendations work (or fallback correctly)
- [ ] Existing endpoints still work
- [ ] No console errors
- [ ] Environment variables set

### Frontend
- [ ] Builds successfully
- [ ] No build warnings (critical ones)
- [ ] Connects to backend API
- [ ] Login/signup works
- [ ] Recommendations display
- [ ] No console errors
- [ ] Environment variables set

### Data
- [ ] MongoDB has movies/music data
- [ ] At least one user account exists
- [ ] Some user interactions exist (for CF testing)

### Performance
- [ ] API responses < 500ms
- [ ] Frontend loads quickly
- [ ] No memory leaks

### Security
- [ ] JWT_SECRET is strong and secret
- [ ] MongoDB credentials are secure
- [ ] CORS configured correctly
- [ ] No sensitive data in logs

---

## 🚀 Quick Deployment Command

Use this automated script:

```bash
#!/bin/bash

echo "🚀 Pre-Deployment Verification"
echo "=============================="

# 1. Check backend
echo "✓ Checking backend..."
cd backend
node -c server.js || { echo "❌ Backend syntax error"; exit 1; }

# 2. Check CF service
echo "✓ Checking CF service..."
node -c services/collaborativeFilteringService.js || { echo "❌ CF service error"; exit 1; }

# 3. Install dependencies
echo "✓ Installing backend dependencies..."
npm install --silent

# 4. Check frontend
echo "✓ Checking frontend..."
cd ../project
npm install --silent

# 5. Build frontend
echo "✓ Building frontend..."
npm run build || { echo "❌ Frontend build failed"; exit 1; }

echo ""
echo "✅ All checks passed!"
echo "Ready for deployment."
echo ""
echo "Next steps:"
echo "1. Deploy backend to Railway/Render/Heroku"
echo "2. Set environment variables"
echo "3. Deploy frontend to Vercel/Netlify"
echo "4. Test production endpoints"
```

Save as `deploy-check.sh`, make executable, and run:
```bash
chmod +x deploy-check.sh
./deploy-check.sh
```

---

## 📊 Post-Deployment Monitoring

After deployment, monitor these:

### 1. **CF Success Rate**
```bash
# Check logs for CF vs fallback ratio
# Good: > 50% CF success
# Need more data: < 50% CF success
```

### 2. **Error Rates**
```bash
# Check application logs
# Target: < 1% error rate
```

### 3. **Response Times**
```bash
# Monitor API response times
# Target: p95 < 500ms
```

### 4. **User Engagement**
```bash
# Track:
# - Click-through rate on recommendations
# - Like/favorite rates
# - User retention
```

---

## 🎯 You're Ready When...

✅ All checkboxes above are checked  
✅ Backend starts without errors  
✅ CF endpoints return valid responses  
✅ Frontend builds successfully  
✅ Manual testing passes  
✅ No critical console errors  

**Then you can deploy with confidence!** 🚀

---

## 📞 Need Help?

1. **Backend won't start:** Check MongoDB connection and `.env` file
2. **CF not working:** Run audit endpoint to check data
3. **Build fails:** Check for missing dependencies
4. **Deployment fails:** Check platform-specific logs

**Refer to the CF documentation in this folder for specific issues.**
