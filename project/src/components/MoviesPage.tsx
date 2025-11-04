import { useState, useEffect } from 'react';
import { Star, Heart, Filter, Sparkles, TrendingUp } from 'lucide-react';
import api from '../api/api';

interface Movie {
  _id: string;
  title: string;
  genre: string[];
  mood: string[];
  overview: string;
  releaseYear: number;
  posterUrl: string;
  rating: number;
  popularity: number;
  voteCount: number;
}

export default function MoviesPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [moods, setMoods] = useState<string[]>([]);
  const [genres, setGenres] = useState<string[]>([]);
  const [selectedMood, setSelectedMood] = useState<string>('');
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [showTrending, setShowTrending] = useState<boolean>(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [totalMovies, setTotalMovies] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const moviesPerPage = 24;

  // Fetch movies, moods, and genres from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Determine endpoint and params based on trending mode
        const endpoint = showTrending ? '/api/movies/trending' : '/api/movies';
        const params: any = { 
          limit: moviesPerPage,
          page: currentPage
        };
        
        // Only apply mood/genre filters when not in trending mode
        if (!showTrending) {
          if (selectedMood) params.mood = selectedMood;
          if (selectedGenre) params.genre = selectedGenre;
        }
        
        const [moviesRes, moodsRes, genresRes] = await Promise.all([
          api.get(endpoint, { params }),
          currentPage === 1 ? api.get('/api/movies/moods') : Promise.resolve({ data: moods }),
          currentPage === 1 ? api.get('/api/movies/genres') : Promise.resolve({ data: genres })
        ]);

        if (currentPage === 1) {
          setMovies(moviesRes.data.movies || []);
        } else {
          setMovies(prev => [...prev, ...(moviesRes.data.movies || [])]);
        }
        
        setTotalMovies(moviesRes.data.total || 0);
        if (currentPage === 1) {
          // API returns arrays directly, not wrapped in objects
          setMoods(Array.isArray(moodsRes.data) ? moodsRes.data : []);
          setGenres(Array.isArray(genresRes.data) ? genresRes.data : []);
        }
      } catch (error) {
        console.error('Error fetching movie data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedMood, selectedGenre, currentPage, showTrending]);
  
  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedMood, selectedGenre, showTrending]);

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Movie Recommendations</h1>
          <p className="text-slate-600 mt-1">Discover movies tailored to your taste</p>
        </div>
        {totalMovies > 0 && (
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-2 rounded-full border border-emerald-200">
            <span className="text-sm font-semibold text-emerald-700">{totalMovies.toLocaleString()} Movies Available</span>
          </div>
        )}
      </div>

      {/* Trending Worldwide Button */}
      <div className="flex justify-center">
        <button
          onClick={() => {
            setShowTrending(!showTrending);
            if (!showTrending) {
              // Clear other filters when enabling trending
              setSelectedMood('');
              setSelectedGenre('');
            }
          }}
          className={`flex items-center space-x-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all transform hover:scale-105 ${
            showTrending
              ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/50'
              : 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 hover:from-slate-200 hover:to-slate-300'
          }`}
        >
          <TrendingUp className="w-5 h-5" />
          <span>{showTrending ? '🔥 Showing Trending Worldwide' : '🌍 View Trending Worldwide'}</span>
        </button>
      </div>

      {!showTrending && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center space-x-2 mb-4">
            <Filter className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-slate-800">Filter by Preferences</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Current Mood</label>
              <div className="flex flex-wrap gap-2">
                {moods.map(mood => (
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
                {genres.map(genre => (
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
      )}

      {showTrending && (
        <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-lg border border-orange-200">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-orange-600" />
            <p className="text-slate-700">
              <span className="font-medium">Showing trending movies worldwide</span>
              <span> - Popular releases from the last 3 years</span>
            </p>
          </div>
        </div>
      )}

      {(selectedMood || selectedGenre) && !showTrending && (
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

      {loading ? (
        <div className="text-center py-12">
          <p className="text-slate-500">Loading movies...</p>
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {movies.map(movie => (
              <div key={movie._id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow group">
                <div className="relative h-56 overflow-hidden bg-slate-200">
                  <img
                    src={movie.posterUrl}
                    alt={movie.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <button
                    onClick={() => toggleFavorite(movie._id)}
                    className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
                    aria-label={favorites.has(movie._id) ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Heart
                      className={`w-5 h-5 ${favorites.has(movie._id) ? 'fill-red-500 text-red-500' : 'text-slate-600'}`}
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
                    {movie.genre.slice(0, 3).map((g: string) => (
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

          {/* Pagination - Page Numbers */}
          {movies.length < totalMovies && !loading && (
            <div className="flex justify-center items-center space-x-2 py-8">
              <span className="text-sm text-slate-600">
                Showing {movies.length} of {totalMovies.toLocaleString()} movies
              </span>
              <span className="text-slate-400">•</span>
              <button
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
              >
                Page {currentPage + 1}
              </button>
            </div>
          )}

          {movies.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-500">No movies found matching your preferences. Try adjusting your filters.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
