# 🚀 KOSG Quick Start - Cheat Sheet

## ⚡ Quick Commands

```bash
# ONE-LINE STARTUP (after initial setup)
./start-dev.sh

# OR MANUAL STARTUP
# Terminal 1:
cd backend && npm run dev

# Terminal 2:
cd project && npm run dev
```

## 📍 URLs
- Frontend: **http://localhost:5173**
- Backend: **http://localhost:5000**
- API Health: **http://localhost:5000/api/health**

---

## 🎯 First Time Setup (5 minutes)

```bash
# 1. Install MongoDB (choose one)
brew install mongodb-community              # macOS local
# OR use MongoDB Atlas (cloud) - Free tier available

# 2. Start MongoDB (if local)
brew services start mongodb-community

# 3. Install dependencies
cd backend && npm install
cd ../project && npm install

# 4. Configure environment
# Edit backend/.env:
MONGO_URI=mongodb://localhost:27017/kosg

# Edit project/.env:
VITE_API_URL=http://localhost:5000

# 5. Seed database
cd backend && npm run seed

# 6. Start servers
./start-dev.sh
```

---

## 🧪 Quick API Tests

```bash
# Health Check
curl http://localhost:5000/api/health

# Get all movies
curl http://localhost:5000/api/movies

# Get happy movies
curl "http://localhost:5000/api/movies?mood=Happy"

# Get action movies
curl "http://localhost:5000/api/movies?genre=Action"

# Get all music
curl http://localhost:5000/api/music

# Get chill music
curl "http://localhost:5000/api/music?mood=Chill"
```

---

## 📁 File Locations

| What | Where |
|------|-------|
| Backend code | `backend/` |
| Frontend code | `project/src/` |
| API integration | `project/src/api/api.ts` |
| Sample data | `backend/data/*.json` |
| MongoDB config | `backend/config/db.js` |
| Server entry | `backend/server.js` |
| Seed script | `backend/seed.js` |

---

## 🔧 Common Tasks

### Reset Database
```bash
cd backend
npm run seed
```

### Add New Movie (via API)
```bash
curl -X POST http://localhost:5000/api/movies \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Movie",
    "genre": ["Action"],
    "mood": ["Excited"],
    "rating": 8.5,
    "releaseYear": 2024,
    "overview": "Amazing movie"
  }'
```

### Check MongoDB (CLI)
```bash
mongosh
use kosg
db.movies.find()
db.music.find()
db.favorites.find()
```

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Can't connect to MongoDB | `brew services start mongodb-community` |
| Port 5000 in use | `lsof -ti:5000 \| xargs kill -9` |
| No data showing | Run `cd backend && npm run seed` |
| CORS errors | Backend already has CORS - restart servers |
| Axios not found | `cd project && npm install axios` |

---

## 📚 Key Files to Know

```
backend/
├── server.js          ← Express server setup
├── seed.js            ← Database seeding
├── .env               ← Backend config
├── models/
│   ├── movieModel.js  ← Movie schema
│   ├── musicModel.js  ← Music schema
│   └── favoriteModel.js
├── controllers/       ← Business logic
└── routes/            ← API endpoints

project/
├── src/
│   ├── App.tsx        ← Main component
│   ├── api/api.ts     ← API client
│   └── components/
│       ├── MoviesPage.tsx
│       └── MusicPage.tsx
└── .env               ← Frontend config
```

---

## 🎨 Available Filters

**Movie Moods:** Happy, Sad, Excited, Relaxed, Adventurous, Romantic
**Movie Genres:** Action, Drama, Comedy, Sci-Fi, Thriller, Romance, Crime, Adventure

**Music Moods:** Energetic, Chill, Happy, Melancholic, Focused, Party
**Music Genres:** Pop, Rock, Hip-Hop, Jazz, Classical, Electronic, R&B, Alternative

---

## 💡 Pro Tips

1. Use **MongoDB Compass** for visual database management
2. Use **Thunder Client** (VS Code) for API testing
3. Check **browser console** for frontend errors
4. Check **terminal** for backend errors
5. Use `npm run dev` for auto-reload during development

---

## 📖 Documentation Files

| File | Purpose |
|------|---------|
| `README.md` | Complete project overview |
| `SETUP_GUIDE.md` | Detailed setup instructions |
| `DELIVERY_SUMMARY.md` | What was delivered |
| `ARCHITECTURE.md` | System architecture diagram |
| `backend/README.md` | Backend API docs |
| `QUICKSTART.md` | This file! |

---

## 🎯 Development Checklist

- [ ] MongoDB installed/configured
- [ ] Backend dependencies installed
- [ ] Frontend dependencies installed
- [ ] Environment files configured
- [ ] Database seeded
- [ ] Backend running on port 5000
- [ ] Frontend running on port 5173
- [ ] Can view movies on frontend
- [ ] Can filter by mood/genre
- [ ] Favorites working

---

## 🚀 Deployment Checklist

- [ ] MongoDB Atlas account created
- [ ] Connection string updated in backend
- [ ] Frontend built: `npm run build`
- [ ] Backend deployed (Render/Railway)
- [ ] Frontend deployed (Vercel/Netlify)
- [ ] Environment variables set on platforms
- [ ] VITE_API_URL points to production backend
- [ ] Test all features in production

---

## 📞 Need More Help?

1. Check `SETUP_GUIDE.md` for detailed troubleshooting
2. Check `backend/README.md` for API documentation
3. Check browser console for frontend errors
4. Check terminal output for backend errors

---

**Made with ❤️ - Happy Coding! 🎉**
