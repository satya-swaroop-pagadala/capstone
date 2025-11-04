# 🎉 KOSG Backend Integration - Complete Setup Guide

## ✅ What Has Been Created

### Backend Structure (`/backend`)
```
backend/
├── config/
│   └── db.js                   ✅ MongoDB connection configuration
├── controllers/
│   ├── movieController.js      ✅ Movie CRUD operations
│   ├── musicController.js      ✅ Music CRUD operations
│   └── favoriteController.js   ✅ Favorites management
├── models/
│   ├── movieModel.js           ✅ Movie schema with indexing
│   ├── musicModel.js           ✅ Music schema with indexing
│   └── favoriteModel.js        ✅ Favorites schema
├── routes/
│   ├── movieRoutes.js          ✅ Movie API endpoints
│   ├── musicRoutes.js          ✅ Music API endpoints
│   └── favoriteRoutes.js       ✅ Favorites API endpoints
├── data/
│   ├── movies.json             ✅ 16 sample movies
│   └── music.json              ✅ 18 sample songs
├── server.js                   ✅ Express server with CORS
├── seed.js                     ✅ Database seeding script
├── package.json                ✅ Dependencies configured
├── .env                        ✅ Environment variables
├── .gitignore                  ✅ Git ignore file
└── README.md                   ✅ Backend documentation
```

### Frontend Integration (`/project/src/api`)
```
project/src/api/
└── api.ts                      ✅ Complete API integration with TypeScript
```

### Configuration Files
- ✅ `backend/.env` - Backend configuration
- ✅ `project/.env` - Frontend API URL
- ✅ Root `package.json` - Convenient scripts
- ✅ Root `README.md` - Complete project documentation

### Dependencies Installed
- ✅ Backend: express, mongoose, cors, dotenv, nodemon
- ✅ Frontend: axios

## 🚀 Quick Start Guide

### Step 1: Install MongoDB

#### Option A: Local MongoDB
```bash
# macOS (using Homebrew)
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community

# Verify it's running
mongosh
```

#### Option B: MongoDB Atlas (Cloud - Recommended)
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create a cluster
4. Get connection string
5. Update `backend/.env` with your connection string:
```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/kosg?retryWrites=true&w=majority
```

### Step 2: Seed the Database

```bash
cd backend
npm run seed
```

Expected output:
```
✅ MongoDB Connected: ...
🗑️  Clearing existing data...
✅ Existing data cleared
📦 Seeding movies...
✅ 16 movies added
🎵 Seeding music...
✅ 18 songs added

🎉 Database seeded successfully!
```

### Step 3: Start the Backend

```bash
# From backend directory
npm run dev
```

Expected output:
```
🚀 Server running on http://localhost:5000
📊 Environment: development
✅ MongoDB Connected: ...
```

### Step 4: Start the Frontend

Open a new terminal:

```bash
cd project
npm run dev
```

Expected output:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Step 5: Test the Application

1. Open browser to `http://localhost:5173`
2. You should see the KOSG homepage
3. Click "Movies" to see movies from MongoDB
4. Click "Music" to see songs from MongoDB
5. Try filtering by mood and genre
6. Add items to favorites

## 🧪 Testing the API

### Test with curl:

```bash
# Health check
curl http://localhost:5000/api/health

# Get all movies
curl http://localhost:5000/api/movies

# Get movies by mood
curl http://localhost:5000/api/movies?mood=Happy

# Get movies by genre
curl http://localhost:5000/api/movies?genre=Action

# Get all music
curl http://localhost:5000/api/music

# Get music by mood and genre
curl "http://localhost:5000/api/music?mood=Energetic&genre=Pop"
```

### Test with browser:

Open these URLs in your browser:
- http://localhost:5000 - API info
- http://localhost:5000/api/health - Health check
- http://localhost:5000/api/movies - All movies
- http://localhost:5000/api/music - All music

## 📊 API Endpoints Reference

### Movies API
| Method | Endpoint | Description | Query Params |
|--------|----------|-------------|--------------|
| GET | `/api/movies` | Get all movies | `?mood=Happy&genre=Action` |
| GET | `/api/movies/:id` | Get single movie | - |
| POST | `/api/movies` | Create movie | Body: JSON |
| PUT | `/api/movies/:id` | Update movie | Body: JSON |
| DELETE | `/api/movies/:id` | Delete movie | - |

### Music API
| Method | Endpoint | Description | Query Params |
|--------|----------|-------------|--------------|
| GET | `/api/music` | Get all music | `?mood=Chill&genre=Jazz` |
| GET | `/api/music/:id` | Get single song | - |
| POST | `/api/music` | Create song | Body: JSON |
| PUT | `/api/music/:id` | Update song | Body: JSON |
| DELETE | `/api/music/:id` | Delete song | - |

### Favorites API
| Method | Endpoint | Description | Body |
|--------|----------|-------------|------|
| GET | `/api/favorites` | Get favorites | Query: `?userId=guest` |
| POST | `/api/favorites` | Add favorite | `{itemId, itemType, userId}` |
| DELETE | `/api/favorites/:id` | Remove by ID | - |
| DELETE | `/api/favorites/item/:itemId` | Remove by item | Query: `?itemType=Movie&userId=guest` |

