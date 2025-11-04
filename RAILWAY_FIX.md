# 🔧 Railway Deployment Fix - "Cannot find module '/app/index.js'"

## 🐛 The Problem

Railway is trying to run `/app/index.js` but your backend uses `server.js`. This happens because Railway auto-detects the project structure incorrectly when using docker-compose with multiple services.

---

## ✅ Solution: Deploy Services Separately

Instead of using docker-compose (which Railway doesn't fully support for multi-service apps), deploy each service separately.

---

## 🚀 Step-by-Step Fix

### Step 1: Delete the Current Deployment

1. In Railway dashboard, click on your **project123** project
2. Click the **Settings** tab (gear icon)
3. Scroll down and click **Delete Service** for each crashed service
4. Or just delete the entire project and start fresh

---

### Step 2: Deploy Backend First

1. Go to Railway dashboard: https://railway.app/dashboard
2. Click **New Project**
3. Select **Deploy from GitHub repo**
4. Search for `project123`
5. Click `DHANUSH555dh/project123`

**IMPORTANT:** Railway will ask "Which service?"
- **Select:** `backend` folder (or configure root path)

#### Configure Backend:

**Method A: Set Root Directory (Recommended)**
1. After deployment starts, click the backend service
2. Go to **Settings**
3. Find **Root Directory**
4. Set it to: `backend`
5. Click **Redeploy**

**Method B: Use Custom Start Command**
1. Go to service **Settings**
2. Find **Custom Start Command**
3. Enter: `cd backend && npm start`
4. Click **Redeploy**

#### Set Backend Environment Variables:
1. Click **Variables** tab
2. Add these:
```
NODE_ENV=production
PORT=5001
MONGODB_URI=<Your MongoDB URI>
```

For MongoDB URI, you can either:
- Add MongoDB from Railway (click "New" → "Database" → "MongoDB")
- Use MongoDB Atlas (free tier): https://www.mongodb.com/cloud/atlas

#### Generate Backend Domain:
1. Go to **Settings**
2. Scroll to **Networking**
3. Click **Generate Domain**
4. Copy the URL (e.g., `https://backend-production-xxxx.up.railway.app`)

---

### Step 3: Deploy Frontend

1. In same Railway project, click **New Service**
2. Select **GitHub Repo**
3. Select `project123` again
4. Configure:

**Set Root Directory:**
1. Go to Settings
2. Set **Root Directory** to: `project`
3. Set **Build Command** to: `npm install && npm run build`
4. Set **Start Command** to: `npm run preview` (or use nginx from Dockerfile)

**Or use Dockerfile:**
1. Set **Root Directory** to: `project`
2. Railway will auto-detect the Dockerfile

#### Set Frontend Environment Variables:
1. Click **Variables** tab
2. Add:
```
VITE_API_URL=https://<your-backend-domain>.up.railway.app
```
(Use the backend URL from Step 2)

#### Generate Frontend Domain:
1. Go to **Settings**
2. Scroll to **Networking**  
3. Click **Generate Domain**
4. This is your public website URL!

---

### Step 4: Update Backend CORS

1. Go back to **backend** service
2. Click **Variables**
3. Update or add:
```
CORS_ORIGIN=https://<your-frontend-domain>.up.railway.app
```

4. Click **Redeploy**

---

### Step 5: Add MongoDB

**Option A: Railway MongoDB Plugin**
1. In your project, click **New**
2. Select **Database** → **MongoDB**
3. Railway creates a MongoDB instance
4. Copy the **MONGO_URL** from Variables
5. Go to **backend** service
6. Update `MONGODB_URI` with the Railway MongoDB URL

**Option B: MongoDB Atlas (Recommended for Free)**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create cluster (M0 Free tier)
4. Create database user
5. Get connection string
6. Update backend `MONGODB_URI` with Atlas connection string

---

## 🎯 Alternative: Simpler Deployment Without Docker

If you keep having issues, deploy without Docker:

### Backend on Railway:
1. New Project → GitHub Repo → project123
2. Set **Root Directory**: `backend`
3. Railway auto-detects Node.js
4. Set environment variables
5. Deploy ✅

### Frontend on Vercel (Easier for React):
1. Go to https://vercel.com
2. Import project123 from GitHub
3. Set **Root Directory**: `project`
4. Set environment variable: `VITE_API_URL=<railway-backend-url>`
5. Deploy ✅

---

## 📋 Quick Reference

### Backend Configuration:
```
Root Directory: backend
Build Command: npm install
Start Command: npm start
Port: 5001
```

### Frontend Configuration:
```
Root Directory: project  
Build Command: npm install && npm run build
Start Command: npm run preview (or use Dockerfile)
Port: 3000 (or 80 with nginx)
```

### Environment Variables:

**Backend:**
```env
NODE_ENV=production
PORT=5001
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/kosg
CORS_ORIGIN=https://your-frontend.up.railway.app
```

**Frontend:**
```env
VITE_API_URL=https://your-backend.up.railway.app
```

---

## 🐛 Why This Happened

Railway's Nixpacks builder tries to auto-detect the project structure. When it sees a root-level `docker-compose.yml` with multiple services, it gets confused about which service to deploy. It defaults to looking for `index.js` in `/app`, which doesn't exist.

**Solutions:**
1. ✅ Deploy each service separately with Root Directory set
2. ✅ Use custom start commands
3. ✅ Remove docker-compose.yml from root (but you need it for local dev)
4. ✅ Use Railway's multi-service deployment (manual configuration)

---

## 🚀 Recommended Approach

**Best Option: Deploy Each Service Separately**

1. **Backend on Railway:**
   - Root Directory: `backend`
   - Auto-detects Node.js
   - Easy to configure

2. **Frontend on Railway or Vercel:**
   - Root Directory: `project`
   - Auto-detects React/Vite
   - Easy to configure

3. **MongoDB on Atlas (Free):**
   - No management needed
   - 512MB free storage
   - Better than Railway's MongoDB for small projects

This approach avoids Docker complexity and works perfectly!

---

## ✅ Next Steps

1. Delete current crashed deployment
2. Redeploy backend with Root Directory = `backend`
3. Redeploy frontend with Root Directory = `project`
4. Set environment variables
5. Generate domains
6. Test your live site!

**Your app will be live in ~5 minutes!** 🎉

---

Need help? Check the Railway docs: https://docs.railway.app
