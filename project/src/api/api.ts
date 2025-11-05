import axios from "axios";

// Use empty string to use Vite proxy, or full URL for direct connection
const API_URL = import.meta.env.VITE_API_URL || "";

console.log('🔗 API URL:', API_URL || 'Using Vite Proxy');

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 second timeout
});

// Add a request interceptor to include the token
api.interceptors.request.use(
  (config) => {
    console.log('📤 API Request:', config.method?.toUpperCase(), config.url);
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('📤 Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => {
    console.log('📥 API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('📥 Response Error:', error);
    if (error.code === 'ERR_NETWORK') {
      console.error('❌ Network Error: Cannot connect to backend at', API_URL || 'relative path');
      console.error('Configured API URL:', API_URL || 'Not set - using relative paths');
    }
    return Promise.reject(error);
  }
);

// ==================== AUTHENTICATION ====================

export interface User {
  _id: string;
  name: string;
  email: string;
  avatar: string;
  isAdmin: boolean;
  token?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  name: string;
  email: string;
  password: string;
}

export const signup = async (credentials: SignupCredentials): Promise<User> => {
  try {
    console.log('API: Sending signup request to:', `${API_URL}/api/auth/signup`);
    console.log('API: Signup credentials:', { ...credentials, password: '***' });
    const response = await api.post("/api/auth/signup", credentials);
    console.log('API: Signup response:', response.data);
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data));
    }
    return response.data;
  } catch (error: any) {
    console.error('API: Signup error:', error);
    console.error('API: Error response:', error.response);
    
    // Handle network errors
    if (error.code === 'ERR_NETWORK' || !error.response) {
      const backendUrl = API_URL || 'backend server';
      throw `Cannot connect to ${backendUrl}. Please check if backend is accessible.`;
    }
    
    const errorMessage = error.response?.data?.message || error.message || "Signup failed";
    throw errorMessage;
  }
};

export const login = async (credentials: LoginCredentials): Promise<User> => {
  try {
    const response = await api.post("/api/auth/login", credentials);
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data));
    }
    return response.data;
  } catch (error: any) {
    throw error.response?.data?.message || "Login failed";
  }
};

export const logout = (): void => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

export const getMe = async (): Promise<User> => {
  try {
    const response = await api.get("/api/auth/me");
    return response.data;
  } catch (error: any) {
    throw error.response?.data?.message || "Failed to get user info";
  }
};

export const updateProfile = async (data: Partial<SignupCredentials>): Promise<User> => {
  try {
    const response = await api.put("/api/auth/profile", data);
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data));
    }
    return response.data;
  } catch (error: any) {
    throw error.response?.data?.message || "Profile update failed";
  }
};

// ==================== MOVIES ====================

export interface Movie {
  _id: string;
  title: string;
  genre: string[];
  mood: string[];
  overview: string;
  releaseYear: number;
  posterUrl: string;
  rating: number;
  recommendationScore?: number; // Score from recommendation algorithms (0-1)
}

