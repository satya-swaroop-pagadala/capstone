# 🏗️ KOSG System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         KOSG PLATFORM                                 │
│              Entertainment Discovery Application                      │
└─────────────────────────────────────────────────────────────────────┘

                              USER
                                │
                                │ HTTP
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      FRONTEND (React + Vite)                          │
│                      http://localhost:5173                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │   App.tsx   │  │ MoviesPage  │  │  MusicPage  │                 │
│  │  (Router)   │  │   .tsx      │  │    .tsx     │                 │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                 │
│         │                │                │                          │
│         └────────────────┴────────────────┘                          │
│                          │                                            │
│                          ▼                                            │
│              ┌──────────────────────┐                                │
│              │    api/api.ts        │                                │
│              │  (Axios Client)      │                                │
│              └──────────┬───────────┘                                │
│                         │                                             │
│  Dependencies:                                                        │
│  • React 18                                                           │
│  • TypeScript                                                         │
│  • Tailwind CSS                                                       │
│  • Axios                                                              │
│  • Lucide Icons                                                       │
└─────────────────────────┼─────────────────────────────────────────────┘
                          │
                          │ REST API
                          │ JSON
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    BACKEND (Express.js)                               │
│                    http://localhost:5000                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│                      server.js (Entry Point)                          │
│                              │                                        │
│              ┌───────────────┼───────────────┐                       │
│              │               │               │                       │
│              ▼               ▼               ▼                       │
│    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │
│    │   ROUTES    │  │   ROUTES    │  │   ROUTES    │               │
│    │   Movies    │  │   Music     │  │  Favorites  │               │
│    └──────┬──────┘  └──────┬──────┘  └──────┬──────┘               │
│           │                │                │                        │
│           ▼                ▼                ▼                        │
│    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │
│    │ CONTROLLERS │  │ CONTROLLERS │  │ CONTROLLERS │               │
│    │   Movies    │  │   Music     │  │  Favorites  │               │
│    └──────┬──────┘  └──────┬──────┘  └──────┬──────┘               │
│           │                │                │                        │
│           ▼                ▼                ▼                        │
│    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │
│    │   MODELS    │  │   MODELS    │  │   MODELS    │               │
│    │   Movies    │  │   Music     │  │  Favorites  │               │
│    └──────┬──────┘  └──────┬──────┘  └──────┬──────┘               │
│           │                │                │                        │
│           └────────────────┴────────────────┘                        │
│                            │                                          │
│                            ▼                                          │
│                   ┌─────────────────┐                                │
│                   │  config/db.js   │                                │
│                   │  (Mongoose)     │                                │
│                   └────────┬────────┘                                │
│                                                                       │
│  Dependencies:                                                        │
│  • Express                                                            │
│  • Mongoose                                                           │
│  • CORS                                                               │
│  • dotenv                                                             │
└─────────────────────────┼───────────────────────────────────────────┘
                          │
                          │ MongoDB Protocol
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      DATABASE (MongoDB)                               │
│             mongodb://localhost:27017/kosg                            │
│                    (or MongoDB Atlas)                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  Collection  │  │  Collection  │  │  Collection  │              │
│  │   movies     │  │    music     │  │  favorites   │              │
│  │              │  │              │  │              │              │
│  │  16 docs     │  │  18 docs     │  │  (dynamic)   │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│                                                                       │
│  Indexes:                                                             │
│  • genre (movies, music)                                              │
│  • mood (movies, music)                                               │
│  • userId + itemId + itemType (favorites)                            │
└─────────────────────────────────────────────────────────────────────┘


                        DATA FLOW EXAMPLE
                        ─────────────────

    User clicks "Filter by Happy mood"
                  │
                  ▼
    MoviesPage.tsx detects selection
                  │
                  ▼
    Calls: fetchMovies(mood='Happy')
                  │
                  ▼
    api.ts makes GET request
                  │
                  ▼
    axios.get('/api/movies?mood=Happy')
                  │
                  ▼
    Express Router receives request
                  │
                  ▼
    movieController.getMovies()
                  │
                  ▼
    Movie.find({ mood: { $in: ['Happy'] } })
                  │
                  ▼
    MongoDB queries movies collection
                  │
                  ▼
    Returns matching documents
                  │
                  ▼
    Controller sends JSON response
                  │
                  ▼
    api.ts receives data
                  │
                  ▼
    MoviesPage updates state
                  │
                  ▼
    React re-renders with filtered movies
                  │
                  ▼
    User sees filtered results


                    TECHNOLOGY STACK
                    ────────────────

