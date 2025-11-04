# KOSG Backend API

Backend API for KOSG (King of Songs and Games) - A personalized entertainment discovery platform.

## 🛠️ Tech Stack

- **Node.js** + **Express.js**
- **MongoDB** + **Mongoose**
- **CORS** for cross-origin requests
- **dotenv** for environment variables

## 📦 Installation

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
   - Copy `.env.example` to `.env` (or edit `.env` directly)
   - Update `MONGO_URI` with your MongoDB connection string

## 🗄️ Database Setup

### Option 1: Local MongoDB
```bash
# Make sure MongoDB is installed and running
MONGO_URI=mongodb://localhost:27017/kosg
```

### Option 2: MongoDB Atlas (Cloud)
```bash
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/kosg?retryWrites=true&w=majority
```

## 🌱 Seed Database

Before running the server, seed the database with sample data:

```bash
npm run seed
```

This will:
- Clear existing data
- Add 16 movies
- Add 18 songs

## 🚀 Running the Server

### Development mode (with nodemon):
```bash
npm run dev
```

### Production mode:
```bash
npm start
```

The server will run on `http://localhost:5000`

## 📡 API Endpoints

### Health Check
```
GET /api/health
```

### Movies

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/movies` | Get all movies (supports query params) |
| GET | `/api/movies/:id` | Get movie by ID |
| POST | `/api/movies` | Create new movie |
| PUT | `/api/movies/:id` | Update movie |
| DELETE | `/api/movies/:id` | Delete movie |

**Query Parameters:**
- `mood`: Filter by mood (Happy, Sad, Excited, etc.)
- `genre`: Filter by genre (Action, Drama, Comedy, etc.)

**Example:**
```
GET /api/movies?mood=Happy&genre=Comedy
```

### Music

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/music` | Get all music (supports query params) |
| GET | `/api/music/:id` | Get music by ID |
| POST | `/api/music` | Create new music |
| PUT | `/api/music/:id` | Update music |
| DELETE | `/api/music/:id` | Delete music |

**Query Parameters:**
- `mood`: Filter by mood (Energetic, Chill, Happy, etc.)
- `genre`: Filter by genre (Pop, Rock, Hip-Hop, etc.)

**Example:**
```
GET /api/music?mood=Energetic&genre=Pop
```

### Favorites

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/favorites` | Get all favorites for user |
| POST | `/api/favorites` | Add to favorites |
| DELETE | `/api/favorites/:id` | Remove favorite by ID |
| DELETE | `/api/favorites/item/:itemId` | Remove favorite by itemId |

**Request Body (POST):**
```json
{
  "itemId": "movie_or_song_id",
  "itemType": "Movie" or "Music",
  "userId": "guest"
}
```

## 🗂️ Project Structure

```
backend/
├── config/
│   └── db.js              # MongoDB connection
├── controllers/
│   ├── movieController.js  # Movie business logic
│   ├── musicController.js  # Music business logic
│   └── favoriteController.js # Favorites business logic
├── models/
│   ├── movieModel.js       # Movie schema
│   ├── musicModel.js       # Music schema
│   └── favoriteModel.js    # Favorite schema
├── routes/
│   ├── movieRoutes.js      # Movie endpoints
│   ├── musicRoutes.js      # Music endpoints
│   └── favoriteRoutes.js   # Favorite endpoints
├── data/
│   ├── movies.json         # Sample movie data
│   └── music.json          # Sample music data
├── server.js               # Express server setup
├── seed.js                 # Database seeding script
├── package.json
└── .env                    # Environment variables
```

## 🔧 Environment Variables

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/kosg
NODE_ENV=development
```

## 📝 Notes

- Default user is `guest` for favorites functionality
- Authentication can be added later for multi-user support
- All endpoints return JSON responses
- CORS is enabled for frontend integration

## 🐛 Troubleshooting

**MongoDB Connection Error:**
- Ensure MongoDB is running locally, or
- Verify MongoDB Atlas connection string is correct

**Port Already in Use:**
- Change `PORT` in `.env` file
- Kill the process using port 5000

## 🚀 Next Steps

- Add user authentication with JWT
- Implement user profiles
- Add more filtering options
- Implement pagination
- Add rate limiting
- Deploy to production (Render, Railway, etc.)
