import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Filter, Music, X, Info, Zap, ExternalLink, Search, ChevronRight } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import api, { getMusicRecommendations, trackInteraction, getLikedMusic, type Song as APISong } from '../api/api';
import { useAuth } from '../context/AuthContext';

interface Song {
  _id: string;
  title: string;
  artist: string;
  genre: string;
  album: string;
  coverUrl: string;
  duration: string;
  popularity: number;
  url?: string;
}

export default function MusicPage() {
  const { user } = useAuth();
  const [music, setMusic] = useState<Song[]>([]);
  const [recommendedMusic, setRecommendedMusic] = useState<APISong[]>([]);
  const [artists, setArtists] = useState<string[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [selectedArtist, setSelectedArtist] = useState<string>('');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingLikedMusic, setLoadingLikedMusic] = useState(false);
  const [totalMusic, setTotalMusic] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [likedMusic, setLikedMusic] = useState<APISong[]>([]);
  const [showLikedMusic, setShowLikedMusic] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [searchResultsOpen, setSearchResultsOpen] = useState(false);
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);
  const [apiSearchResults, setApiSearchResults] = useState<Song[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchMode, setSearchMode] = useState<'title' | 'artist'>('title');
  const musicPerPage = 20;

  const getPrimaryGenre = useCallback((genre: unknown): string => {
    if (Array.isArray(genre)) {
      return genre[0] || 'Unknown';
    }
    if (typeof genre === 'string') {
      return genre || 'Unknown';
    }
    return 'Unknown';
  }, []);

  const mapApiSongToSong = useCallback((song: APISong): Song => ({
    _id: song._id,
    title: song.title,
    artist: song.artist,
    genre: getPrimaryGenre((song as any).genre ?? song.genre),
    album: (song as any).album || 'Unknown Album',
    coverUrl: song.coverUrl || '/placeholder-album.png',
    duration: (song as any).duration || '',
    popularity: (song as any).popularity ?? 0,
    url: song.url,
  }), [getPrimaryGenre]);

  const getSearchFieldValue = useCallback((item: Song | APISong) => {
    const source = item as any;
    const candidate = searchMode === 'title' ? source?.title : source?.artist;
    return typeof candidate === 'string' ? candidate.toLowerCase() : '';
  }, [searchMode]);

  const loadLikedMusic = useCallback(async () => {
    if (!user) {
      setLikedMusic([]);
      setShowLikedMusic(false);
      setLoadingLikedMusic(false);
      setFavorites(new Set());
      return;
    }

    try {
      setLoadingLikedMusic(true);
      const liked = await getLikedMusic();
      setLikedMusic(liked);
      setFavorites(new Set(liked.map(item => item._id)));
    } catch (error) {
      console.error('Error loading liked music:', error);
    } finally {
      setLoadingLikedMusic(false);
    }
  }, [user]);

  // Fetch music and artists from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch music with filters and pagination
        const params: any = { 
          limit: musicPerPage,
          page: currentPage
        };
        if (selectedArtist) params.artist = selectedArtist;
        if (selectedGenre) params.genre = selectedGenre;
        
        const shouldFetchArtists = currentPage === 1 && !selectedArtist;

        const [musicRes, artistsRes] = await Promise.all([
          api.get('/api/music', { params }),
          shouldFetchArtists ? api.get('/api/music/artists/all') : Promise.resolve({ data: [] })
        ]);

        const fetchedMusic = musicRes.data.music || [];
        const total = musicRes.data.total ?? fetchedMusic.length;
        const pages = musicRes.data.pages ?? Math.max(1, Math.ceil(total / musicPerPage));

        setTotalMusic(total);
        setTotalPages(pages);

        if (currentPage > pages && pages > 0) {
          setCurrentPage(pages);
          return;
        }

        setMusic(fetchedMusic);

        if (shouldFetchArtists) {
          const artistNames = Array.isArray(artistsRes.data)
            ? artistsRes.data.map((a: any) => a.name)
            : [];
          setArtists(artistNames.slice(0, 30)); // Show top 30 artists
        }
      } catch (error) {
        console.error('Error fetching music data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedArtist, selectedGenre, currentPage]);
  
  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedArtist, selectedGenre]);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [searchQuery, searchMode]);

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

    api.get('/api/music', {
      params: {
        search: debouncedSearch,
        limit: 50,
      },
      signal: controller.signal,
    })
      .then((response) => {
        if (!isActive) return;
        const results = Array.isArray(response.data?.music) ? response.data.music : [];
          const mapped = results.map(mapApiSongToSong);
    const filtered = mapped.filter((song: Song) => getSearchFieldValue(song).includes(normalized));
          setApiSearchResults(filtered);
      })
      .catch((error: any) => {
        if (!isActive) return;
        if (error?.code === 'ERR_CANCELED') {
          return;
        }
        console.error('Error fetching music search results:', error);
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
  }, [debouncedSearch, getSearchFieldValue, mapApiSongToSong]);
  
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
    if (totalMusic === 0) return 0;
    return (currentPage - 1) * musicPerPage + 1;
  }, [currentPage, musicPerPage, totalMusic]);

  const currentRangeEnd = useMemo(() => {
    if (totalMusic === 0) return 0;
    return Math.min(currentPage * musicPerPage, totalMusic);
  }, [currentPage, musicPerPage, totalMusic]);

  const filteredMusic = useMemo<Song[]>(() => {
    if (!debouncedSearch) {
      return music;
    }

    if (apiSearchResults.length > 0) {
      return apiSearchResults;
    }

    const normalized = debouncedSearch.toLowerCase();
    return music.filter((song) => getSearchFieldValue(song).includes(normalized));
  }, [apiSearchResults, debouncedSearch, getSearchFieldValue, music]);

  const filteredRecommendedMusic = useMemo(() => {
    if (!debouncedSearch) {
      return recommendedMusic;
    }

    const normalized = debouncedSearch.toLowerCase();
    return recommendedMusic.filter((song) => getSearchFieldValue(song).includes(normalized));
  }, [debouncedSearch, getSearchFieldValue, recommendedMusic]);

  const isSearching = debouncedSearch.length > 0;
  const searchResults = useMemo(() => {
    if (!debouncedSearch) {
      return [] as Array<Song | APISong>;
    }

    const normalized = debouncedSearch.toLowerCase();
    const baseResults = apiSearchResults.length > 0
      ? apiSearchResults
      : [...filteredRecommendedMusic, ...filteredMusic];

    const seen = new Set<string>();
    const combined: Array<Song | APISong> = [];

    baseResults.forEach((song) => {
      if (!getSearchFieldValue(song).includes(normalized)) {
        return;
      }

      if (!seen.has(song._id)) {
        seen.add(song._id);
        combined.push(song);
      }
    });

    return combined;
  }, [apiSearchResults, debouncedSearch, filteredMusic, filteredRecommendedMusic, getSearchFieldValue]);

  const previewResults = useMemo(() => searchResults.slice(0, 6), [searchResults]);
  const shouldShowPagination = !isSearching && totalPages > 1;
  const totalMusicSearchMatches = isSearching ? searchResults.length : 0;

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

  const resolveSong = useCallback((item: Song | APISong): Song => {
    if ('duration' in item && 'album' in item && typeof item.genre === 'string') {
      return item as Song;
    }
    return mapApiSongToSong(item as APISong);
  }, [mapApiSongToSong]);

  // Fetch personalized music recommendations
  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        if (!user) {
          // Clear recommendations if not logged in
          setRecommendedMusic([]);
          setFavorites(new Set());
          setLikedMusic([]);
          return;
        }
        
        const recommended = await getMusicRecommendations(undefined, 20).catch(err => {
          console.error('Failed to fetch music recommendations:', err);
          return { recommendations: [], liked: [] };
        });
        
        console.log('Music recommendations fetched:', recommended);
        
        setRecommendedMusic((recommended.recommendations as APISong[]) || []);
        
        if (recommended.liked && Array.isArray(recommended.liked) && recommended.liked.length > 0) {
          const likedFromRecommendations = recommended.liked as APISong[];
          setLikedMusic(prev => (prev.length > 0 ? prev : likedFromRecommendations));
          setFavorites(new Set(likedFromRecommendations.map(item => item._id)));
        }
      } catch (error) {
        console.error('Error fetching music recommendations:', error);
      }
    };

    fetchRecommendations();
  }, [user]); // Re-fetch when user logs in/out

  useEffect(() => {
    loadLikedMusic();
  }, [loadLikedMusic]);

  const toggleFavorite = async (id: string, title: string) => {
    const isCurrentlyFavorite = favorites.has(id);
    
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(id)) {
        newFavorites.delete(id);
        toast.success(`Removed "${title}" from favorites`, {
          icon: '💔',
          style: { borderRadius: '12px', background: '#1f2937', color: '#fff' },
        });
      } else {
        newFavorites.add(id);
        toast.success(`Added "${title}" to favorites`, {
          icon: '🎵',
          style: { borderRadius: '12px', background: '#1f2937', color: '#fff' },
        });
      }
      return newFavorites;
    });
    
    // Track interaction with backend
    try {
      await trackInteraction({
        itemId: id,
        itemType: 'Music',
        interactionType: isCurrentlyFavorite ? 'view' : 'like'
      });
      
      // Refresh recommendations after liking/unliking
      if (!isCurrentlyFavorite) {
        const recommended = await getMusicRecommendations(undefined, 20);
        setRecommendedMusic((recommended.recommendations as APISong[]) || []);
      }

      await loadLikedMusic();
    } catch (error) {
      console.error('Error tracking music interaction:', error);
    }
  };

  const MUSIC_GENRES = ['Pop', 'Rock', 'Hip-Hop', 'Jazz', 'Classical', 'Electronic', 'R&B', 'Alternative'];

  const MusicSkeleton = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
      <div className="flex items-center space-x-4">
        <div className="w-20 h-20 skeleton rounded-xl"></div>
        <div className="flex-1 space-y-2">
          <div className="h-5 skeleton w-3/4"></div>
          <div className="h-4 skeleton w-1/2"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-slide-in">
      <Toaster position="top-right" />
      
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
      >
        <div className="w-full md:w-auto">
          <h1 className="text-4xl font-heading bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
            Music Recommendations
          </h1>
          <p className="text-slate-600 mt-2 font-body">Find your next favorite song</p>
          <div
            className="mt-4 w-full max-w-sm"
            ref={searchContainerRef}
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Search by</span>
              <div className="flex rounded-full border border-slate-200 bg-white p-0.5">
                <button
                  type="button"
                  onClick={() => setSearchMode('title')}
                  className={`px-3 py-1 text-xs font-semibold rounded-full transition ${searchMode === 'title' ? 'bg-teal-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
                  aria-pressed={searchMode === 'title'}
                >
                  Title
                </button>
                <button
                  type="button"
                  onClick={() => setSearchMode('artist')}
                  className={`px-3 py-1 text-xs font-semibold rounded-full transition ${searchMode === 'artist' ? 'bg-teal-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
                  aria-pressed={searchMode === 'artist'}
                >
                  Artist
                </button>
              </div>
            </div>
            <div className="relative">
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
                className="w-full rounded-full border border-slate-200 bg-white py-2 pl-9 pr-20 text-sm text-slate-700 shadow-sm focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-300"
                placeholder={searchMode === 'title' ? 'Search music by song title' : 'Search music by artist name'}
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
                  className="absolute right-16 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
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
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-teal-500 px-3 py-1 text-xs font-semibold text-white transition hover:bg-teal-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                disabled={searchResults.length === 0 || searchLoading}
              >
                View
              </button>

              <AnimatePresence>
                {searchResultsOpen && isSearching && (
                  <motion.div
                    key="music-search-dropdown"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
                  >
                    {searchLoading ? (
                      <div className="px-4 py-5 text-xs text-slate-500">Searching…</div>
                    ) : searchError ? (
                      <div className="px-4 py-5 text-xs text-rose-500">{searchError}</div>
                    ) : previewResults.length > 0 ? (
                      <ul className="divide-y divide-slate-100">
                        {previewResults.map((item) => {
                          const title = item.title;
                          const artist = (item as any).artist ?? 'Unknown artist';
                          const coverUrl = (item as any).coverUrl || '/placeholder-album.png';
                          const genre = getPrimaryGenre((item as any).genre ?? item.genre);
                          return (
                            <li key={item._id}>
                              <button
                                type="button"
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => {
                                  setSearchResultsOpen(false);
                                  setShowSearchOverlay(false);
                                  setSelectedSong(resolveSong(item));
                                }}
                                className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-teal-50"
                              >
                                <img
                                  src={coverUrl}
                                  alt={title}
                                  className="h-12 w-12 flex-shrink-0 rounded-xl object-cover"
                                />
                                <div className="flex-1">
                                  <p className="text-sm font-semibold text-slate-800 line-clamp-1">{title}</p>
                                  <p className="text-xs text-slate-500 line-clamp-1">
                                    {[artist, genre].filter(Boolean).join(' • ')}
                                  </p>
                                </div>
                                <ChevronRight className="h-4 w-4 text-slate-300" />
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <div className="px-4 py-5 text-xs text-slate-500">
                        No instant matches. Press Enter to see all results.
                      </div>
                    )}

                    <div className="flex items-center justify-between bg-slate-50 px-3 py-2">
                      <span className="text-[11px] uppercase tracking-wide text-slate-500">
                        {searchLoading ? 'Searching…' : `${totalMusicSearchMatches} total matches`}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchResultsOpen(false);
                          if (searchResults.length > 0) {
                            setShowSearchOverlay(true);
                          }
                        }}
                        className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold text-teal-600 transition hover:bg-teal-100 disabled:text-slate-400 disabled:hover:bg-transparent"
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
          </div>
          {isSearching && (
            <p className="mt-2 text-xs text-slate-500">
              {searchLoading
                ? 'Searching…'
                : searchError
                  ? searchError
                  : totalMusicSearchMatches > 0
                    ? `${totalMusicSearchMatches} matches found`
                    : `No matches yet. Try another ${searchMode === 'title' ? 'song title' : 'artist name'}.`}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {user && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (!likedMusic.length) {
                  loadLikedMusic();
                }
                setShowLikedMusic(true);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border transition ${
                likedMusic.length > 0
                  ? 'border-pink-200 bg-gradient-to-r from-pink-50 to-rose-50 text-pink-700 hover:shadow-md'
                  : 'border-slate-200 bg-slate-100 text-slate-500 cursor-pointer'
              }`}
              disabled={!likedMusic.length && loadingLikedMusic}
            >
              <Heart className={`w-5 h-5 ${likedMusic.length > 0 ? 'text-pink-500 fill-pink-500/20' : 'text-slate-400'}`} />
              <span className="text-sm font-medium">My Liked Music</span>
            </motion.button>
          )}
          <div className="flex items-center space-x-2 bg-gradient-to-r from-teal-50 to-cyan-50 px-4 py-2 rounded-full border border-teal-200">
            <Music className="w-5 h-5 text-teal-600" />
            <span className="text-sm font-medium text-teal-700">{totalMusic > 0 ? `${totalMusic.toLocaleString()} Songs Available` : `${music.length} Songs`}</span>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"
      >
        <div className="flex items-center space-x-2 mb-5">
          <Filter className="w-5 h-5 text-teal-600" />
          <h2 className="text-lg font-semibold text-slate-800">Filter by Preferences</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">Search by Artist</label>
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-2">
              {artists.map((artist, index) => (
                <motion.button
                  key={artist}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedArtist(artist === selectedArtist ? '' : artist)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    selectedArtist === artist
                      ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg shadow-teal-500/30'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {artist}
                </motion.button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">Favorite Genre</label>
            <div className="flex flex-wrap gap-2">
              {MUSIC_GENRES.map((genre, index) => (
                <motion.button
                  key={genre}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedGenre(genre === selectedGenre ? '' : genre)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    selectedGenre === genre
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {genre}
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {(selectedArtist || selectedGenre) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 pt-4 border-t border-slate-200"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-slate-600">Active filters:</span>
              {selectedArtist && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="inline-flex items-center gap-2 bg-teal-100 text-teal-700 px-3 py-1 rounded-lg text-sm font-medium"
                >
                  {selectedArtist}
                  <X className="w-4 h-4 cursor-pointer hover:text-teal-900" onClick={() => setSelectedArtist('')} />
                </motion.span>
              )}
              {selectedGenre && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="inline-flex items-center gap-2 bg-cyan-100 text-cyan-700 px-3 py-1 rounded-lg text-sm font-medium"
                >
                  {selectedGenre}
                  <X className="w-4 h-4 cursor-pointer hover:text-cyan-900" onClick={() => setSelectedGenre('')} />
                </motion.span>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Personalized Music Recommendations Section */}
      {(isSearching ? filteredRecommendedMusic.length > 0 : recommendedMusic.length > 0) && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="space-y-4"
        >
          <div className="flex items-center space-x-3">
            <Zap className="w-6 h-6 text-purple-600" />
            <h2 className="text-2xl font-bold text-slate-800">Recommended for You</h2>
          </div>
          <p className="text-slate-600">Based on music you've liked</p>
          
          <div className="grid grid-cols-1 gap-3">
            {filteredRecommendedMusic.slice(0, 6).map((song: APISong, index: number) => (
              <motion.div
                key={song._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl shadow-sm border border-purple-200 p-4 hover:shadow-md transition-all group"
              >
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <img
                      src={song.coverUrl || '/placeholder-album.png'}
                      alt={song.album}
                      className="w-20 h-20 rounded-xl object-cover shadow-md"
                    />
                    {song.url && (
                      <a
                        href={song.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Open track in a new tab"
                      >
                        <ExternalLink className="w-7 h-7 text-white" />
                      </a>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-slate-800 truncate">{song.title}</h3>
                    <p className="text-sm text-slate-600 truncate">{song.artist}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                        {getPrimaryGenre((song as any).genre ?? song.genre)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedSong(mapApiSongToSong(song))}
                      className="p-2 rounded-full bg-white/60 hover:bg-white transition-colors"
                      aria-label={`View details about ${song.title}`}
                    >
                      <Info className="w-5 h-5 text-slate-600" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleFavorite(song._id, song.title)}
                      className="p-2 rounded-full bg-white/60 hover:bg-white transition-colors"
                      aria-label={favorites.has(song._id) ? `Remove ${song.title} from favorites` : `Add ${song.title} to favorites`}
                    >
                      <Heart
                        className={`w-6 h-6 transition-colors ${
                          favorites.has(song._id) ? 'fill-red-500 text-red-500' : 'text-slate-400'
                        }`}
                      />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Browse All Music Section */}
      {(isSearching ? filteredRecommendedMusic.length > 0 : recommendedMusic.length > 0) && (
        <div className="flex items-center space-x-3">
          <Filter className="w-6 h-6 text-teal-600" />
          <h2 className="text-2xl font-bold text-slate-800">Browse All Music</h2>
        </div>
      )}

      {/* Music List */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="space-y-3"
      >
        {loading ? (
          Array.from({ length: 6 }).map((_, index) => <MusicSkeleton key={index} />)
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredMusic.map((song: Song, index: number) => (
              <motion.div
                key={song._id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className="flex items-center space-x-4">
                  <div className="relative flex-shrink-0">
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-gradient-to-br from-teal-100 to-cyan-100">
                      <img
                        src={song.coverUrl}
                        alt={song.album}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                    {song.url && (
                      <motion.a
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        href={song.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"
                        aria-label="Open track in a new tab"
                      >
                        <ExternalLink className="w-8 h-8 text-white" />
                      </motion.a>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-slate-800 truncate group-hover:text-teal-600 transition-colors">
                      {song.title}
                    </h3>
                    <p className="text-sm text-slate-600 truncate">{song.artist}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      <span className="text-xs px-2 py-0.5 bg-teal-50 text-teal-700 rounded-lg">
                        {getPrimaryGenre(song.genre)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {song.url && (
                      <motion.a
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        href={song.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                        aria-label="Open track in a new tab"
                      >
                        <ExternalLink className="w-5 h-5 text-slate-600" />
                      </motion.a>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setSelectedSong(song)}
                      className="p-2 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                    >
                      <Info className="w-5 h-5 text-slate-600" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => toggleFavorite(song._id, song.title)}
                      className="p-2 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                    >
                      <Heart
                        className={`w-5 h-5 ${favorites.has(song._id) ? 'fill-red-500 text-red-500' : 'text-slate-600'}`}
                      />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </motion.div>

      {/* Pagination - Page Numbers */}
  {!loading && shouldShowPagination && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-3 py-8"
        >
          <div className="flex items-center gap-2 bg-teal-50 px-3 py-2 rounded-full border border-teal-100">
            <span className="text-sm text-teal-700">
              Showing {currentRangeStart.toLocaleString()}-{currentRangeEnd.toLocaleString()} of {totalMusic.toLocaleString()} songs
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`w-10 h-10 rounded-full flex items-center justify-center border transition ${
                currentPage === 1
                  ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-teal-400 hover:text-teal-600'
              }`}
              aria-label="Previous page"
            >
              {'<'}
            </button>
            {paginationItems.map((item, index) =>
              typeof item === 'number' ? (
                <button
                  key={`music-page-${item}`}
                  onClick={() => setCurrentPage(item)}
                  className={`min-w-[2.5rem] h-10 px-3 rounded-full text-sm font-medium transition ${
                    currentPage === item
                      ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-md'
                      : 'bg-white text-slate-700 border border-slate-200 hover:border-teal-400 hover:text-teal-600'
                  }`}
                  aria-current={currentPage === item ? 'page' : undefined}
                >
                  {item}
                </button>
              ) : (
                <span key={`music-ellipsis-${index}`} className="px-1 text-slate-400">
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
                  : 'bg-white text-slate-700 border-slate-200 hover:border-teal-400 hover:text-teal-600'
              }`}
              aria-label="Next page"
            >
              {'>'}
            </button>
          </div>
        </motion.div>
      )}

      {/* No Results */}
      {!loading && filteredMusic.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-16"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-teal-100 rounded-full mb-4">
            <Music className="w-10 h-10 text-teal-600" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-2">No songs found</h3>
          <p className="text-slate-600 mb-6">
            {isSearching
              ? `No tracks match your search. Try another ${searchMode === 'title' ? 'song title' : 'artist name'}.`
              : 'Try adjusting your filters to see more results'}
          </p>
          <button
            onClick={() => {
              setSelectedGenre('');
              setSelectedArtist('');
              setSearchQuery('');
            }}
            className="px-6 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Clear Filters
          </button>
        </motion.div>
      )}

      {/* Song Details Modal */}
      <AnimatePresence>
        {selectedSong && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedSong(null)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl"
            >
              <div className="relative h-64 bg-gradient-to-br from-teal-500 to-cyan-600">
                <img
                  src={selectedSong.coverUrl}
                  alt={selectedSong.album}
                  className="w-full h-full object-cover opacity-50"
                />
                <button
                  onClick={() => setSelectedSong(null)}
                  className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="absolute bottom-4 left-4 right-4">
                  <h2 className="text-3xl font-bold text-white mb-1">{selectedSong.title}</h2>
                  <p className="text-white/90 text-lg">{selectedSong.artist}</p>
                </div>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <p className="text-sm text-slate-600 mb-2">Album</p>
                  <p className="text-lg font-semibold text-slate-800">{selectedSong.album}</p>
                </div>
                <div className="flex flex-wrap gap-2 mb-6">
                  <span className="px-3 py-1 bg-teal-50 text-teal-700 rounded-lg text-sm font-medium">
                    {selectedSong.genre}
                  </span>
                </div>
                <div className="flex gap-3">
                  {selectedSong.url ? (
                    <a
                      href={selectedSong.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      <ExternalLink className="w-5 h-5" />
                      Open Track
                    </a>
                  ) : (
                    <div className="flex-1 px-6 py-3 bg-slate-100 text-slate-500 rounded-xl font-semibold flex items-center justify-center">
                      Link unavailable
                    </div>
                  )}
                  <button
                    onClick={() => toggleFavorite(selectedSong._id, selectedSong.title)}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                      favorites.has(selectedSong._id)
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <Heart className={favorites.has(selectedSong._id) ? 'fill-current' : ''} />
                    {favorites.has(selectedSong._id) ? 'Favorited' : 'Add to Favorites'}
                  </button>
                </div>
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
            className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4"
            onClick={() => setShowSearchOverlay(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(event) => event.stopPropagation()}
              className="flex h-[80vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-teal-200 bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-teal-100 bg-gradient-to-r from-teal-50 to-cyan-50 px-6 py-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Search Results</h2>
                  <p className="text-sm text-slate-600">
                    {debouncedSearch ? (
                      <>
                        Showing matches for <span className="font-semibold text-teal-600">{debouncedSearch}</span>
                        <span className="ml-2 rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-teal-600">
                          {searchMode === 'title' ? 'Title' : 'Artist'}
                        </span>
                      </>
                    ) : (
                      `Enter a song ${searchMode === 'title' ? 'title' : 'artist name'} to start searching`
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-teal-600">
                    {searchLoading ? 'Searching…' : `${totalMusicSearchMatches} matches`}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowSearchOverlay(false)}
                    className="rounded-full border border-teal-200 bg-white/80 p-2 text-teal-600 transition hover:bg-white"
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
                    {searchResults.map((item) => {
                      const song = resolveSong(item);
                      return (
                        <motion.button
                          key={item._id}
                          type="button"
                          whileHover={{ translateY: -4 }}
                          className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition hover:shadow-lg"
                          onClick={() => {
                            setShowSearchOverlay(false);
                            setSelectedSong(song);
                          }}
                        >
                          <div className="relative h-48 bg-slate-200">
                            <img
                              src={song.coverUrl || '/placeholder-album.png'}
                              alt={song.title}
                              className="h-full w-full object-cover"
                            />
                            <div className="absolute bottom-3 left-3 rounded-full bg-slate-900/80 px-2 py-1 text-xs text-white">
                              {song.genre}
                            </div>
                          </div>
                          <div className="flex flex-1 flex-col gap-3 p-4">
                            <div>
                              <h3 className="text-base font-semibold text-slate-800 line-clamp-2">{song.title}</h3>
                              <p className="text-xs text-slate-500 line-clamp-1">{song.artist}</p>
                            </div>
                            <p className="text-sm text-slate-600 line-clamp-3">{song.album}</p>
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
                    <Search className="mb-4 h-10 w-10 text-slate-300" />
                    <p className="text-sm">No matches yet. Try another {searchMode === 'title' ? 'song title' : 'artist name'}.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Liked Music Overlay */}
      <AnimatePresence>
        {showLikedMusic && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowLikedMusic(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              onClick={(event) => event.stopPropagation()}
              className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-pink-50 to-purple-50">
                <div className="flex items-center gap-3">
                  <Heart className="w-6 h-6 text-pink-500 fill-pink-500/30" />
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">My Liked Music</h2>
                    <p className="text-sm text-slate-600">All the tracks you've hearted in one place</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowLikedMusic(false)}
                  className="p-2 rounded-full bg-white/80 hover:bg-white transition-colors border border-slate-200"
                  aria-label="Close liked music"
                >
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {loadingLikedMusic ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                    <Music className="w-10 h-10 mb-3 animate-pulse" />
                    <p>Loading your liked tracks...</p>
                  </div>
                ) : likedMusic.length > 0 ? (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {likedMusic.map((song) => (
                      <motion.div
                        key={song._id}
                        whileHover={{ translateY: -4 }}
                        className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-2xl shadow-sm p-4 flex gap-4"
                      >
                        <div className="relative">
                          <img
                            src={song.coverUrl || '/placeholder-album.png'}
                            alt={song.title}
                            className="w-20 h-20 rounded-xl object-cover shadow-md"
                          />
                          {song.url && (
                            <a
                              href={song.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-xl opacity-0 hover:opacity-100 transition-opacity"
                              aria-label={`Open ${song.title} in new tab`}
                            >
                              <ExternalLink className="w-6 h-6 text-white" />
                            </a>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-slate-800 truncate">{song.title}</h3>
                          <p className="text-sm text-slate-600 truncate">{song.artist}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span className="text-xs px-2 py-1 bg-pink-100 text-pink-700 rounded-full">
                              {getPrimaryGenre((song as any).genre ?? song.genre)}
                            </span>
                            {song.album && (
                              <span className="text-xs text-slate-500 truncate">{song.album}</span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-center gap-2">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setShowLikedMusic(false);
                              setSelectedSong(mapApiSongToSong(song));
                            }}
                            className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"
                            aria-label={`View details about ${song.title}`}
                          >
                            <Info className="w-5 h-5 text-slate-600" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => toggleFavorite(song._id, song.title)}
                            className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"
                            aria-label={`Remove ${song.title} from favorites`}
                          >
                            <Heart className="w-5 h-5 fill-red-500 text-red-500" />
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Heart className="w-12 h-12 text-slate-300 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-700 mb-1">No liked music yet</h3>
                    <p className="text-sm text-slate-500 max-w-sm">
                      Start exploring tracks and tap the heart icon to build your personal liked music collection.
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
