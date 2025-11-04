# 🚂 Deploy to Railway - Step by Step Guide

## What is Railway?

Railway is the **easiest way** to deploy full-stack applications with databases. It's perfect for your project!

**Why Railway?**
- ✅ **Free tier**: $5 credit per month (enough for small projects)
- ✅ **MongoDB included**: No separate database setup needed
- ✅ **Auto-deploy**: Pushes to GitHub automatically redeploy
- ✅ **Simple setup**: 5 minutes to deploy
- ✅ **No Docker needed**: Railway handles everything

---

## 🎯 Quick Deploy (What You're Doing Now)

I can see you're already on the Railway deployment page! Here's what to do:

### Step 1: Select Your Repository
In the search box that says "What would you like to deploy today?", type:
```
project123
```

You should see: **DHANUSH555dh/project123**

Click on it to select it.

---

### Step 2: Configure Services

Railway will detect your `docker-compose.yml` and create 3 services:
1. **MongoDB** - Your database
2. **Backend** - Your Node.js API
3. **Frontend** - Your React app

**Click "Deploy"**

---

### Step 3: Wait for Initial Deployment

Railway will start building your project. This takes about 2-3 minutes.

You'll see build logs like:
- ✅ Pulling Docker images
- ✅ Building backend
- ✅ Building frontend
- ✅ Deploying services

---

### Step 4: Configure Environment Variables

After the initial deployment, you need to set some environment variables.

#### For Backend Service:

1. Click on the **backend** service
2. Click **Variables** tab
3. Add these variables:

```env
NODE_ENV=production
PORT=5001
MONGODB_URI=${{MongoDB.MONGO_URL}}
CORS_ORIGIN=${{frontend.RAILWAY_PUBLIC_DOMAIN}}
```

**Note:** Railway auto-fills `${{MongoDB.MONGO_URL}}` and `${{frontend.RAILWAY_PUBLIC_DOMAIN}}`

#### For Frontend Service:

1. Click on the **frontend** service
2. Click **Variables** tab
3. Add this variable:

```env
VITE_API_URL=https://${{backend.RAILWAY_PUBLIC_DOMAIN}}
```

---

### Step 5: Generate Public Domains

Both frontend and backend need public URLs.

#### Generate Frontend URL:
1. Click **frontend** service
2. Go to **Settings** tab
3. Scroll to **Networking**
4. Click **Generate Domain**
5. You'll get: `https://[random-name].up.railway.app`

#### Generate Backend URL:
1. Click **backend** service
2. Go to **Settings** tab
3. Scroll to **Networking**
4. Click **Generate Domain**
5. You'll get: `https://[random-name].up.railway.app`

---

### Step 6: Redeploy with Correct URLs

After setting environment variables and generating domains:

1. Go to **Deployments** tab for each service
2. Click the three dots (•••)
3. Click **Redeploy**

Do this for both backend and frontend.

---

### Step 7: Access Your Live Website! 🎉

After redeployment completes (1-2 minutes):

Visit your **frontend URL**: `https://[your-frontend].up.railway.app`

You should see your Cine-Tune List app running live!

**Test:**
- ✅ Movies load
- ✅ Filters work (mood, genre)
- ✅ Pagination works
- ✅ Trending button works
- ✅ Music page loads songs

---

## 🔧 Project Configuration (Already Done)

Your project is already configured for Railway with:

### 1. docker-compose.yml
Located at: `/docker-compose.yml`

Defines 3 services:
- **mongodb**: Port 27017 (internal)
- **backend**: Port 5001 (Node.js + Express)
- **frontend**: Port 3000 (React + nginx)

### 2. Backend Dockerfile
Located at: `/backend/Dockerfile`

- Uses Node 18 Alpine
- Installs dependencies
- Runs on port 5001

### 3. Frontend Dockerfile  
Located at: `/project/Dockerfile`

- Builds React with Vite
- Serves with nginx
- Handles SPA routing

### 4. nginx Configuration
Located at: `/project/nginx.conf`

- Routes all requests to index.html (SPA)
- Enables gzip compression
- Caches static assets

---

## 📊 Service Architecture

```
┌────────────────────────────────────────────┐
│          Railway Platform                  │
├────────────────────────────────────────────┤
│                                            │
│  ┌──────────────────────────────────┐     │
│  │   Frontend Service (Public)      │     │
│  │   https://[name].up.railway.app  │     │
│  │   - React + Vite                 │     │
│  │   - nginx                        │     │
│  │   - Port 3000 → 443              │     │
│  └──────────┬───────────────────────┘     │
│             │                              │
│             │ API Calls                    │
│             │                              │
│  ┌──────────▼───────────────────────┐     │
│  │   Backend Service (Public)       │     │
│  │   https://[name].up.railway.app  │     │
│  │   - Node.js + Express            │     │
│  │   - Port 5001 → 443              │     │
│  └──────────┬───────────────────────┘     │
│             │                              │
│             │ MongoDB Connection           │
│             │                              │
│  ┌──────────▼───────────────────────┐     │
│  │   MongoDB Service (Private)      │     │
│  │   Internal URL only              │     │
│  │   - Port 27017                   │     │
│  │   - 9,826 movies                 │     │
│  │   - 113,999 songs                │     │
│  └──────────────────────────────────┘     │
│                                            │
└────────────────────────────────────────────┘
```

