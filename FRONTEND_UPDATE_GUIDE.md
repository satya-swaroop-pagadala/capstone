# Frontend Update Guide - Real Dataset Integration

## ⚠️ Current Issue
The frontend (MoviesPage.tsx and MusicPage.tsx) is still using **hardcoded SAMPLE data** instead of fetching from the real API with 9,826 movies and 113,999 songs.

## 🔧 Quick Fix Instructions

### Option 1: Manual Update (Recommended - 5 minutes)

1. **Open MoviesPage.tsx** (`/project/src/components/MoviesPage.tsx`)

2. **Replace these lines at the top:**

```typescript
// OLD - Remove this
const SAMPLE_MOVIES: Movie[] = [ ... ];
const MOODS = ['Happy', 'Sad', 'Excited', 'Relaxed', 'Adventurous', 'Romantic'];
const GENRES = ['Action', 'Drama', 'Comedy', 'Sci-Fi', 'Thriller', 'Romance', 'Crime', 'Adventure'];

// NEW - Add this instead
import api from '../api/api';

// Add mood icons
const MOOD_ICONS: Record<string, any> = {
  Happy: Smile,
  Joyful: Smile,
  Excited: Zap,
  Sad: Frown,
  Emotional: HeartHandshake,
  Romantic: HeartHandshake,
  Adventurous: Mountain,
};
```

3. **Update the Movie interface:**

```typescript
// OLD
interface Movie {
  id: string;
  ...
}

// NEW
interface Movie {
  _id: string;  // Changed from id
  title: string;
  genre: string[];
  mood: string[];  // NEW - add mood array
  overview: string;
  releaseYear: number;
  posterUrl: string;
  rating: number;
  popularity: number;  // NEW
}
```

4. **Update the component state:**

```typescript
// Add these new states
const [movies, setMovies] = useState<Movie[]>([]);
const [availableMoods, setAvailableMoods] = useState<string[]>([]);
const [availableGenres, setAvailableGenres] = useState<string[]>([]);
```

5. **Add API fetch logic (replace the timeout useEffect):**

```typescript
// Fetch moods and genres
useEffect(() => {
  const fetchFilters = async () => {
    try {
      const [moodsRes, genresRes] = await Promise.all([
        api.get('/api/movies/moods/all'),
        api.get('/api/movies/genres/all')
      ]);
      setAvailableMoods(moodsRes.data.slice(0, 12));
      setAvailableGenres(genresRes.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };
  fetchFilters();
}, []);

// Fetch movies when filters change
useEffect(() => {
  const fetchMovies = async () => {
    setLoading(true);
    try {
      const params: any = { limit: 50 };
      if (selectedMood) params.mood = selectedMood;
      if (selectedGenre) params.genre = selectedGenre;
      
      const response = await api.get('/api/movies', { params });
      setMovies(response.data.movies || []);
    } catch (error) {
      console.error('Error:', error);
      setMovies([]);
    } finally {
      setLoading(false);
    }
  };
  fetchMovies();
}, [selectedMood, selectedGenre]);
```

6. **Replace all instances:**
   - `movie.id` → `movie._id`
   - `SAMPLE_MOVIES` → `movies`
   - `filteredMovies` → `movies`
   - `MOODS.map` → `availableMoods.map`
   - `GENRES.map` → `availableGenres.map`

7. **Add mood tags to movie cards** (in the render section):

```tsx
{/* Add this after genre display */}
<div className="flex flex-wrap gap-1">
  {movie.mood.slice(0, 3).map((mood) => (
    <span
      key={mood}
      className="text-xs px-2 py-1 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 rounded-md"
    >
      {mood}
    </span>
  ))}
</div>
```

### Option 2: Use Pre-made Component Files

Download these complete, ready-to-use component files from the project:

```bash
# Already created in your backend/data folder
cp backend/data/MoviesPage_updated.tsx project/src/components/MoviesPage.tsx
cp backend/data/MusicPage_updated.tsx project/src/components/MusicPage.tsx
```

## 🎵 Music Page Update

For **MusicPage.tsx**, follow similar steps:

1. **Update interface:**
```typescript
interface Song {
  _id: string;  // Changed from id
  title: string;
  artist: string;  // KEY FIELD for search
  genre: string;  // Changed from array to single string
  album: string;
  coverUrl: string;
  duration: string;
  popularity: number;  // NEW
}
```