## 🎭 Available Filters

### Movie Moods
- Happy
- Sad
- Excited
- Relaxed
- Adventurous
- Romantic

### Movie Genres
- Action
- Drama
- Comedy
- Sci-Fi
- Thriller
- Romance
- Crime
- Adventure

### Music Moods
- Energetic
- Chill
- Happy
- Melancholic
- Focused
- Party

### Music Genres
- Pop
- Rock
- Hip-Hop
- Jazz
- Classical
- Electronic
- R&B
- Alternative

## 🔧 Convenient npm Scripts

From the **root directory**:

```bash
# Install all dependencies (root, backend, frontend)
npm run install-all

# Seed database
npm run seed

# Run backend in development
npm run dev:backend

# Run frontend in development
npm run dev:frontend

# Start backend in production
npm run start:backend

# Build frontend for production
npm run build:frontend
```

## 📁 Data Models

### Movie Schema
```javascript
{
  title: String,           // Required
  genre: [String],         // Array of genres
  mood: [String],          // Array of moods
  overview: String,        // Description
  releaseYear: Number,     // Year
  posterUrl: String,       // Image URL
  rating: Number,          // 0-10
  createdAt: Date,         // Auto
  updatedAt: Date          // Auto
}
```

### Music Schema
```javascript
{
  title: String,           // Required
  artist: String,          // Required
  genre: [String],         // Array of genres
  mood: [String],          // Array of moods
  album: String,           // Album name
  coverUrl: String,        // Image URL
  duration: String,        // e.g., "3:45"
  createdAt: Date,         // Auto
  updatedAt: Date          // Auto
}
```

### Favorite Schema
```javascript
{
  userId: String,          // Default: "guest"
  itemId: ObjectId,        // Reference to Movie or Music
  itemType: String,        // "Movie" or "Music"
  createdAt: Date,         // Auto
  updatedAt: Date          // Auto
}
```

## 🐛 Common Issues & Solutions

### Issue: "Cannot connect to MongoDB"
**Solution:**
- If using local MongoDB, ensure it's running: `brew services start mongodb-community`
- If using MongoDB Atlas, verify connection string in `backend/.env`
- Check firewall and network settings

### Issue: "Port 5000 already in use"
**Solution:**
```bash
# Find and kill process using port 5000
lsof -ti:5000 | xargs kill -9

# Or change port in backend/.env
PORT=5001
```

### Issue: "axios is not defined" in frontend
**Solution:**
```bash
cd project
npm install axios
```

### Issue: "No data showing on frontend"
**Solution:**
1. Verify backend is running: `http://localhost:5000/api/health`
2. Check browser console for errors
3. Verify `VITE_API_URL` in `project/.env`
4. Re-seed database: `cd backend && npm run seed`

### Issue: "CORS errors"
**Solution:**
- Backend already has CORS enabled
- Clear browser cache
- Restart both servers

## 🎯 Next Steps

### Immediate Tasks
- [ ] Start MongoDB
- [ ] Seed database
- [ ] Start backend server
- [ ] Start frontend server
- [ ] Test the application

### Future Enhancements
- [ ] Add user authentication (JWT)
- [ ] Implement user registration/login
- [ ] Add user profiles
- [ ] Implement pagination
- [ ] Add search functionality
- [ ] Deploy to production

## 📚 Additional Resources

### Documentation
- [Express.js Docs](https://expressjs.com/)
- [Mongoose Docs](https://mongoosejs.com/)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [React Docs](https://react.dev/)
- [Vite Docs](https://vitejs.dev/)
- [Axios Docs](https://axios-http.com/)

### Deployment Guides
- **Backend**: Render, Railway, Heroku
- **Frontend**: Vercel, Netlify
- **Database**: MongoDB Atlas (already cloud-based)

## 💡 Pro Tips

1. **Use MongoDB Compass** for visual database management
2. **Install Thunder Client** or **Postman** for API testing
3. **Enable nodemon** for auto-restart during development (already configured)
4. **Use environment variables** for sensitive data
5. **Keep data seeding script** for easy database reset

## ✨ What Makes This Setup Great

- ✅ Full TypeScript support in frontend
- ✅ RESTful API design
- ✅ Proper separation of concerns (MVC pattern)
- ✅ Environment-based configuration
- ✅ Sample data included
- ✅ Easy database seeding
- ✅ CORS enabled
- ✅ Error handling
- ✅ Mongoose indexing for performance
- ✅ Clean code structure
- ✅ Comprehensive documentation

## 🎊 You're All Set!

Your KOSG platform is now fully integrated with MongoDB backend!

Run these commands to get started:
```bash
# Terminal 1 - Backend
cd backend
npm run seed
npm run dev

# Terminal 2 - Frontend
cd project
npm run dev
```

Then open: **http://localhost:5173**

Enjoy building! 🚀
