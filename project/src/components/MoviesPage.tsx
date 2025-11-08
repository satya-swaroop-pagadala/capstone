import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Star, Heart, Filter, Sparkles, TrendingUp, Zap, Users, ThumbsUp, X, Search, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
import MovieDetailModal from './MovieDetailModal';

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
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [showTrending, setShowTrending] = useState<boolean>(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [favoritesLoading, setFavoritesLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [totalMovies, setTotalMovies] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const moviesPerPage = 24;

  // Movie detail modal state
  const [selectedMovie, setSelectedMovie] = useState<Movie | APIMovie | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Collaborative Filtering states
  const [showCFSection, setShowCFSection] = useState(false);
  const [likedMovies, setLikedMovies] = useState<APIMovie[]>([]);
  const [cfRecommendations, setCfRecommendations] = useState<CFRecommendation | null>(null);
  const [loadingCF, setLoadingCF] = useState(false);
  const [showLikedMoviesPage, setShowLikedMoviesPage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [searchResultsOpen, setSearchResultsOpen] = useState(false);
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);
  const [apiSearchResults, setApiSearchResults] = useState<Array<Movie | APIMovie>>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [filterOverlayOpen, setFilterOverlayOpen] = useState(false);
  const [filterOverlayLoading, setFilterOverlayLoading] = useState(false);
  const [filterOverlayError, setFilterOverlayError] = useState<string | null>(null);
  const [filterOverlayResults, setFilterOverlayResults] = useState<Array<Movie | APIMovie>>([]);

  const handleGenreToggle = (genre: string) => {
    // Track up to two chosen genres, replacing the oldest when a third is picked
    setSelectedGenres((prev) => {
      if (prev.includes(genre)) {
        return prev.filter((item) => item !== genre);
      }

      if (prev.length < 2) {
        return [...prev, genre];
      }

      return [prev[1], genre];
    });
  };

  // Load user's favorites on mount
  useEffect(() => {
    const loadFavorites = async () => {
      if (!user) {
  setFavorites(new Set());
  setLikedMovies([]);
  setShowLikedMoviesPage(false);
        setFavoritesLoading(false);
        return;
      }
      
      setFavoritesLoading(true);
      try {
        console.log('Loading favorites for user:', user._id);
        const userFavorites = await getFavorites();
        console.log('Loaded favorites:', userFavorites);
        const favoriteIds = userFavorites
          .filter(fav => fav.itemType === "Movie")
          .map(fav => typeof fav.itemId === 'string' ? fav.itemId : fav.itemId._id);
        console.log('Favorite movie IDs:', favoriteIds);
        setFavorites(new Set(favoriteIds));
        
        // Also load full liked movies data for display (from UserInteraction only)
        try {
          const liked = await getLikedMovies();
          console.log('Loaded liked movies from UserInteraction:', liked);
          setLikedMovies(liked);
        } catch (error) {
          console.error('Error loading liked movies:', error);
          setLikedMovies([]);
        }
      } catch (error) {
        console.error('Error loading favorites:', error);
      } finally {
        setFavoritesLoading(false);
      }
    };
    
    loadFavorites();
  }, [user]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [searchQuery]);

  useEffect(() => {
    if (!selectedMood && selectedGenres.length === 0) {
      setFilterOverlayOpen(false);
      setFilterOverlayResults([]);
      setFilterOverlayError(null);
    }
  }, [selectedGenres, selectedMood]);

  useEffect(() => {
    if (showTrending) {
      setFilterOverlayOpen(false);
    }
  }, [showTrending]);

  useEffect(() => {
    if (!debouncedSearch) {
      setApiSearchResults([]);
      setSearchError(null);
      setSearchLoading(false);
      return;
    }

    let isActive = true;
    const controller = new AbortController();

    setSearchLoading(true);
    setSearchError(null);

    const normalized = debouncedSearch.toLowerCase();

    api.get('/api/movies', {
      params: {
        search: debouncedSearch,
        limit: 50,
      },
      signal: controller.signal,
    })
      .then((response) => {
        if (!isActive) return;
        const results = Array.isArray(response.data?.movies) ? response.data.movies : [];
        const filtered = results.filter((movie: any) =>
          movie?.title?.toLowerCase().includes(normalized)
        );
        setApiSearchResults(filtered as Array<Movie | APIMovie>);
      })
      .catch((error: any) => {
        if (!isActive) return;
        if (error?.code === 'ERR_CANCELED') {
          return;
        }
        console.error('Error fetching movie search results:', error);
        const message = error?.response?.data?.message || 'Unable to fetch search results. Please try again.';
        setSearchError(message);
        setApiSearchResults([]);
      })
      .finally(() => {
        if (!isActive) return;
        setSearchLoading(false);
      });

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [debouncedSearch]);

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
          if (selectedGenres.length > 0) params.genre = selectedGenres.join(',');
        }
        
        const [moviesRes, moodsRes, genresRes] = await Promise.all([
          api.get(endpoint, { params }),
          currentPage === 1 ? api.get('/api/movies/moods') : Promise.resolve({ data: moods }),
          currentPage === 1 ? api.get('/api/movies/genres') : Promise.resolve({ data: genres })
        ]);

        const fetchedMovies = moviesRes.data.movies || [];
        const total = moviesRes.data.total ?? fetchedMovies.length;
        const pages = moviesRes.data.pages ?? Math.max(1, Math.ceil(total / moviesPerPage));

        setTotalMovies(total);
        setTotalPages(pages);

        if (currentPage > pages && pages > 0) {
          setCurrentPage(pages);
          return;
        }

        setMovies(fetchedMovies);
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
  }, [selectedMood, selectedGenres, currentPage, showTrending]);

  useEffect(() => {
    if (!filterOverlayOpen || (!selectedMood && selectedGenres.length === 0)) {
      return;
    }

    let isActive = true;
    const controller = new AbortController();
    const params: Record<string, unknown> = {
      limit: 60,
      page: 1,
    };

    if (selectedMood) {
      params.mood = selectedMood;
    }

    if (selectedGenres.length > 0) {
  params.genre = selectedGenres.join(',');
    }

    setFilterOverlayLoading(true);
    setFilterOverlayError(null);
    setFilterOverlayResults(movies);

    api.get('/api/movies', {
      params,
      signal: controller.signal,
    })
      .then((response) => {
        if (!isActive) return;
        const results = Array.isArray(response.data?.movies) ? response.data.movies : [];
        setFilterOverlayResults(results);
      })
      .catch((error: any) => {
        if (!isActive) {
          return;
        }

        if (error?.code === 'ERR_CANCELED') {
          return;
        }

        console.error('Error fetching filter overlay movies:', error);
        const message = error?.response?.data?.message || 'Unable to load filtered movies. Please try again.';
        setFilterOverlayError(message);
      })
      .finally(() => {
        if (!isActive) {
          return;
        }
        setFilterOverlayLoading(false);
      });

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [filterOverlayOpen, movies, selectedGenres, selectedMood]);

  const paginationItems = useMemo(() => {
    const MAX_VISIBLE = 5;
    if (totalPages <= 1) {
      return [];
    }

    if (totalPages <= MAX_VISIBLE) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const pages: Array<number | string> = [];
    const halfRange = Math.floor(MAX_VISIBLE / 2);
    let start = Math.max(1, currentPage - halfRange);
    let end = Math.min(totalPages, start + MAX_VISIBLE - 1);

    if (end - start < MAX_VISIBLE - 1) {
      start = Math.max(1, end - MAX_VISIBLE + 1);
    }

    if (start > 1) {
      pages.push(1);
      if (start > 2) {
        pages.push('...');
      }
    }

    for (let page = start; page <= end; page += 1) {
      pages.push(page);
    }

    if (end < totalPages) {
      if (end < totalPages - 1) {
        pages.push('...');
      }
      pages.push(totalPages);
    }

    return pages;
  }, [currentPage, totalPages]);

  const currentRangeStart = useMemo(() => {
    if (totalMovies === 0) return 0;
    return (currentPage - 1) * moviesPerPage + 1;
  }, [currentPage, moviesPerPage, totalMovies]);

  const currentRangeEnd = useMemo(() => {
    if (totalMovies === 0) return 0;
    return Math.min(currentPage * moviesPerPage, totalMovies);
  }, [currentPage, moviesPerPage, totalMovies]);

  const filteredMovies = useMemo<Array<Movie | APIMovie>>(() => {
    if (!debouncedSearch) {
      return movies;
    }

    if (apiSearchResults.length > 0) {
      return apiSearchResults;
    }

    const normalized = debouncedSearch.toLowerCase();
    return movies.filter((movie) => movie.title.toLowerCase().includes(normalized));
  }, [apiSearchResults, debouncedSearch, movies]);

  const prioritizedRecommendedMovies = useMemo(() => {
    if (cfRecommendations?.recommendations && cfRecommendations.recommendations.length > 0) {
      const ordered = new Map<string, APIMovie>();

      (cfRecommendations.recommendations as APIMovie[]).forEach((movie) => {
        ordered.set(movie._id, movie);
      });

      recommendedMovies.forEach((movie) => {
        if (!ordered.has(movie._id)) {
          ordered.set(movie._id, movie);
        }
      });

      return Array.from(ordered.values());
    }

    return recommendedMovies;
  }, [cfRecommendations, recommendedMovies]);

  const filteredRecommendedMovies = useMemo(() => {
    if (!debouncedSearch) {
      return prioritizedRecommendedMovies;
    }

    const normalized = debouncedSearch.toLowerCase();
    return prioritizedRecommendedMovies.filter((movie) => movie.title.toLowerCase().includes(normalized));
  }, [debouncedSearch, prioritizedRecommendedMovies]);

  const searchResults = useMemo(() => {
    if (!debouncedSearch) {
      return [] as Array<Movie | APIMovie>;
    }

    const normalized = debouncedSearch.toLowerCase();
    const baseResults = apiSearchResults.length > 0
      ? apiSearchResults
  : [...filteredRecommendedMovies, ...filteredMovies];

    const seen = new Set<string>();
    const combined: Array<Movie | APIMovie> = [];

    baseResults.forEach((movie) => {
      if (!seen.has(movie._id) && movie.title?.toLowerCase().includes(normalized)) {
        seen.add(movie._id);
        combined.push(movie);
      }
    });

    return combined;
  }, [apiSearchResults, debouncedSearch, filteredRecommendedMovies, filteredMovies]);

  const isSearching = debouncedSearch.length > 0;
  const shouldShowPagination = !isSearching && totalPages > 1;
  const totalSearchMatches = isSearching ? searchResults.length : 0;
  const previewResults = useMemo(() => searchResults.slice(0, 6), [searchResults]);

  useEffect(() => {
    if (!debouncedSearch) {
      setSearchResultsOpen(false);
      setShowSearchOverlay(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    if (!debouncedSearch) {
      return;
    }

    if (searchResults.length === 0 && !searchLoading) {
      setSearchResultsOpen(false);
    }
  }, [debouncedSearch, searchLoading, searchResults]);

  useEffect(() => {
    if (!debouncedSearch || searchLoading || showSearchOverlay) {
      return;
    }

    if (searchResults.length > 0 && !searchResultsOpen) {
      setSearchResultsOpen(true);
    }
  }, [debouncedSearch, searchLoading, searchResults, searchResultsOpen, showSearchOverlay]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setSearchResultsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Fetch personalized recommendations
  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        if (!user) {
          setRecommendedMovies([]);
          setFavorites(new Set());
          setCfRecommendations(null);
          setShowCFSection(false);
          return;
        }
        
        // Fetch both content-based and collaborative filtering recommendations
        const [contentBased, collaborative] = await Promise.all([
          getMovieRecommendations(selectedMood || undefined).catch(err => {
            console.error('Failed to fetch content-based recommendations:', err);
            return { recommendations: [], liked: [] };
          }),
          getCollaborativeMovieRecommendations(30, 20, 2).catch(err => {
            console.error('Failed to fetch collaborative recommendations:', err);
            return {
              recommendations: [],
              neighbors: [],
              source: 'error',
              message: err?.message || 'Unable to load collaborative picks.',
            } as CFRecommendation;
          })
        ]);
        
        console.log('Content-based recommendations:', contentBased);
        console.log('Collaborative filtering recommendations:', collaborative);
        
        // Merge recommendations: prioritize CF recommendations, then content-based
        const cfMovies = Array.isArray(collaborative.recommendations)
          ? (collaborative.recommendations as APIMovie[])
          : [];
        const cbMovies = (contentBased.recommendations as APIMovie[]) || [];
        
        // Combine and deduplicate by movie ID
        const combinedMap = new Map<string, APIMovie>();
        
        // Add CF recommendations first (higher priority)
        cfMovies.forEach(movie => {
          combinedMap.set(movie._id, movie);
        });
        
        // Add content-based recommendations
        cbMovies.forEach(movie => {
          if (!combinedMap.has(movie._id)) {
            combinedMap.set(movie._id, movie);
          }
        });
        
        const mergedRecommendations = Array.from(combinedMap.values());
        console.log('Merged recommendations:', mergedRecommendations.length, 'movies');
        
  setRecommendedMovies(mergedRecommendations);
  setCfRecommendations(collaborative);
        
        // Update favorites set from liked movies in recommendation response
        if (contentBased.liked && Array.isArray(contentBased.liked)) {
          const likedFromContent = contentBased.liked as APIMovie[];
          setLikedMovies(prev => (prev.length > 0 ? prev : likedFromContent));
        }
      } catch (error) {
        console.error('Error fetching recommendations:', error);
        setCfRecommendations(null);
      }
    };

    fetchRecommendations();
  }, [user, selectedMood]); // Re-fetch when user logs in/out or mood changes
  
  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedMood, selectedGenres, showTrending]);

  const fetchCFRecommendations = useCallback(async () => {
    if (!user) {
      return;
    }

    try {
      setLoadingCF(true);
      const [liked, cf] = await Promise.all([
        getLikedMovies(),
        getCollaborativeMovieRecommendations(30, 20, 2),
      ]);

      setLikedMovies(liked);
      setCfRecommendations(cf);
    } catch (error) {
      console.error('Error fetching CF recommendations:', error);
    } finally {
      setLoadingCF(false);
    }
  }, [user]);

  useEffect(() => {
    if (showCFSection) {
      fetchCFRecommendations();
    }
  }, [showCFSection, fetchCFRecommendations]);

  const toggleFavorite = async (movie: APIMovie) => {
    if (!user) {
      console.error('User must be logged in to favorite movies');
      return;
    }

    // Prevent action while favorites are still loading
    if (favoritesLoading) {
      console.log('Favorites still loading, please wait...');
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
        
        // After removing, refresh liked movies
        const liked = await getLikedMovies();
        setLikedMovies(liked);
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
          itemType: 'Movie',
          interactionType: 'like',
          mood: selectedMood || undefined
        });
        
        // Refresh recommendations after liking
        const recommended = await getMovieRecommendations(selectedMood || undefined);
        setRecommendedMovies((recommended.recommendations as APIMovie[]) || []);
        
        // Refresh liked movies list for display
        const liked = await getLikedMovies();
        setLikedMovies(liked);
        
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
      
      const errorMessage = error.response?.data?.message || error.message;
      
      // Handle "Already in favorites" gracefully - just refresh state
      if (errorMessage?.includes('Already in favorites')) {
        console.log('Movie already in favorites, refreshing state...');
        // Refresh favorites from database to sync state
        try {
          const userFavorites = await getFavorites();
          const favoriteIds = userFavorites
            .filter(fav => fav.itemType === "Movie")
            .map(fav => typeof fav.itemId === 'string' ? fav.itemId : fav.itemId._id);
          setFavorites(new Set(favoriteIds));
          
          const liked = await getLikedMovies();
          setLikedMovies(liked);
        } catch (refreshError) {
          console.error('Error refreshing favorites:', refreshError);
        }
      } else {
        // Show error alert for real errors
        alert(`Failed to ${isCurrentlyFavorite ? 'remove' : 'add'} favorite: ${errorMessage}`);
        
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
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="w-full md:w-auto">
          <h1 className="text-3xl font-bold text-slate-800">Movie Recommendations</h1>
          <p className="text-slate-600 mt-1">Discover movies tailored to your taste</p>
          <div
            className="relative mt-4 w-full max-w-sm"
            ref={searchContainerRef}
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onFocus={() => {
                if (previewResults.length > 0) {
                  setSearchResultsOpen(true);
                }
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  if (searchResults.length > 0) {
                    setShowSearchOverlay(true);
                    setSearchResultsOpen(false);
                  }
                }

                if (event.key === 'ArrowDown' && previewResults.length > 0) {
                  setSearchResultsOpen(true);
                }

                if (event.key === 'Escape') {
                  setSearchResultsOpen(false);
                  setShowSearchOverlay(false);
                }
              }}
              className="w-full rounded-full border border-slate-200 bg-white py-2 pl-9 pr-20 text-sm text-slate-700 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-300"
              placeholder="Search movies by title"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setDebouncedSearch('');
                  setSearchResultsOpen(false);
                  setShowSearchOverlay(false);
                }}
                className="absolute right-16 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (searchResults.length > 0) {
                  setShowSearchOverlay(true);
                  setSearchResultsOpen(false);
                }
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white transition hover:bg-emerald-600"
              disabled={searchResults.length === 0 || searchLoading}
            >
              View
            </button>

            <AnimatePresence>
              {searchResultsOpen && isSearching && (
                <motion.div
                  key="movie-search-dropdown"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
                >
                  {searchLoading ? (
                    <div className="px-4 py-5 text-xs text-slate-500">Searching…</div>
                  ) : searchError ? (
                    <div className="px-4 py-5 text-xs text-rose-500">{searchError}</div>
                  ) : previewResults.length > 0 ? (
                    <ul className="divide-y divide-slate-100">
                      {previewResults.map((movie) => (
                        <li key={movie._id}>
                          <button
                            type="button"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => {
                              setSearchResultsOpen(false);
                              setSelectedMovie(movie);
                              setIsModalOpen(true);
                            }}
                            className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-emerald-50"
                          >
                            <img
                              src={movie.posterUrl}
                              alt={movie.title}
                              className="h-12 w-8 flex-shrink-0 rounded object-cover"
                            />
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-slate-800 line-clamp-1">{movie.title}</p>
                              <p className="text-xs text-slate-500 line-clamp-1">
                                {[movie.genre?.[0], movie.releaseYear].filter(Boolean).join(' • ')}
                              </p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-slate-300" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="px-4 py-5 text-xs text-slate-500">
                      No instant matches. Press Enter to see all results.
                    </div>
                  )}

                  <div className="flex items-center justify-between bg-slate-50 px-3 py-2">
                    <span className="text-[11px] uppercase tracking-wide text-slate-500">
                      {totalSearchMatches} total matches
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchResultsOpen(false);
                        if (searchResults.length > 0) {
                          setShowSearchOverlay(true);
                        }
                      }}
                      className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-100 disabled:text-slate-400 disabled:hover:bg-transparent"
                      disabled={searchResults.length === 0 || searchLoading}
                    >
                      View all
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {isSearching && (
            <p className="mt-2 text-xs text-slate-500">
              {searchLoading
                ? 'Searching…'
                : searchError
                  ? searchError
                  : totalSearchMatches > 0
                    ? `${totalSearchMatches} matches found`
                    : 'No matches yet'}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {user && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowLikedMoviesPage(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border transition ${
                likedMovies.length > 0
                  ? 'border-pink-200 bg-gradient-to-r from-pink-50 to-rose-50 text-pink-700 hover:shadow-md'
                  : 'border-slate-200 bg-slate-100 text-slate-500'
              }`}
              disabled={likedMovies.length === 0}
            >
              <Heart className={`w-5 h-5 ${likedMovies.length > 0 ? 'text-pink-500 fill-pink-500/20' : 'text-slate-400'}`} />
              <span className="text-sm font-semibold">My Liked Movies</span>
              {likedMovies.length > 0 && (
                <span className="text-xs font-medium bg-white/70 px-2 py-0.5 rounded-full border border-pink-200">
                  {likedMovies.length}
                </span>
              )}
            </motion.button>
          )}
          {totalMovies > 0 && (
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-2 rounded-full border border-emerald-200">
              <span className="text-sm font-semibold text-emerald-700">{totalMovies.toLocaleString()} Movies Available</span>
            </div>
          )}
        </div>
      </div>

      {/* Trending Worldwide Button */}
      <div className="flex justify-center gap-4">
        <button
          onClick={() => {
            setShowTrending(!showTrending);
            if (!showTrending) {
              // Clear other filters when enabling trending
              setSelectedMood('');
              setSelectedGenres([]);
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
              <label className="block text-sm font-medium text-slate-700">Favorite Genres</label>
              <p className="mb-2 text-xs text-slate-500">Pick up to two genres. Tap a selected genre to remove it.</p>
              <div className="flex flex-wrap gap-2">
                {genres.map(genre => (
                  <button
                    key={genre}
                    onClick={() => handleGenreToggle(genre)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedGenres.includes(genre)
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
                      {cfRecommendations.neighbors?.length ? (
                        <span className="ml-1">
                          ({cfRecommendations.neighbors.length} similar users found)
                        </span>
                      ) : null}
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
                      {cfRecommendations.source === 'collaborative_filtering' ? '✓ CF Active' : '⚠ Limited Data'}
                    </span>
                  </div>
                )}
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {(cfRecommendations.recommendations as APIMovie[]).map(movie => (
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

      {(selectedMood || selectedGenres.length > 0) && !showTrending && (
        <button
          type="button"
          onClick={() => setFilterOverlayOpen(true)}
          className="bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-lg border border-emerald-200 w-full text-left transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-300"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              <p className="text-slate-700">
                <span className="font-medium">Showing recommendations</span>
                {selectedMood && <span> for when you're feeling {selectedMood.toLowerCase()}</span>}
                {selectedGenres.length > 0 && (
                  <span>
                    {' '}in the {selectedGenres.join(' & ')} genre{selectedGenres.length > 1 ? 's' : ''}
                  </span>
                )}
              </p>
            </div>
            <span className="flex items-center gap-1 text-sm font-semibold text-emerald-700">
              View matches
              <ChevronRight className="h-4 w-4" />
            </span>
          </div>
        </button>
      )}

      {/* Personalized Recommendations Section */}
      {!showTrending && (isSearching ? filteredRecommendedMovies.length > 0 : prioritizedRecommendedMovies.length > 0) && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <Zap className="w-6 h-6 text-purple-600" />
                <h2 className="text-2xl font-bold text-slate-800">Recommended for You</h2>
                {cfRecommendations?.source && (
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                      cfRecommendations.source === 'collaborative_filtering'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {cfRecommendations.source === 'collaborative_filtering'
                      ? 'Similar Users'
                      : cfRecommendations.source === 'fallback_content_based'
                        ? 'Personal Mix'
                        : 'Needs Data'}
                  </span>
                )}
              </div>
              <p className="text-slate-600">
                {cfRecommendations?.source === 'collaborative_filtering'
                  ? 'Powered by people who enjoy the same films you do.'
                  : 'Based on your likes and the moods or genres you pick.'}
                {selectedMood ? ` When you're feeling ${selectedMood.toLowerCase()}.` : ''}
              </p>
              {cfRecommendations?.source !== 'collaborative_filtering' && cfRecommendations?.message && (
                <p className="mt-1 text-xs text-slate-500">{cfRecommendations.message}</p>
              )}
            </div>
            {cfRecommendations?.recommendations && cfRecommendations.recommendations.length > 0 && (
              <button
                type="button"
                onClick={() => setShowCFSection((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-full border border-purple-200 px-4 py-2 text-sm font-semibold text-purple-700 transition hover:shadow-sm"
              >
                {showCFSection ? 'Hide similar-user insight' : 'See similar-user insight'}
                <ChevronRight
                  className={`h-4 w-4 transition-transform ${showCFSection ? 'rotate-90' : ''}`}
                />
              </button>
            )}
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredRecommendedMovies.slice(0, 8).map((movie: APIMovie) => (
              <div 
                key={movie._id} 
                className="bg-white rounded-xl shadow-sm border border-purple-200 overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer"
                onClick={() => {
                  setSelectedMovie(movie);
                  setIsModalOpen(true);
                }}
              >
                <div className="relative h-56 overflow-hidden bg-slate-200">
                  <img
                    src={movie.posterUrl}
                    alt={movie.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(movie);
                    }}
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
      {!showTrending && (isSearching ? filteredRecommendedMovies.length > 0 : prioritizedRecommendedMovies.length > 0) && (
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
            {filteredMovies.map((movie) => (
              <div 
                key={movie._id} 
                className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer"
                onClick={() => {
                  setSelectedMovie(movie);
                  setIsModalOpen(true);
                }}
              >
                <div className="relative h-56 overflow-hidden bg-slate-200">
                  <img
                    src={movie.posterUrl}
                    alt={movie.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(movie);
                    }}
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
          {!loading && shouldShowPagination && (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-full border border-slate-200">
                <span className="text-sm text-slate-600">
                  Showing {currentRangeStart.toLocaleString()}-{currentRangeEnd.toLocaleString()} of {totalMovies.toLocaleString()} movies
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className={`w-10 h-10 rounded-full flex items-center justify-center border transition ${
                    currentPage === 1
                      ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-400 hover:text-emerald-600'
                  }`}
                  aria-label="Previous page"
                >
                  {'<'}
                </button>
                {paginationItems.map((item, index) =>
                  typeof item === 'number' ? (
                    <button
                      key={`page-${item}`}
                      onClick={() => setCurrentPage(item)}
                      className={`min-w-[2.5rem] h-10 px-3 rounded-full text-sm font-medium transition ${
                        currentPage === item
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md'
                          : 'bg-white text-slate-700 border border-slate-200 hover:border-emerald-400 hover:text-emerald-600'
                      }`}
                      aria-current={currentPage === item ? 'page' : undefined}
                    >
                      {item}
                    </button>
                  ) : (
                    <span key={`ellipsis-${index}`} className="px-1 text-slate-400">
                      {item}
                    </span>
                  )
                )}
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className={`w-10 h-10 rounded-full flex items-center justify-center border transition ${
                    currentPage === totalPages
                      ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-400 hover:text-emerald-600'
                  }`}
                  aria-label="Next page"
                >
                  {'>'}
                </button>
              </div>
            </div>
          )}

          {filteredMovies.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-500">
                {isSearching
                  ? 'No movies match your search. Try another movie title.'
                  : 'No movies found matching your preferences. Try adjusting your filters.'}
              </p>
            </div>
          )}
        </>
      )}

      {/* Movie Detail Modal */}
      {selectedMovie && (
        <MovieDetailModal
          movie={selectedMovie}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedMovie(null);
          }}
        />
      )}

      <AnimatePresence>
        {filterOverlayOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4"
            onClick={() => setFilterOverlayOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(event) => event.stopPropagation()}
              className="flex h-[80vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-emerald-200 bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Filtered Recommendations</h2>
                  <p className="text-sm text-slate-600">
                    {(selectedMood || selectedGenres.length > 0) ? (
                      <>
                        {selectedMood && (
                          <span>
                            Mood: <span className="font-semibold text-emerald-600">{selectedMood}</span>
                          </span>
                        )}
                        {selectedMood && selectedGenres.length > 0 && <span className="mx-2 text-slate-400">•</span>}
                        {selectedGenres.length > 0 && (
                          <span>
                            Genre{selectedGenres.length > 1 ? 's' : ''}: <span className="font-semibold text-emerald-600">{selectedGenres.join(' & ')}</span>
                          </span>
                        )}
                      </>
                    ) : (
                      'Select a mood or up to two genres to see tailored movies.'
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-600">
                    {filterOverlayLoading ? 'Loading…' : `${filterOverlayResults.length} matches`}
                  </span>
                  <button
                    type="button"
                    onClick={() => setFilterOverlayOpen(false)}
                    className="rounded-full border border-emerald-200 bg-white/80 p-2 text-emerald-600 transition hover:bg-white"
                    aria-label="Close filter overlay"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {filterOverlayLoading ? (
                  <div className="flex h-full flex-col items-center justify-center text-sm text-slate-500">
                    Loading filtered movies…
                  </div>
                ) : filterOverlayError ? (
                  <div className="flex h-full flex-col items-center justify-center text-center text-rose-500">
                    <Sparkles className="mb-4 h-10 w-10 text-rose-300" />
                    <p className="text-sm">{filterOverlayError}</p>
                  </div>
                ) : filterOverlayResults.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filterOverlayResults.map((movie) => {
                      const releaseYear = (movie as any).releaseYear ?? '';
                      const genres = Array.isArray((movie as any).genre) ? (movie as any).genre.slice(0, 3) : [];
                      const overview = (movie as any).overview ?? '';
                      const rating = (movie as any).rating ?? null;
                      const posterUrl = (movie as any).posterUrl ?? '/placeholder-movie.png';

                      return (
                        <motion.button
                          key={movie._id}
                          type="button"
                          whileHover={{ translateY: -4 }}
                          className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition hover:shadow-lg"
                          onClick={() => {
                            setFilterOverlayOpen(false);
                            setSelectedMovie(movie);
                            setIsModalOpen(true);
                          }}
                        >
                          <div className="relative h-56 bg-slate-200">
                            <img
                              src={posterUrl}
                              alt={(movie as any).title}
                              className="h-full w-full object-cover"
                            />
                            {rating !== null && (
                              <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-slate-900/80 px-2 py-1 text-xs text-white">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                {rating}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-1 flex-col gap-3 p-4">
                            <div>
                              <div className="flex items-start justify-between gap-2">
                                <h3 className="text-base font-semibold text-slate-800 line-clamp-2">{(movie as any).title}</h3>
                                {releaseYear && <span className="text-xs text-slate-500 whitespace-nowrap">{releaseYear}</span>}
                              </div>
                              {genres.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {genres.map((genre: string) => (
                                    <span key={genre} className="text-[11px] px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full">
                                      {genre}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <p className="text-sm text-slate-600 line-clamp-3">{overview}</p>
                            <div className="mt-auto flex items-center justify-between text-xs text-slate-500">
                              <span>Tap to open details</span>
                              <ChevronRight className="h-4 w-4" />
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center text-center text-slate-500">
                    <Sparkles className="mb-4 h-10 w-10 text-emerald-300" />
                    <p className="text-sm">No movies match your current mood and genre selection yet.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Overlay */}
      <AnimatePresence>
        {showSearchOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4"
            onClick={() => setShowSearchOverlay(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(event) => event.stopPropagation()}
              className="flex h-[80vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-emerald-200 bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Search Results</h2>
                  <p className="text-sm text-slate-600">
                    {debouncedSearch ? (
                      <>
                        Showing matches for <span className="font-semibold text-emerald-600">{debouncedSearch}</span>
                        <span className="ml-2 rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-600">
                          Title
                        </span>
                      </>
                    ) : (
                      'Enter a movie title to start searching'
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-600">
                    {searchLoading ? 'Searching…' : `${totalSearchMatches} matches`}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowSearchOverlay(false)}
                    className="rounded-full border border-emerald-200 bg-white/80 p-2 text-emerald-600 transition hover:bg-white"
                    aria-label="Close search overlay"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {searchLoading ? (
                  <div className="flex h-full flex-col items-center justify-center text-sm text-slate-500">
                    Searching…
                  </div>
                ) : searchError ? (
                  <div className="flex h-full flex-col items-center justify-center text-center text-rose-500">
                    <Search className="mb-4 h-10 w-10 text-rose-300" />
                    <p className="text-sm">{searchError}</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {searchResults.map((movie) => (
                      <motion.button
                        key={movie._id}
                        type="button"
                        whileHover={{ translateY: -4 }}
                        className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition hover:shadow-lg"
                        onClick={() => {
                          setShowSearchOverlay(false);
                          setSelectedMovie(movie);
                          setIsModalOpen(true);
                        }}
                      >
                        <div className="relative h-56 bg-slate-200">
                          <img
                            src={movie.posterUrl}
                            alt={movie.title}
                            className="h-full w-full object-cover"
                          />
                          <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-slate-900/80 px-2 py-1 text-xs text-white">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            {movie.rating}
                          </div>
                        </div>
                        <div className="flex flex-1 flex-col gap-3 p-4">
                          <div>
                            <h3 className="text-base font-semibold text-slate-800 line-clamp-2">{movie.title}</h3>
                            <p className="text-xs text-slate-500">
                              {[movie.releaseYear, movie.genre?.slice(0, 2).join(', ')].filter(Boolean).join(' • ')}
                            </p>
                          </div>
                          <p className="text-sm text-slate-600 line-clamp-3">{movie.overview}</p>
                          <div className="mt-auto flex items-center justify-between text-xs text-slate-500">
                            <span>Tap to open details</span>
                            <ChevronRight className="h-4 w-4" />
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center text-center text-slate-500">
                    <Search className="mb-4 h-10 w-10 text-slate-300" />
                    <p className="text-sm">No matches yet. Try refining your search terms.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Liked Movies Overlay */}
      <AnimatePresence>
        {showLikedMoviesPage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowLikedMoviesPage(false)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.92, y: 20, opacity: 0 }}
              onClick={(event) => event.stopPropagation()}
              className="bg-white rounded-3xl w-full max-w-6xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-pink-50 to-rose-50">
                <div className="flex items-center gap-3">
                  <Heart className="w-6 h-6 text-pink-500 fill-pink-500/30" />
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">My Liked Movies</h2>
                    <p className="text-sm text-slate-600">Your personal list of favorite picks</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowLikedMoviesPage(false)}
                  className="p-2 rounded-full bg-white/80 hover:bg-white transition-colors border border-slate-200"
                  aria-label="Close liked movies"
                >
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {likedMovies.length > 0 ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {likedMovies.map((movie) => (
                      <motion.div
                        key={movie._id}
                        whileHover={{ translateY: -6 }}
                        className="bg-gradient-to-br from-white to-slate-50 border border-pink-100 rounded-2xl shadow-sm overflow-hidden group cursor-pointer"
                        onClick={() => {
                          setShowLikedMoviesPage(false);
                          setSelectedMovie(movie);
                          setIsModalOpen(true);
                        }}
                      >
                        <div className="relative h-56 bg-slate-200 overflow-hidden">
                          <img
                            src={movie.posterUrl}
                            alt={movie.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              toggleFavorite(movie);
                            }}
                            className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors shadow"
                            aria-label={`Remove ${movie.title} from favorites`}
                          >
                            <Heart className="w-5 h-5 fill-red-500 text-red-500" />
                          </button>
                          <div className="absolute bottom-3 left-3 flex items-center space-x-1 bg-slate-900/80 backdrop-blur-sm px-2 py-1 rounded">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-white text-sm font-medium">{movie.rating}</span>
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="text-base font-semibold text-slate-800 line-clamp-2" title={movie.title}>
                            {movie.title}
                          </h3>
                          <div className="flex items-center justify-between mt-2 text-sm text-slate-500">
                            <span>{movie.releaseYear}</span>
                            {movie.genre && movie.genre.length > 0 && (
                              <span className="text-xs px-2 py-0.5 bg-pink-100 text-pink-700 rounded-full">
                                {movie.genre[0]}
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center text-slate-500">
                    <Heart className="w-12 h-12 text-slate-300 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-700 mb-1">You haven't liked any movies yet</h3>
                    <p className="text-sm max-w-md">
                      Explore the catalog and tap the heart icon on movies you enjoy to build your personalized collection.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