---

## 🔐 Environment Variables Reference

### MongoDB Service
Railway auto-creates:
- `MONGO_URL` - Connection string
- `MONGO_HOST` - Host address
- `MONGO_PORT` - Port (27017)

### Backend Service
You need to set:
```env
NODE_ENV=production
PORT=5001
MONGODB_URI=${{MongoDB.MONGO_URL}}
CORS_ORIGIN=https://${{frontend.RAILWAY_PUBLIC_DOMAIN}}
```

### Frontend Service
You need to set:
```env
VITE_API_URL=https://${{backend.RAILWAY_PUBLIC_DOMAIN}}
```

---

## 🐛 Troubleshooting

### "Service failed to start"
- Check **Logs** tab in Railway
- Look for error messages
- Common issue: Missing environment variables

### "Cannot connect to database"
- Verify `MONGODB_URI` is set correctly
- Check MongoDB service is running (green checkmark)

### "API calls failing from frontend"
- Verify `VITE_API_URL` points to backend domain
- Check `CORS_ORIGIN` in backend includes frontend domain
- Look at browser console for CORS errors

### "Frontend shows blank page"
- Check browser console for errors
- Verify frontend deployed successfully
- Check nginx logs in Railway

### "Changes not appearing"
- Railway auto-deploys on GitHub push
- Or manually redeploy from Railway dashboard
- Clear browser cache: Cmd+Shift+R (Mac)

---

## 🚀 Auto-Deploy from GitHub

Railway automatically deploys when you push to GitHub!

```bash
# Make changes to your code
git add .
git commit -m "Updated feature X"
git push origin main

# Railway automatically:
# 1. Detects the push
# 2. Pulls latest code
# 3. Rebuilds Docker images
# 4. Redeploys services
# 5. Your site updates in ~2 minutes!
```

---

## 💰 Pricing

**Free Tier:**
- $5 credit per month
- ~500 hours of execution time
- Perfect for development/small projects

**If you exceed free tier:**
- Pay-as-you-go: ~$0.000231/GB-hour
- Estimated: $5-20/month for active projects

**Tip:** Railway shows usage in dashboard

---

## 📝 Quick Reference Commands

```bash
# View your services
# Go to: https://railway.app/dashboard

# Check logs
# Click service → Logs tab

# Redeploy
# Click service → Deployments → ••• → Redeploy

# Add environment variable
# Click service → Variables → New Variable

# Generate domain
# Click service → Settings → Generate Domain
```

---

## ✅ What's Included in Your Project

Your repository already has everything Railway needs:

- ✅ `docker-compose.yml` - Service orchestration
- ✅ `backend/Dockerfile` - Backend image
- ✅ `project/Dockerfile` - Frontend image
- ✅ `project/nginx.conf` - Web server config
- ✅ MongoDB models and seed data
- ✅ 9,826 TMDB movies
- ✅ 113,999 Spotify songs
- ✅ Mood/genre/artist filtering
- ✅ Pagination
- ✅ Trending movies feature

---

## 🎉 You're Almost Done!

**Current Status:** You're on the Railway deployment page

**Next Steps:**
1. Search for "project123" in the repository search
2. Click on `DHANUSH555dh/project123`
3. Click "Deploy"
4. Wait 2-3 minutes
5. Configure environment variables (see Step 4 above)
6. Generate domains (see Step 5 above)
7. Redeploy services
8. Visit your live site!

**Estimated Time:** 5-10 minutes total

---

## 📞 Need Help?

If you get stuck:
1. Check Railway's build logs (click service → Logs)
2. Verify all environment variables are set
3. Make sure both services have generated domains
4. Try redeploying after making changes

**Your app is ready to deploy - Railway handles everything!** 🚂

---

## 🌟 After Deployment

Your app will be live at:
- **Frontend:** `https://[your-name].up.railway.app`
- **Backend:** `https://[backend-name].up.railway.app/api/health`

Share your frontend URL with anyone - they can use your app!

**Features they can enjoy:**
- Browse 9,826+ movies with real TMDB posters
- Filter by 21 moods (Happy, Sad, Romantic, etc.)
- Filter by 19 genres
- See trending movies worldwide
- Browse 113,999+ songs
- Filter by artist, genre
- Pagination through all content

**You did it! 🎉**
