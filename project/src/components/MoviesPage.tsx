import { useState, useEffect } from 'react';
import { Star, Heart, Filter, Sparkles, TrendingUp, Zap, Users, ThumbsUp } from 'lucide-react';
import api, { 
  getMovieRecommendations, 
  trackInteraction, 
  getCollaborativeMovieRecommendations,
  getLikedMovies,
  getFavorites,
  addFavorite,
  removeFavoriteByItem,
  type Movie as APIMovie,
  type CFRecommendation 
} from '../api/api';
import { useAuth } from '../context/AuthContext';

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
  const { user } = useAuth();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [recommendedMovies, setRecommendedMovies] = useState<APIMovie[]>([]);
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

  // Collaborative Filtering states
  const [showCFSection, setShowCFSection] = useState(false);
  const [likedMovies, setLikedMovies] = useState<APIMovie[]>([]);
  const [cfRecommendations, setCfRecommendations] = useState<CFRecommendation | null>(null);
  const [loadingCF, setLoadingCF] = useState(false);

  // Load user's favorites on mount
  useEffect(() => {
    const loadFavorites = async () => {
      if (!user) {
        setFavorites(new Set());
        return;
      }
      
      try {
        const userFavorites = await getFavorites(user._id);
        const favoriteIds = userFavorites
          .filter(fav => fav.itemType === "Movie")
          .map(fav => typeof fav.itemId === 'string' ? fav.itemId : fav.itemId._id);
        setFavorites(new Set(favoriteIds));
      } catch (error) {
        console.error('Error loading favorites:', error);
      }
    };
    
    loadFavorites();
  }, [user]);

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
  
  // Fetch personalized recommendations
  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        if (!user) {
          // Clear recommendations if not logged in
          setRecommendedMovies([]);
          setFavorites(new Set());
          return;
        }
        
        const recommended = await getMovieRecommendations(selectedMood || undefined).catch(err => {
          console.error('Failed to fetch recommendations:', err);
          return { recommendations: [], liked: [] };
        });
        
        console.log('Recommendations fetched:', recommended);
        
        setRecommendedMovies((recommended.recommendations as APIMovie[]) || []);
        
        // Update favorites set from liked movies in recommendation response
        if (recommended.liked && Array.isArray(recommended.liked)) {
          const likedMovies = recommended.liked as APIMovie[];
          const likedIds = new Set(likedMovies.map(m => m._id));
          setFavorites(likedIds);
        }
      } catch (error) {
        console.error('Error fetching recommendations:', error);
      }
    };

    fetchRecommendations();
  }, [user, selectedMood]); // Re-fetch when user logs in/out or mood changes
  
  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedMood, selectedGenre, showTrending]);

  // Fetch CF recommendations and liked movies
  const fetchCFRecommendations = async () => {
    if (!user) return;
    
    try {
      setLoadingCF(true);
      const [liked, cf] = await Promise.all([
        getLikedMovies(),
        getCollaborativeMovieRecommendations(30, 20, 2)
      ]);
      
      setLikedMovies(liked);
      setCfRecommendations(cf);
    } catch (error) {
      console.error('Error fetching CF recommendations:', error);
    } finally {
      setLoadingCF(false);
    }
  };

  const toggleFavorite = async (movie: APIMovie) => {
    if (!user) {
      console.error('User must be logged in to favorite movies');
      return;
    }

    const id = movie._id;
    const isCurrentlyFavorite = favorites.has(id);
    
    // Optimistically update UI
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(id)) {
        newFavorites.delete(id);
      } else {
        newFavorites.add(id);
      }
      return newFavorites;
    });
    
    try {
      if (isCurrentlyFavorite) {
        // Remove from favorites
        console.log('Removing favorite:', { id, itemType: 'Movie' });
        await removeFavoriteByItem(id, 'Movie');
        console.log('Successfully removed favorite');
        
        // Track as view instead of like
        await trackInteraction({
          itemId: id,
          itemType: 'movie',
          interactionType: 'view',
          mood: selectedMood || undefined
        });
      } else {
        // Add to favorites with complete movie data
        console.log('Adding favorite:', { 
          id, 
          itemType: 'Movie', 
          userId: user._id,
          title: movie.title,
          posterPath: movie.posterUrl
        });
        const result = await addFavorite(id, 'Movie', {
          title: movie.title,
          posterPath: movie.posterUrl,
          rating: movie.rating,
          releaseDate: movie.releaseYear?.toString()
        });
        console.log('Successfully added favorite:', result);
        
        // Track as like
        await trackInteraction({
          itemId: id,
          itemType: 'movie',
          interactionType: 'like',
          mood: selectedMood || undefined
        });
        
        // Refresh recommendations after liking
        const recommended = await getMovieRecommendations(selectedMood || undefined);
        setRecommendedMovies((recommended.recommendations as APIMovie[]) || []);
        
        // Refresh CF recommendations if CF section is shown
        if (showCFSection) {
          await fetchCFRecommendations();
        }
      }
    } catch (error: any) {
      console.error('Error toggling favorite:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // Show user-friendly error message
      alert(`Failed to ${isCurrentlyFavorite ? 'remove' : 'add'} favorite: ${error.response?.data?.message || error.message}`);
      
      // Revert optimistic update on error
      setFavorites(prev => {
        const newFavorites = new Set(prev);
        if (isCurrentlyFavorite) {
          newFavorites.add(id);
        } else {
          newFavorites.delete(id);
        }
        return newFavorites;
      });
    }
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
      <div className="flex justify-center gap-4">
        <button
          onClick={() => {
            setShowTrending(!showTrending);
            if (!showTrending) {
              // Clear other filters when enabling trending
              setSelectedMood('');
              setSelectedGenre('');
              setShowCFSection(false);
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

        {user && !showTrending && (
          <button
            onClick={() => {
              setShowCFSection(!showCFSection);
              if (!showCFSection) {
                fetchCFRecommendations();
              }
            }}
            className={`flex items-center space-x-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all transform hover:scale-105 ${
              showCFSection
                ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-500/50'
                : 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 hover:from-slate-200 hover:to-slate-300'
            }`}
          >
            <Users className="w-5 h-5" />
            <span>{showCFSection ? '💡 Showing Based on Your Likes' : '🎯 Movies Based on What You Like'}</span>
          </button>
        )}
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

      {/* Collaborative Filtering Section - My Liked Movies & CF Recommendations */}
      {showCFSection && user && !showTrending && (
        <div className="space-y-8 bg-gradient-to-br from-purple-50 to-indigo-50 p-8 rounded-2xl border-2 border-purple-200">
          {/* My Liked Movies */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <ThumbsUp className="w-7 h-7 text-purple-600" />
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Movies You've Liked</h2>
                  <p className="text-slate-600 text-sm">These movies shape your personalized recommendations</p>
                </div>
              </div>
              {likedMovies.length > 0 && (
                <div className="bg-purple-100 px-4 py-2 rounded-full">
                  <span className="text-purple-700 font-semibold">{likedMovies.length} Liked</span>
                </div>
              )}
            </div>

            {loadingCF ? (
              <div className="text-center py-12">
                <p className="text-slate-500">Loading your liked movies...</p>
              </div>
            ) : likedMovies.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {likedMovies.map(movie => (
                  <div key={movie._id} className="bg-white rounded-lg shadow-md border border-purple-100 overflow-hidden hover:shadow-xl transition-shadow group">
                    <div className="relative h-48 overflow-hidden bg-slate-200">
                      <img
                        src={movie.posterUrl}
                        alt={movie.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute bottom-2 left-2 flex items-center space-x-1 bg-slate-900/80 backdrop-blur-sm px-2 py-1 rounded">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-white text-xs font-medium">{movie.rating}</span>
                      </div>
                      <div className="absolute top-2 right-2 p-1.5 bg-red-500 rounded-full">
                        <Heart className="w-4 h-4 fill-white text-white" />
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="text-sm font-semibold text-slate-800 line-clamp-1">{movie.title}</h3>
                      <p className="text-xs text-slate-500 mt-1">{movie.releaseYear}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white p-8 rounded-lg text-center border border-purple-200">
                <Heart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 mb-2">You haven't liked any movies yet</p>
                <p className="text-sm text-slate-500">Start liking movies to get personalized collaborative filtering recommendations!</p>
              </div>
            )}
          </div>

          {/* CF-Based Recommendations */}
          {cfRecommendations && cfRecommendations.recommendations && cfRecommendations.recommendations.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <Users className="w-7 h-7 text-indigo-600" />
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">Recommended Based on Similar Users</h2>
                    <p className="text-slate-600 text-sm">
                      People with similar taste also enjoyed these movies
                      {cfRecommendations.neighbors && cfRecommendations.neighbors.length > 0 && (
                        <span className="ml-1">
                          ({cfRecommendations.neighbors.length} similar users found)
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                {cfRecommendations.source && (
                  <div className={`px-4 py-2 rounded-full ${
                    cfRecommendations.source === 'collaborative_filtering' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    <span className="text-sm font-semibold">
                      {cfRecommendations.source === 'collaborative_filtering' ? '✓ CF Active' : '⚠ Fallback'}
                    </span>
                  </div>
                )}
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {cfRecommendations.recommendations.map(movie => (
                  <div key={movie._id} className="bg-white rounded-xl shadow-md border border-indigo-200 overflow-hidden hover:shadow-2xl transition-all group">
                    <div className="relative h-56 overflow-hidden bg-slate-200">
                      <img
                        src={movie.posterUrl}
                        alt={movie.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <button
                        onClick={() => toggleFavorite(movie)}
                        className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
                      >
                        <Heart
                          className={`w-5 h-5 ${favorites.has(movie._id) ? 'fill-red-500 text-red-500' : 'text-slate-600'}`}
                        />
                      </button>
                      <div className="absolute bottom-3 left-3 flex items-center space-x-1 bg-slate-900/80 backdrop-blur-sm px-2 py-1 rounded">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-white text-sm font-medium">{movie.rating}</span>
                      </div>
                      {movie.recommendationScore && (
                        <div className="absolute top-3 left-3 bg-indigo-600 text-white px-2 py-1 rounded text-xs font-bold">
                          {(movie.recommendationScore * 10).toFixed(0)}% Match
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-semibold text-slate-800 line-clamp-1">{movie.title}</h3>
                        <span className="text-sm text-slate-500 whitespace-nowrap ml-2">{movie.releaseYear}</span>
                      </div>

                      <div className="flex flex-wrap gap-1 mb-3">
                        {movie.genre.slice(0, 2).map((g: string) => (
                          <span key={g} className="text-xs px-2 py-1 bg-indigo-50 text-indigo-700 rounded-full">
                            {g}
                          </span>
                        ))}
                      </div>

                      <p className="text-sm text-slate-600 line-clamp-2">{movie.overview}</p>
                    </div>
                  </div>
                ))}
              </div>

              {cfRecommendations.stats && (
                <div className="mt-6 bg-white p-4 rounded-lg border border-indigo-200">
                  <p className="text-sm text-slate-600 text-center">
                    <span className="font-semibold text-indigo-600">{cfRecommendations.stats.similarUsers}</span> users with similar taste found
                    {cfRecommendations.stats.candidateItems > 0 && (
                      <>
                        {' • '}
                        <span className="font-semibold text-indigo-600">{cfRecommendations.stats.candidateItems}</span> unique recommendations
                      </>
                    )}
                  </p>
                </div>
              )}
            </div>
          )}

          {cfRecommendations && (!cfRecommendations.recommendations || cfRecommendations.recommendations.length === 0) && likedMovies.length > 0 && (
            <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
              <div className="flex items-start space-x-3">
                <Sparkles className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-yellow-900 mb-2">Not Enough Data for Collaborative Filtering</h3>
                  <p className="text-sm text-yellow-800">
                    {cfRecommendations.message || "We need more users with similar taste to provide collaborative filtering recommendations. Keep liking movies, and we'll find great matches for you!"}
                  </p>
                </div>
              </div>
            </div>
          )}
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

      {/* Personalized Recommendations Section */}
      {recommendedMovies.length > 0 && !showTrending && (
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <Zap className="w-6 h-6 text-purple-600" />
            <h2 className="text-2xl font-bold text-slate-800">Recommended for You</h2>
          </div>
          <p className="text-slate-600">Based on movies you've liked {selectedMood ? `when feeling ${selectedMood.toLowerCase()}` : ''}</p>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {recommendedMovies.slice(0, 8).map(movie => (
              <div key={movie._id} className="bg-white rounded-xl shadow-sm border border-purple-200 overflow-hidden hover:shadow-lg transition-shadow group">
                <div className="relative h-56 overflow-hidden bg-slate-200">
                  <img
                    src={movie.posterUrl}
                    alt={movie.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <button
                    onClick={() => toggleFavorite(movie)}
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
                    {movie.genre.slice(0, 2).map((g: string) => (
                      <span key={g} className="text-xs px-2 py-1 bg-purple-50 text-purple-700 rounded-full">
                        {g}
                      </span>
                    ))}
                  </div>

                  <p className="text-sm text-slate-600 line-clamp-2">{movie.overview}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Movies Section */}
      {!showTrending && recommendedMovies.length > 0 && (
        <div className="flex items-center space-x-3 mt-8">
          <Filter className="w-6 h-6 text-emerald-600" />
          <h2 className="text-2xl font-bold text-slate-800">Browse All Movies</h2>
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
                    onClick={() => toggleFavorite(movie)}
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
