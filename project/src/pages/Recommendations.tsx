import { useEffect, useState } from "react";
import axios from "axios";

interface Movie {
  _id: string;
  title: string;
  genre?: string[];
  posterUrl?: string;
  rating?: number;
  overview?: string;
}

interface Music {
  _id: string;
  title: string;
  artist?: string;
  genre?: string;
  coverUrl?: string;
  album?: string;
}

interface RecommendationsData {
  success: boolean;
  movies: Movie[];
  music: Music[];
  totalRecommendations: number;
}

interface RecommendationsProps {
  userId: string;
}

function Recommendations({ userId }: RecommendationsProps) {
  const [data, setData] = useState<RecommendationsData>({
    success: false,
    movies: [],
    music: [],
    totalRecommendations: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(`/api/recommendations/user/${userId}`);
        setData(response.data);
      } catch (err) {
        console.error("Error fetching recommendations:", err);
        setError("Failed to load recommendations. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchRecommendations();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading recommendations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">
        Recommended for You
      </h2>
      
      {data.totalRecommendations === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <p className="text-yellow-800">
            No recommendations available yet. Like some movies or music to get personalized recommendations!
          </p>
        </div>
      ) : (
        <>
          {/* Movies Section */}
          {data.movies.length > 0 && (
            <div className="mb-8">
              <h3 className="text-2xl font-semibold mb-4 text-gray-700">
                Movies ({data.movies.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {data.movies.map((movie) => (
                  <div
                    key={movie._id}
                    className="bg-white p-4 shadow-lg rounded-lg hover:shadow-xl transition-shadow duration-300"
                  >
                    {movie.posterUrl && (
                      <img
                        src={movie.posterUrl}
                        alt={movie.title}
                        className="w-full h-48 object-cover rounded-md mb-3"
                      />
                    )}
                    <h4 className="font-semibold text-lg mb-2 line-clamp-2">
                      {movie.title}
                    </h4>
                    {movie.genre && movie.genre.length > 0 && (
                      <p className="text-sm text-gray-600 mb-2">
                        {movie.genre.join(", ")}
                      </p>
                    )}
                    {movie.rating !== undefined && (
                      <div className="flex items-center">
                        <span className="text-yellow-500 mr-1">⭐</span>
                        <span className="text-sm font-medium">
                          {movie.rating.toFixed(1)}/10
                        </span>
                      </div>
                    )}
                    {movie.overview && (
                      <p className="text-sm text-gray-500 mt-2 line-clamp-3">
                        {movie.overview}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Music Section */}
          {data.music.length > 0 && (
            <div>
              <h3 className="text-2xl font-semibold mb-4 text-gray-700">
                Music ({data.music.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {data.music.map((track) => (
                  <div
                    key={track._id}
                    className="bg-white p-4 shadow-lg rounded-lg hover:shadow-xl transition-shadow duration-300"
                  >
                    {track.coverUrl && (
                      <img
                        src={track.coverUrl}
                        alt={track.title}
                        className="w-full h-48 object-cover rounded-md mb-3"
                      />
                    )}
                    <h4 className="font-semibold text-lg mb-1 line-clamp-2">
                      {track.title}
                    </h4>
                    {track.artist && (
                      <p className="text-sm text-gray-600 mb-2">
                        {track.artist}
                      </p>
                    )}
                    {track.album && (
                      <p className="text-xs text-gray-500 mb-2">
                        Album: {track.album}
                      </p>
                    )}
                    {track.genre && (
                      <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        {track.genre}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Recommendations;