Frontend Layer:
├── React 18.3.1          (UI Library)
├── TypeScript 5.5.3      (Type Safety)
├── Vite 5.4.2            (Build Tool)
├── Tailwind CSS 3.4.18   (Styling)
├── Axios (latest)        (HTTP Client)
└── Lucide React 0.344.0  (Icons)

Backend Layer:
├── Node.js               (Runtime)
├── Express 4.18.2        (Web Framework)
├── Mongoose 8.0.3        (ODM)
├── CORS 2.8.5            (Security)
├── dotenv 16.3.1         (Config)
└── Nodemon 3.0.2         (Dev Tool)

Database Layer:
└── MongoDB 7.0+          (NoSQL Database)


                    API ENDPOINTS
                    ─────────────

Movies Endpoints:
• GET    /api/movies              → List all movies
• GET    /api/movies?mood=Happy   → Filter by mood
• GET    /api/movies?genre=Action → Filter by genre
• GET    /api/movies/:id          → Get single movie
• POST   /api/movies              → Create movie
• PUT    /api/movies/:id          → Update movie
• DELETE /api/movies/:id          → Delete movie

Music Endpoints:
• GET    /api/music                → List all songs
• GET    /api/music?mood=Chill    → Filter by mood
• GET    /api/music?genre=Jazz    → Filter by genre
• GET    /api/music/:id           → Get single song
• POST   /api/music               → Create song
• PUT    /api/music/:id           → Update song
• DELETE /api/music/:id           → Delete song

Favorites Endpoints:
• GET    /api/favorites            → List favorites
• POST   /api/favorites            → Add favorite
• DELETE /api/favorites/:id        → Remove favorite

Utility Endpoints:
• GET    /api/health               → Health check
• GET    /                         → API info


                ENVIRONMENT VARIABLES
                ─────────────────────

Backend (.env):
PORT=5000
MONGO_URI=mongodb://localhost:27017/kosg
NODE_ENV=development

Frontend (.env):
VITE_API_URL=http://localhost:5000


                  FILE COUNTS
                  ───────────

Backend:
• Models: 3
• Controllers: 3
• Routes: 3
• Config: 1
• Data: 2
• Total: 12 core files

Frontend:
• Components: 2
• API Layer: 1
• Main: 2
• Total: 5 core files

Documentation:
• README files: 3
• Setup guides: 2
• Total: 5 files


              DEVELOPMENT WORKFLOW
              ────────────────────

1. Install MongoDB
2. Clone repository
3. Install dependencies
4. Configure .env files
5. Seed database
6. Start backend server
7. Start frontend server
8. Develop features
9. Test locally
10. Deploy to production


            PRODUCTION DEPLOYMENT
            ─────────────────────

Backend (Render/Railway):
• Build Command: npm install
• Start Command: npm start
• Environment: Set MONGO_URI

Frontend (Vercel/Netlify):
• Build Command: npm run build
• Output Dir: dist
• Environment: Set VITE_API_URL

Database (MongoDB Atlas):
• Already cloud-ready
• Update MONGO_URI in backend


                SECURITY FEATURES
                ─────────────────

✓ CORS enabled
✓ Environment variables
✓ Input validation (Mongoose schemas)
✓ Error handling
✓ Type safety (TypeScript)
✓ .gitignore configured
✓ No sensitive data in code


              PERFORMANCE FEATURES
              ────────────────────

✓ MongoDB indexing
✓ Efficient queries
✓ Vite build optimization
✓ React optimization
✓ Lazy loading ready
✓ Code splitting ready


                  SCALABILITY
                  ───────────

✓ Modular architecture
✓ Separation of concerns
✓ Easy to add new features
✓ Database indexing
✓ Cloud-ready
✓ Microservices-ready


```

**Built with ❤️ for KOSG Platform**
