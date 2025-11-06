import React from 'react';
import { X, Star, Calendar, Film } from 'lucide-react';
import type { Movie } from '../api/api';

interface MovieDetailModalProps {
  movie: Movie;
  isOpen: boolean;
  onClose: () => void;
}

const MovieDetailModal: React.FC<MovieDetailModalProps> = ({ movie, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with poster and title */}
        <div className="relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          
          <div className="flex flex-col md:flex-row gap-6 p-6">
            {/* Poster */}
            <div className="flex-shrink-0">
              <img
                src={movie.posterUrl}
                alt={movie.title}
                className="w-full md:w-64 h-auto rounded-xl shadow-lg object-cover"
              />
            </div>

            {/* Movie Info */}
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-white mb-4">{movie.title}</h2>
              
              {/* Rating and Year */}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1 bg-yellow-500/20 px-3 py-1 rounded-full">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  <span className="text-yellow-500 font-semibold">{movie.rating.toFixed(1)}</span>
                </div>
                
                {movie.releaseYear && (
                  <div className="flex items-center gap-1 bg-blue-500/20 px-3 py-1 rounded-full">
                    <Calendar className="w-5 h-5 text-blue-400" />
                    <span className="text-blue-400 font-semibold">{movie.releaseYear}</span>
                  </div>
                )}
              </div>

              {/* Genres */}
              {movie.genre && movie.genre.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Film className="w-5 h-5 text-purple-400" />
                    <span className="text-gray-400 font-medium">Genres:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {movie.genre.map((g, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Moods */}
              {movie.mood && movie.mood.length > 0 && (
                <div className="mb-4">
                  <span className="text-gray-400 font-medium block mb-2">Moods:</span>
                  <div className="flex flex-wrap gap-2">
                    {movie.mood.map((m, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-pink-500/20 text-pink-300 rounded-full text-sm"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Overview */}
              {movie.overview && (
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-white mb-2">Overview</h3>
                  <p className="text-gray-300 leading-relaxed">{movie.overview}</p>
                </div>
              )}

              {/* Recommendation Score */}
              {movie.recommendationScore !== undefined && (
                <div className="mt-4 p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg border border-purple-500/30">
                  <span className="text-gray-400 text-sm">Recommendation Match:</span>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all"
                        style={{ width: `${movie.recommendationScore * 100}%` }}
                      />
                    </div>
                    <span className="text-white font-semibold">
                      {Math.round(movie.recommendationScore * 100)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetailModal;