export const fetchMovies = async (mood?: string, genre?: string): Promise<Movie[]> => {
  try {
    const params: any = {};
    if (mood) params.mood = mood;
    if (genre) params.genre = genre;

    const response = await api.get("/api/movies", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching movies:", error);
    throw error;
  }
};

export const fetchMovieById = async (id: string): Promise<Movie> => {
  try {
    const response = await api.get(`/api/movies/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching movie:", error);
    throw error;
  }
};

// ==================== MUSIC ====================

export interface Song {
  _id: string;
  title: string;
  artist: string;
  genre: string[];
  mood: string[];
  album: string;
  coverUrl: string;
  duration?: string;
}

export const fetchMusic = async (mood?: string, genre?: string): Promise<Song[]> => {
  try {
    const params: any = {};
    if (mood) params.mood = mood;
    if (genre) params.genre = genre;

    const response = await api.get("/api/music", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching music:", error);
    throw error;
  }
};

export const fetchMusicById = async (id: string): Promise<Song> => {
  try {
    const response = await api.get(`/api/music/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching music:", error);
    throw error;
  }
};

// ==================== FAVORITES ====================

export interface Favorite {
  _id: string;
  userId: string;
  itemId: string | Movie | Song;
  itemType: "Movie" | "Music";
  createdAt: string;
}

export const getFavorites = async (userId: string = "guest"): Promise<Favorite[]> => {
  try {
    const response = await api.get("/api/favorites", { params: { userId } });
    return response.data;
  } catch (error) {
    console.error("Error fetching favorites:", error);
    throw error;
  }
};

export const addFavorite = async (
  itemId: string,
  itemType: "Movie" | "Music",
  userId: string = "guest"
): Promise<Favorite> => {
  try {
    const response = await api.post("/api/favorites", { itemId, itemType, userId });
    return response.data;
  } catch (error) {
    console.error("Error adding favorite:", error);
    throw error;
  }
};

export const removeFavorite = async (id: string): Promise<void> => {
  try {
    await api.delete(`/api/favorites/${id}`);
  } catch (error) {
    console.error("Error removing favorite:", error);
    throw error;
  }
};

export const removeFavoriteByItem = async (
  itemId: string,
  itemType: "Movie" | "Music",
  userId: string = "guest"
): Promise<void> => {
  try {
    await api.delete(`/api/favorites/item/${itemId}`, {
      params: { itemType, userId },
    });
  } catch (error) {
    console.error("Error removing favorite by item:", error);
    throw error;
  }
};

// ==================== HEALTH CHECK ====================

export const checkAPIHealth = async (): Promise<any> => {
  try {
    const response = await api.get("/api/health");
    return response.data;
  } catch (error) {
    console.error("Error checking API health:", error);
    throw error;
  }
};

// ==================== RECOMMENDATIONS ====================

export interface Recommendation {
  recommendations: Movie[] | Song[];
  liked: Movie[] | Song[];
  mood?: string;
}

export const getMovieRecommendations = async (
  mood?: string,
  limit: number = 20
): Promise<Recommendation> => {
  try {
    const params = new URLSearchParams();
    if (mood) params.append("mood", mood);
    params.append("limit", limit.toString());

    const response = await api.get(`/api/recommendations/movies?${params}`);
    return response.data.data;
  } catch (error) {
    console.error("Error getting movie recommendations:", error);
    throw error;
  }
};

export const getMusicRecommendations = async (
  mood?: string,
  limit: number = 20
): Promise<Recommendation> => {
  try {
    const params = new URLSearchParams();
    if (mood) params.append("mood", mood);
    params.append("limit", limit.toString());

    const response = await api.get(`/api/recommendations/music?${params}`);
    return response.data.data;
  } catch (error) {
    console.error("Error getting music recommendations:", error);
    throw error;
  }
};

export interface InteractionData {
  itemId: string;
  itemType: "movie" | "music";
  interactionType: "view" | "like" | "rating" | "favorite";
  rating?: number;
  mood?: string;
  duration?: number;
}

export const trackInteraction = async (data: InteractionData): Promise<any> => {
  try {
    const response = await api.post("/api/recommendations/interact", data);
    return response.data;
  } catch (error) {
    console.error("Error tracking interaction:", error);
    throw error;
  }
};

export const getLikedMovies = async (): Promise<Movie[]> => {
  try {
    const response = await api.get("/api/recommendations/liked/movies");
    return response.data.data;
  } catch (error) {
    console.error("Error getting liked movies:", error);
    throw error;
  }
};

export const getLikedMusic = async (): Promise<Song[]> => {
  try {
    const response = await api.get("/api/recommendations/liked/music");
    return response.data.data;
  } catch (error) {
    console.error("Error getting liked music:", error);
    throw error;
  }
};

// Collaborative Filtering Recommendations
export interface CFRecommendation {
  recommendations: Movie[];
  neighbors: Array<{
    similarity: number;
    overlap: number;
    itemCount?: number;
  }>;
  stats?: {
    totalUsers: number;
    similarUsers: number;
    topKNeighbors: number;
    candidateItems: number;
    targetUserItems: number;
  };
  source?: string;
  reason?: string;
  message?: string;
}

export const getCollaborativeMovieRecommendations = async (
  k: number = 30,
  limit: number = 20,
  minOverlap: number = 2
): Promise<CFRecommendation> => {
  try {
    const params = new URLSearchParams();
    params.append("k", k.toString());
    params.append("limit", limit.toString());
    params.append("minOverlap", minOverlap.toString());

    const response = await api.get(
      `/api/recommendations/collaborative/movies?${params}`
    );
    return response.data.data || response.data;
  } catch (error) {
    console.error("Error getting collaborative movie recommendations:", error);
    throw error;
  }
};

export const getCollaborativeMusicRecommendations = async (
  k: number = 30,
  limit: number = 20,
  minOverlap: number = 2
): Promise<CFRecommendation> => {
  try {
    const params = new URLSearchParams();
    params.append("k", k.toString());
    params.append("limit", limit.toString());
    params.append("minOverlap", minOverlap.toString());

    const response = await api.get(
      `/api/recommendations/collaborative/music?${params}`
    );
    return response.data.data || response.data;
  } catch (error) {
    console.error("Error getting collaborative music recommendations:", error);
    throw error;
  }
};

export default api;