2. **Add artist search:**
```typescript
const [artists, setArtists] = useState<string[]>([]);
const [searchQuery, setSearchQuery] = useState('');
const [selectedArtist, setSelectedArtist] = useState('');

// Fetch artists
useEffect(() => {
  const fetchArtists = async () => {
    try {
      const res = await api.get('/api/music/artists/all', {
        params: { limit: 100 }
      });
      setArtists(res.data.map((a: any) => a.name));
    } catch (error) {
      console.error('Error:', error);
    }
  };
  fetchArtists();
}, []);

// Fetch music by artist or search
useEffect(() => {
  const fetchMusic = async () => {
    setLoading(true);
    try {
      const params: any = { limit: 50 };
      if (selectedArtist) params.artist = selectedArtist;
      if (searchQuery) params.search = searchQuery;
      
      const response = await api.get('/api/music', { params });
      setMusic(response.data.music || []);
    } catch (error) {
      console.error('Error:', error);
      setMusic([]);
    } finally {
      setLoading(false);
    }
  };
  fetchMusic();
}, [selectedArtist, searchQuery]);
```

3. **Add artist search UI:**
```tsx
<div className="mb-4">
  <input
    type="text"
    placeholder="Search for artist..."
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
  />
</div>

{/* Popular Artists */}
<div className="flex flex-wrap gap-2">
  {artists.slice(0, 20).map((artist) => (
    <button
      key={artist}
      onClick={() => setSelectedArtist(artist === selectedArtist ? '' : artist)}
      className={`px-4 py-2 rounded-xl ${
        selectedArtist === artist
          ? 'bg-indigo-600 text-white'
          : 'bg-slate-100 text-slate-700'
      }`}
    >
      {artist}
    </button>
  ))}
</div>
```

## 🧪 Testing

1. **Start servers:**
```bash
# Terminal 1 - Backend
cd backend && npm start

# Terminal 2 - Frontend  
cd project && npm run dev
```

2. **Test Movie Moods:**
   - Click on "Excited" → Should show Action/Thriller movies
   - Click on "Romantic" → Should show Romance movies
   - Click on "Happy" → Should show Comedy movies

3. **Test Music Artists:**
   - Search "Beatles" → Should show Beatles songs
   - Click "Mozart" → Should show Mozart tracks
   - Search "Linkin Park" → Should show Linkin Park music

## 🐛 Troubleshooting

**Problem:** "Cannot read property 'movies' of undefined"
- **Solution:** Check backend is running on port 5001
- **Fix:** `cd backend && npm start`

**Problem:** "Network Error"  
- **Solution:** Check VITE_API_URL in `/project/.env`
- **Fix:** Should be `VITE_API_URL=http://localhost:5001`

**Problem:** Still showing sample data
- **Solution:** Hard refresh browser (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
- **Fix:** Clear browser cache

**Problem:** TypeScript errors about `movie.id`
- **Solution:** Change ALL instances to `movie._id` (MongoDB uses _id)

## ✅ Expected Results

After updating:
- ✅ Movies page shows real TMDB movies
- ✅ Mood filters work (21 moods available)
- ✅ Genre filters work (19 genres available)  
- ✅ Music page shows real Spotify songs
- ✅ Artist search works (17,648 artists)
- ✅ Both pages load 50 items initially

## 📊 Data Statistics

**Movies:**
- Total: 9,826 films
- Moods: Adventurous, Bold, Cheerful, Curious, Dark, Emotional, Energetic, Excited, Happy, Inspired, Intense, Joyful, Magical, Mysterious, Reflective, Romantic, Scared, Tense, Thoughtful, Thrilling, Warm

**Music:**
- Total: 113,999 songs
- Top Artists: Mozart (354), J Balvin (347), George Jones (343), The Beatles (280), Linkin Park (252)

## 🔗 API Endpoints Reference

```
Movies:
GET /api/movies?mood=Excited&limit=50
GET /api/movies/moods/all
GET /api/movies/genres/all

Music:
GET /api/music?artist=The+Beatles&limit=50
GET /api/music/artists/all?search=beat
GET /api/music/genres/all
```

That's it! Your project will now use real-world data! 🎉
