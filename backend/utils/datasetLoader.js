import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, '..', 'data');

const normaliseArray = (value) => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter(Boolean);
  }

  return [String(value).trim()].filter(Boolean);
};

const ensureRating = (rating) => {
  if (typeof rating === 'number' && Number.isFinite(rating)) {
    return rating;
  }

  const parsed = Number(rating);
  return Number.isFinite(parsed) ? parsed : 0;
};

const ensureNumber = (value, fallback) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const computeFallbackPopularity = (rating) => {
  const bounded = Math.max(0, Math.min(10, ensureRating(rating)));
  return Math.round((bounded / 10) * 1000);
};

const computeFallbackVoteCount = (rating) => {
  const bounded = Math.max(0, Math.min(10, ensureRating(rating)));
  return Math.round((bounded / 10) * 500) + 50;
};

const normaliseMovie = (movie, index) => {
  const rating = ensureRating(movie.rating);
  const popularity = ensureNumber(movie.popularity, computeFallbackPopularity(rating));
  const voteCount = ensureNumber(movie.voteCount, computeFallbackVoteCount(rating));
  const releaseYear = ensureNumber(movie.releaseYear, null);
  const id = movie._id || movie.id || `dataset-movie-${index}`;

  return {
    _id: String(id),
    title: movie.title || 'Untitled',
    genre: normaliseArray(movie.genre),
    mood: normaliseArray(movie.mood),
    overview: movie.overview || '',
    releaseYear,
    posterUrl: movie.posterUrl || '',
    rating,
    popularity,
    voteCount,
    recommendationScore: movie.recommendationScore ? ensureNumber(movie.recommendationScore, rating) : undefined,
  };
};

let movieDatasetCache = null;

const loadJsonFile = async (fileName) => {
  try {
    const filePath = path.resolve(dataDir, fileName);
    const raw = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (error) {
    console.error(`Failed to load dataset file: ${fileName}`, error.message);
    return null;
  }
};

export const getMovieDataset = async () => {
  if (movieDatasetCache) {
    return movieDatasetCache;
  }

  const preferredFiles = ['updated_source/movies_updated.json', 'movies_real.json', 'movies.json'];

  for (const candidate of preferredFiles) {
    const payload = await loadJsonFile(candidate);
    if (Array.isArray(payload) && payload.length > 0) {
      movieDatasetCache = payload.map((item, index) => normaliseMovie(item, index));
      return movieDatasetCache;
    }
  }

  movieDatasetCache = [];
  return movieDatasetCache;
};

export const filterMovies = (movies, { genres = [], moods = [], search = '' } = {}) => {
  if (!Array.isArray(movies) || movies.length === 0) {
    return [];
  }

  const loweredGenres = genres.map((item) => item.toLowerCase());
  const loweredMoods = moods.map((item) => item.toLowerCase());
  const loweredSearch = search.trim().toLowerCase();

  return movies.filter((movie) => {
    const genreMatch = loweredGenres.length === 0 || movie.genre.some((genre) => loweredGenres.includes(genre.toLowerCase()));
    const moodMatch = loweredMoods.length === 0 || movie.mood.some((mood) => loweredMoods.includes(mood.toLowerCase()));
    const searchMatch = loweredSearch.length === 0
      || movie.title.toLowerCase().includes(loweredSearch)
      || movie.overview.toLowerCase().includes(loweredSearch);

    return genreMatch && moodMatch && searchMatch;
  });
};

export const paginate = (items, limit, page) => {
  const safeLimit = Math.max(1, parseInt(limit, 10) || 20);
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const start = (safePage - 1) * safeLimit;
  const end = start + safeLimit;

  return {
    page: safePage,
    pages: Math.max(1, Math.ceil(items.length / safeLimit)),
    total: items.length,
    items: items.slice(start, end),
  };
};

export const getDistinctValues = (movies, key) => {
  if (!Array.isArray(movies)) {
    return [];
  }

  const values = new Set();
  movies.forEach((movie) => {
    const collection = Array.isArray(movie[key]) ? movie[key] : normaliseArray(movie[key]);
    collection.forEach((item) => {
      if (item) {
        values.add(item);
      }
    });
  });

  return Array.from(values).sort((a, b) => a.localeCompare(b));
};

export const getTrendingFromDataset = (movies, { years = 3, limit = 50, page = 1 } = {}) => {
  if (!Array.isArray(movies) || movies.length === 0) {
    return { items: [], total: 0, page: 1, pages: 1 };
  }

  const currentYear = new Date().getFullYear();
  const filtered = movies
    .filter((movie) => {
      if (!movie.releaseYear) {
        return false;
      }
      return movie.releaseYear >= currentYear - years;
    })
    .sort((a, b) => {
      if (b.popularity === a.popularity) {
        return b.voteCount - a.voteCount;
      }
      return b.popularity - a.popularity;
    });

  return paginate(filtered, limit, page);
};
