import { useState } from 'react';
import { Star, Heart, Filter, Sparkles } from 'lucide-react';

interface Movie {
  id: string;
  title: string;
  genre: string[];
  overview: string;
  releaseYear: number;
  posterUrl: string;
  rating: number;
}

const SAMPLE_MOVIES: Movie[] = [
  {
    id: '1',
    title: 'The Shawshank Redemption',
    genre: ['Drama', 'Crime'],
    overview: 'Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.',
    releaseYear: 1994,
    posterUrl: 'https://images.pexels.com/photos/7991158/pexels-photo-7991158.jpeg?auto=compress&cs=tinysrgb&w=400',
    rating: 9.3
  },
  {
    id: '2',
    title: 'Inception',
    genre: ['Sci-Fi', 'Thriller', 'Action'],
    overview: 'A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea.',
    releaseYear: 2010,
    posterUrl: 'https://images.pexels.com/photos/7991211/pexels-photo-7991211.jpeg?auto=compress&cs=tinysrgb&w=400',
    rating: 8.8
  },
  {
    id: '3',
    title: 'The Dark Knight',
    genre: ['Action', 'Crime', 'Drama'],
    overview: 'When the menace known as the Joker wreaks havoc on Gotham, Batman must accept one of the greatest tests.',
    releaseYear: 2008,
    posterUrl: 'https://images.pexels.com/photos/436413/pexels-photo-436413.jpeg?auto=compress&cs=tinysrgb&w=400',
    rating: 9.0
  },
  {
    id: '4',
    title: 'Pulp Fiction',
    genre: ['Crime', 'Drama'],
    overview: 'The lives of two mob hitmen, a boxer, a gangster and his wife intertwine in four tales of violence and redemption.',
    releaseYear: 1994,
    posterUrl: 'https://images.pexels.com/photos/1200450/pexels-photo-1200450.jpeg?auto=compress&cs=tinysrgb&w=400',
    rating: 8.9
  },
  {
    id: '5',
    title: 'Forrest Gump',
    genre: ['Drama', 'Romance'],
    overview: 'The presidencies of Kennedy and Johnson unfold through the perspective of an Alabama man with an IQ of 75.',
    releaseYear: 1994,
    posterUrl: 'https://images.pexels.com/photos/66134/pexels-photo-66134.jpeg?auto=compress&cs=tinysrgb&w=400',
    rating: 8.8
  },
  {
    id: '6',
    title: 'Interstellar',
    genre: ['Sci-Fi', 'Drama', 'Adventure'],
    overview: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival.',
    releaseYear: 2014,
    posterUrl: 'https://images.pexels.com/photos/2150/sky-space-dark-galaxy.jpg?auto=compress&cs=tinysrgb&w=400',
    rating: 8.6
  }
];

const MOODS = ['Happy', 'Sad', 'Excited', 'Relaxed', 'Adventurous', 'Romantic'];
const GENRES = ['Action', 'Drama', 'Comedy', 'Sci-Fi', 'Thriller', 'Romance', 'Crime', 'Adventure'];

// Map each mood to related genres
const MOOD_GENRE_MAP: Record<string, string[]> = {
  Happy: ['Comedy', 'Romance'],
  Sad: ['Drama'],
  Excited: ['Action', 'Thriller'],
  Relaxed: ['Adventure'],
  Adventurous: ['Adventure', 'Action'],
  Romantic: ['Romance']
};

export default function MoviesPage() {
  const [selectedMood, setSelectedMood] = useState<string>('');
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(id)) {
        newFavorites.delete(id);
      } else {
        newFavorites.add(id);
      }
      return newFavorites;
    });
  };

  // Filter by genre and mood (if set)
  const filteredMovies = SAMPLE_MOVIES.filter(movie => {
    if (selectedGenre && !movie.genre.includes(selectedGenre)) return false;
    if (selectedMood && !movie.genre.some(g => (MOOD_GENRE_MAP[selectedMood] || []).includes(g))) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Movie Recommendations</h1>
          <p className="text-slate-600 mt-1">Discover movies tailored to your taste</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="w-5 h-5 text-emerald-600" />
          <h2 className="text-lg font-semibold text-slate-800">Filter by Preferences</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Current Mood</label>
            <div className="flex flex-wrap gap-2">
              {MOODS.map(mood => (
                <button
                  key={mood}
                  onClick={() => setSelectedMood(mood === selectedMood ? '' : mood)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedMood === mood
                      ? 'bg-emerald-500 text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {mood}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Favorite Genre</label>
            <div className="flex flex-wrap gap-2">
              {GENRES.map(genre => (
                <button
                  key={genre}
                  onClick={() => setSelectedGenre(genre === selectedGenre ? '' : genre)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedGenre === genre
                      ? 'bg-teal-500 text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {(selectedMood || selectedGenre) && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-lg border border-emerald-200">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            <p className="text-slate-700">
              <span className="font-medium">Showing recommendations</span>
              {selectedMood && <span> for when you're feeling {selectedMood.toLowerCase()}</span>}
              {selectedGenre && <span> in the {selectedGenre} genre</span>}
            </p>
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMovies.map(movie => (
          <div key={movie.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow group">
            <div className="relative h-56 overflow-hidden bg-slate-200">
              <img
                src={movie.posterUrl}
                alt={movie.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <button
                onClick={() => toggleFavorite(movie.id)}
                className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
                aria-label={favorites.has(movie.id) ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Heart
                  className={`w-5 h-5 ${favorites.has(movie.id) ? 'fill-red-500 text-red-500' : 'text-slate-600'}`}
                />
              </button>
              <div className="absolute bottom-3 left-3 flex items-center space-x-1 bg-slate-900/80 backdrop-blur-sm px-2 py-1 rounded">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-white text-sm font-medium">{movie.rating}</span>
              </div>
            </div>

            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-semibold text-slate-800 line-clamp-1">{movie.title}</h3>
                <span className="text-sm text-slate-500 whitespace-nowrap ml-2">{movie.releaseYear}</span>
              </div>

              <div className="flex flex-wrap gap-1 mb-3">
                {movie.genre.slice(0, 3).map(g => (
                  <span key={g} className="text-xs px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full">
                    {g}
                  </span>
                ))}
              </div>

              <p className="text-sm text-slate-600 line-clamp-3">{movie.overview}</p>
            </div>
          </div>
        ))}
      </div>

      {filteredMovies.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-500">No movies found matching your preferences. Try adjusting your filters.</p>
        </div>
      )}
    </div>
  );
}
