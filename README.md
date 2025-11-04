# 🎬🎵 KOSG - Entertainment Discovery Platform

**KOSG** (King of Songs and Games) is a full-stack web application that provides personalized movie and music recommendations based on your mood and genre preferences.

## ✨ Features

- 🎭 **Mood-Based Filtering**: Select your current mood and get tailored recommendations
- 🎬 **Movie Discovery**: Browse and filter movies by genre, mood, and ratings
- 🎵 **Music Discovery**: Explore songs and artists based on your preferences
- ❤️ **Favorites System**: Save your favorite movies and songs
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices
- 🎨 **Modern UI**: Built with Tailwind CSS for a beautiful, intuitive interface

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **Lucide React** - Icons

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **CORS** - Cross-origin support
- **dotenv** - Environment management

## 📁 Project Structure

```
project-bolt-sb1-n9f8dnts-2/
├── backend/                    # Backend API
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── controllers/
│   │   ├── movieController.js
│   │   ├── musicController.js
│   │   └── favoriteController.js
│   ├── models/
│   │   ├── movieModel.js
│   │   ├── musicModel.js
│   │   └── favoriteModel.js
│   ├── routes/
│   │   ├── movieRoutes.js
│   │   ├── musicRoutes.js
│   │   └── favoriteRoutes.js
│   ├── data/
│   │   ├── movies.json
│   │   └── music.json
│   ├── server.js
│   ├── seed.js
│   └── package.json
│
└── project/                    # Frontend application
    ├── src/
    │   ├── api/
    │   │   └── api.ts         # API integration
    │   ├── components/
    │   │   ├── MoviesPage.tsx
    │   │   └── MusicPage.tsx
    │   ├── App.tsx
    │   └── main.tsx
    ├── package.json
    └── vite.config.ts
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **MongoDB** (local installation or MongoDB Atlas account)
- **npm** or **yarn**

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd project-bolt-sb1-n9f8dnts-2
```

2. **Install Backend Dependencies**
```bash
cd backend
npm install
```

3. **Install Frontend Dependencies**
```bash
cd ../project
npm install
```

### Configuration

#### Backend Configuration

1. Navigate to `backend/.env` and configure:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/kosg
# For MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/kosg
```

#### Frontend Configuration

1. Navigate to `project/.env` and configure:
```env
VITE_API_URL=http://localhost:5000
```

### Database Setup

Seed the database with sample data:

```bash
cd backend
npm run seed
```

You should see:
```
✅ 16 movies added
✅ 18 songs added
🎉 Database seeded successfully!
```

## 🏃 Running the Application

You'll need **two terminal windows** - one for backend, one for frontend.

### Terminal 1: Start Backend
```bash
cd backend
npm run dev
```

Server runs on: `http://localhost:5000`

### Terminal 2: Start Frontend
```bash
cd project
npm run dev
```

Frontend runs on: `http://localhost:5173`

## 📡 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Endpoints

#### Movies
- `GET /api/movies` - Get all movies (filterable by mood & genre)
- `GET /api/movies/:id` - Get single movie
- `POST /api/movies` - Create movie
- `PUT /api/movies/:id` - Update movie
- `DELETE /api/movies/:id` - Delete movie

#### Music
- `GET /api/music` - Get all music (filterable by mood & genre)
- `GET /api/music/:id` - Get single song
- `POST /api/music` - Create song
- `PUT /api/music/:id` - Update song
- `DELETE /api/music/:id` - Delete song

#### Favorites
- `GET /api/favorites` - Get all favorites
- `POST /api/favorites` - Add to favorites
- `DELETE /api/favorites/:id` - Remove favorite

### Example Requests

**Get movies by mood:**
```bash
curl http://localhost:5000/api/movies?mood=Happy
```

**Get music by genre:**
```bash
curl http://localhost:5000/api/music?genre=Pop
```

**Add to favorites:**
```bash
curl -X POST http://localhost:5000/api/favorites \
  -H "Content-Type: application/json" \
  -d '{"itemId":"movie_id_here","itemType":"Movie","userId":"guest"}'
```

## 🎨 Features in Detail

### Movies Page
- Filter by **mood**: Happy, Sad, Excited, Relaxed, Adventurous, Romantic
- Filter by **genre**: Action, Drama, Comedy, Sci-Fi, Thriller, Romance, Crime, Adventure
- View ratings, release year, and overview
- Add movies to favorites

### Music Page
- Filter by **mood**: Energetic, Chill, Happy, Melancholic, Focused, Party
- Filter by **genre**: Pop, Rock, Hip-Hop, Jazz, Classical, Electronic, R&B, Alternative
- View artist, album, and genre information
- Play preview (UI only)
- Add songs to favorites

### Favorites System
- Persistent storage in MongoDB
- Real-time favorite status
- Easy add/remove functionality

## 🔧 Development Scripts

### Backend
```bash
npm run dev      # Start with nodemon (auto-reload)
npm start        # Start production server
npm run seed     # Seed database
```

### Frontend
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## 🌐 Deployment

### Backend Deployment (Render/Railway)

1. Push code to GitHub
2. Connect repository to Render/Railway
3. Set environment variables:
   - `MONGO_URI`: Your MongoDB Atlas connection string
   - `PORT`: 5000 (or leave default)
   - `NODE_ENV`: production

### Frontend Deployment (Vercel/Netlify)

1. Push code to GitHub
2. Connect repository to Vercel/Netlify
3. Set environment variable:
   - `VITE_API_URL`: Your deployed backend URL
4. Build command: `npm run build`
5. Output directory: `dist`

## 🐛 Troubleshooting

**Backend won't start:**
- Check MongoDB is running: `mongod` or verify Atlas connection
- Verify `.env` file exists with correct `MONGO_URI`

**Frontend can't connect to backend:**
- Ensure backend is running on port 5000
- Check `VITE_API_URL` in frontend `.env`
- Verify CORS is enabled in backend

**No data showing:**
- Run `npm run seed` in backend directory
- Check browser console for errors
- Verify MongoDB connection in backend logs

## 📈 Future Enhancements

- [ ] User authentication with JWT
- [ ] User profiles and personalized recommendations
- [ ] Advanced search functionality
- [ ] User reviews and ratings
- [ ] Social features (share favorites)
- [ ] AI-powered recommendations
- [ ] Streaming integration
- [ ] Mobile app (React Native)

## 📄 License

ISC

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For issues and questions, please open an issue in the repository.

---

**Made with ❤️ for entertainment lovers everywhere**
# project123
