import { useState } from 'react';
import { Heart, Play, Filter, Sparkles, Music } from 'lucide-react';

interface Song {
  id: string;
  title: string;
  artist: string;
  genre: string[];
  album: string;
  coverUrl: string;
}

const SAMPLE_MUSIC: Song[] = [
  {
    id: '1',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    genre: ['Pop', 'Synthwave'],
    album: 'After Hours',
    coverUrl: 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  {
    id: '2',
    title: 'Bohemian Rhapsody',
    artist: 'Queen',
    genre: ['Rock', 'Classic Rock'],
    album: 'A Night at the Opera',
    coverUrl: 'https://images.pexels.com/photos/167636/pexels-photo-167636.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  {
    id: '3',
    title: 'Shape of You',
    artist: 'Ed Sheeran',
    genre: ['Pop', 'Dance'],
    album: 'Divide',
    coverUrl: 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  {
    id: '4',
    title: 'Smells Like Teen Spirit',
    artist: 'Nirvana',
    genre: ['Grunge', 'Alternative Rock'],
    album: 'Nevermind',
    coverUrl: 'https://images.pexels.com/photos/1032653/pexels-photo-1032653.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  {
    id: '5',
    title: 'Billie Jean',
    artist: 'Michael Jackson',
    genre: ['Pop', 'R&B'],
    album: 'Thriller',
    coverUrl: 'https://images.pexels.com/photos/2102568/pexels-photo-2102568.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  {
    id: '6',
    title: 'Hotel California',
    artist: 'Eagles',
    genre: ['Rock', 'Classic Rock'],
    album: 'Hotel California',
    coverUrl: 'https://images.pexels.com/photos/164821/pexels-photo-164821.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  {
    id: '7',
    title: 'Levitating',
    artist: 'Dua Lipa',
    genre: ['Pop', 'Dance'],
    album: 'Future Nostalgia',
    coverUrl: 'https://images.pexels.com/photos/1389429/pexels-photo-1389429.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  {
    id: '8',
    title: 'Stairway to Heaven',
    artist: 'Led Zeppelin',
    genre: ['Rock', 'Classic Rock'],
    album: 'Led Zeppelin IV',
    coverUrl: 'https://images.pexels.com/photos/1314410/pexels-photo-1314410.jpeg?auto=compress&cs=tinysrgb&w=400'
  }
];

const MOODS = ['Energetic', 'Chill', 'Happy', 'Melancholic', 'Focused', 'Party'];
const MUSIC_GENRES = ['Pop', 'Rock', 'Hip-Hop', 'Jazz', 'Classical', 'Electronic', 'R&B', 'Alternative'];

const MOOD_GENRE_MAP: Record<string, string[]> = {
  Energetic: ['Electronic', 'Rock', 'Pop', 'Dance', 'Hip-Hop'],
  Chill: ['Jazz', 'Classical', 'Alternative', 'Chill'],
  Happy: ['Pop', 'Dance', 'Electronic'],
  Melancholic: ['Alternative Rock', 'Classic Rock', 'R&B'],
  Focused: ['Classical', 'Jazz'],
  Party: ['Pop', 'Electronic', 'Hip-Hop', 'Dance']
};

export default function MusicPage() {
  const [selectedMood, setSelectedMood] = useState<string>('');
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [playing, setPlaying] = useState<string | null>(null);

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

  const filteredMusic = SAMPLE_MUSIC.filter(song => {
    if (selectedGenre && !song.genre.includes(selectedGenre)) return false;
    if (selectedMood && !song.genre.some(g => (MOOD_GENRE_MAP[selectedMood] || []).includes(g))) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Music Recommendations</h1>
          <p className="text-slate-600 mt-1">Find your next favorite song</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="w-5 h-5 text-teal-600" />
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
                      ? 'bg-teal-500 text-white shadow-md'
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
              {MUSIC_GENRES.map(genre => (
                <button
                  key={genre}
                  onClick={() => setSelectedGenre(genre === selectedGenre ? '' : genre)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedGenre === genre
                      ? 'bg-cyan-500 text-white shadow-md'
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
        <div className="bg-gradient-to-r from-teal-50 to-cyan-50 p-4 rounded-lg border border-teal-200">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-teal-600" />
            <p className="text-slate-700">
              <span className="font-medium">Showing recommendations</span>
              {selectedMood && <span> for when you're feeling {selectedMood.toLowerCase()}</span>}
              {selectedGenre && <span> in the {selectedGenre} genre</span>}
            </p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {filteredMusic.map(song => (
          <div
            key={song.id}
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-all group"
          >
            <div className="flex items-center space-x-4">
              <div className="relative flex-shrink-0">
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-slate-200">
                  <img
                    src={song.coverUrl}
                    alt={song.album}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <button
                  onClick={() => setPlaying(playing === song.id ? null : song.id)}
                  className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/50 transition-colors rounded-lg"
                  aria-label={playing === song.id ? 'Stop playing' : 'Play song'}
                >
                  {playing === song.id ? (
                    <div className="w-6 h-6 flex items-center justify-center">
                      <Music className="w-5 h-5 text-white animate-pulse" />
                    </div>
                  ) : (
                    <Play className="w-6 h-6 text-white fill-white" />
                  )}
                </button>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-slate-800 truncate">{song.title}</h3>
                <p className="text-slate-600">{song.artist}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {song.genre.map(g => (
                    <span key={g} className="text-xs px-2 py-1 bg-teal-50 text-teal-700 rounded-full">
                      {g}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => toggleFavorite(song.id)}
                  className="p-2 hover:bg-slate-50 rounded-full transition-colors"
                  aria-label={favorites.has(song.id) ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Heart
                    className={`w-6 h-6 ${favorites.has(song.id) ? 'fill-red-500 text-red-500' : 'text-slate-400'}`}
                  />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredMusic.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-500">No songs found matching your preferences. Try adjusting your filters.</p>
        </div>
      )}

      {favorites.size > 0 && (
        <div className="bg-gradient-to-br from-pink-50 to-rose-50 p-6 rounded-xl border border-pink-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">Your Favorites</h3>
              <p className="text-slate-600">You have {favorites.size} favorite {favorites.size === 1 ? 'song' : 'songs'}</p>
            </div>
            <Heart className="w-8 h-8 fill-red-500 text-red-500" />
          </div>
        </div>
      )}
    </div>
  );
}
