import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Play, Filter, Music, Pause, X, Info } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import api from '../api/api';

interface Song {
  _id: string;
  title: string;
  artist: string;
  genre: string;
  album: string;
  coverUrl: string;
  duration: string;
  popularity: number;
}

export default function MusicPage() {
  const [music, setMusic] = useState<Song[]>([]);
  const [artists, setArtists] = useState<string[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [selectedArtist, setSelectedArtist] = useState<string>('');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [playing, setPlaying] = useState<string | null>(null);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalMusic, setTotalMusic] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const musicPerPage = 20;

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
        
        const [musicRes, artistsRes] = await Promise.all([
          api.get('/api/music', { params }),
          (currentPage === 1 && !selectedArtist) ? api.get('/api/music/artists/all') : Promise.resolve({ data: [] })
        ]);

        if (currentPage === 1) {
          setMusic(musicRes.data.music || []);
        } else {
          setMusic(prev => [...prev, ...(musicRes.data.music || [])]);
        }
        
        setTotalMusic(musicRes.data.total || 0);
        if (currentPage === 1 && !selectedArtist) {
          // API returns array of objects with 'name' field directly
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

  const toggleFavorite = (id: string, title: string) => {
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
  };

  const togglePlay = (id: string) => {
    setPlaying(playing === id ? null : id);
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
        <div>
          <h1 className="text-4xl font-heading bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
            Music Recommendations
          </h1>
          <p className="text-slate-600 mt-2 font-body">Find your next favorite song</p>
        </div>
        <div className="flex items-center space-x-2 bg-gradient-to-r from-teal-50 to-cyan-50 px-4 py-2 rounded-full border border-teal-200">
          <Music className="w-5 h-5 text-teal-600" />
          <span className="text-sm font-medium text-teal-700">{totalMusic > 0 ? `${totalMusic.toLocaleString()} Songs Available` : `${music.length} Songs`}</span>
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
            {music.map((song, index) => (
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
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => togglePlay(song._id)}
                      className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"
                    >
                      {playing === song._id ? (
                        <Pause className="w-8 h-8 text-white fill-white" />
                      ) : (
                        <Play className="w-8 h-8 text-white fill-white" />
                      )}
                    </motion.button>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-slate-800 truncate group-hover:text-teal-600 transition-colors">
                      {song.title}
                    </h3>
                    <p className="text-sm text-slate-600 truncate">{song.artist}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      <span className="text-xs px-2 py-0.5 bg-teal-50 text-teal-700 rounded-lg">
                        {song.genre}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
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
      {music.length < totalMusic && !loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center items-center space-x-2 py-8"
        >
          <span className="text-sm text-slate-600">
            Showing {music.length} of {totalMusic.toLocaleString()} songs
          </span>
          <span className="text-slate-400">•</span>
          <button
            onClick={() => setCurrentPage(prev => prev + 1)}
            className="px-6 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center gap-2"
          >
            <Music className="w-4 h-4" />
            Page {currentPage + 1}
          </button>
        </motion.div>
      )}

      {/* No Results */}
      {!loading && music.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-16"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-teal-100 rounded-full mb-4">
            <Music className="w-10 h-10 text-teal-600" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-2">No songs found</h3>
          <p className="text-slate-600 mb-6">Try adjusting your filters to see more results</p>
          <button
            onClick={() => {
              setSelectedGenre('');
              setSelectedArtist('');
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
                  <button
                    onClick={() => togglePlay(selectedSong._id)}
                    className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    {playing === selectedSong._id ? (
                      <>
                        <Pause className="w-5 h-5" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5" />
                        Play Now
                      </>
                    )}
                  </button>
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
    </div>
  );
}
