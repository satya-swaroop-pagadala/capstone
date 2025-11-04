# 🚀 How to Run Your KOSG Application

## ✅ All Sample Data Has Been Removed!

Your application now uses **real data** from:
- **9,826 TMDB Movies** with mood-based filtering
- **113,999 Spotify Songs** with artist search
- **21 Moods** and **19 Genres** for movies
- **17,648 Artists** for music

---

## 📋 Quick Start Instructions

### **Method 1: Using the Startup Script (Recommended)**

1. Open **Terminal** (not VS Code terminal)
2. Run:
```bash
cd "/Users/dhanushg/Desktop/project-bolt-sb1-n9f8dnts 2"
./start-all.sh
```

This will automatically start both backend and frontend servers.

---

### **Method 2: Manual Start (Best for Debugging)**

#### **Terminal Window 1 - Start Backend:**

```bash
cd "/Users/dhanushg/Desktop/project-bolt-sb1-n9f8dnts 2/backend"
npm start
```

**✅ Wait for these messages:**
```
🚀 Server running on http://localhost:5001
📊 Environment: development
✅ MongoDB connected successfully
📦 Database: kosg
```

**⚠️ IMPORTANT:** Keep this terminal window open! Don't close it.

---

#### **Terminal Window 2 - Start Frontend:**

Open a **NEW** terminal window and run:

```bash
cd "/Users/dhanushg/Desktop/project-bolt-sb1-n9f8dnts 2/project"
npm run dev
```

**✅ Wait for these messages:**
```
VITE v5.4.21 ready in XXX ms
➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

**⚠️ IMPORTANT:** Keep this terminal window open too!

---

#### **Terminal Window 3 - Test the Backend (Optional):**

Open a **THIRD** terminal to test:

```bash
# Test if backend is running
curl "http://localhost:5001/api/health"

# Get all moods
curl "http://localhost:5001/api/movies/moods"

# Get sample movies
curl "http://localhost:5001/api/movies?limit=3"

# Get music by artist
curl "http://localhost:5001/api/music?artist=Beatles&limit=3"
```

---

## 🌐 Open Your Application

Once both servers are running, open your browser and go to:

### **http://localhost:5173/**

You should see:
- ✨ Real TMDB movie posters and information
- 🎵 Real Spotify music data
- 🎭 Filter movies by 21 different moods (Excited, Romantic, Adventurous, etc.)
- 🎸 Search music by artist

---

## 🐛 Troubleshooting

### **Problem: "Port already in use" error**

Run this command to clear the ports:
```bash
lsof -ti:5001 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null
```

Then restart the servers.

---

### **Problem: Backend shows "Failed to connect to server"**

1. Make sure Terminal Window 1 (backend) is still running
2. Check if you see the "✅ MongoDB connected successfully" message
3. Try accessing: http://localhost:5001/api/health in your browser

---

### **Problem: Frontend shows empty page or "No movies found"**

1. Check browser console (F12 → Console tab) for errors
2. Make sure backend is running (check Terminal Window 1)
3. Verify API is working:
   ```bash
   curl "http://localhost:5001/api/movies/moods"
   ```
   Should return JSON with moods data

---

### **Problem: Movies/Music not loading**

1. **Open Browser DevTools** (Press F12)
2. Go to **Network** tab
3. Reload the page
4. Look for API requests to `/api/movies` or `/api/music`
5. Check if they return data or show errors

---

## 📊 What Data You Should See

### **Movies Page:**
- Top movies like "Spider-Man: No Way Home", "The Batman", "Encanto"
- Filters: Happy, Sad, Excited, Relaxed, Adventurous, Romantic, etc.
- Genres: Action, Drama, Comedy, Sci-Fi, Horror, etc.
- Real TMDB poster images

### **Music Page:**
- Top artists available for search
- Genres: Pop, Rock, Hip-Hop, Jazz, Electronic, etc.
- Real Spotify track data with artists and albums

---

## 🔧 What Was Changed

### **Backend:**
- ✅ Fixed routes: `/api/movies/moods` and `/api/movies/genres`
- ✅ All 9,826 movies seeded in MongoDB
- ✅ All 113,999 songs seeded in MongoDB

### **Frontend:**
- ✅ Removed `SAMPLE_MOVIES` array (6 fake movies)
- ✅ Removed `SAMPLE_MUSIC` array (8 fake songs)
- ✅ Connected to real API endpoints
- ✅ Updated interfaces to use `_id` instead of `id`
- ✅ Added loading states
- ✅ Fetch real moods, genres, and artists from backend

---

## 📝 API Endpoints Available

### **Movies:**
- `GET /api/movies` - Get all movies (with pagination)
- `GET /api/movies/moods` - Get all available moods
- `GET /api/movies/genres` - Get all available genres
- `GET /api/movies?mood=Excited` - Filter by mood
- `GET /api/movies?genre=Action` - Filter by genre

### **Music:**
- `GET /api/music` - Get all music (with pagination)
- `GET /api/music/artists/all` - Get all artists
- `GET /api/music?artist=Beatles` - Search by artist
- `GET /api/music?genre=Rock` - Filter by genre

---

## 🎉 Enjoy Your Application!

Your KOSG app now has:
- 🎬 Real TMDB movie data with beautiful posters
- 🎵 Real Spotify music catalog
- 🎭 Mood-based movie recommendations
- 🎸 Artist-based music search
- 📊 100% real data, no samples!

**Start URL:** http://localhost:5173/

---

## 💡 Tips

1. **Always start backend BEFORE frontend**
2. **Keep terminal windows open** while using the app
3. **Check terminal output** if something doesn't work
4. **Use browser DevTools** (F12) to debug frontend issues

---

Need help? Check the terminal outputs for error messages!
