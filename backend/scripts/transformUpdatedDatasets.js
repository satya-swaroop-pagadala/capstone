import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dataDir = join(__dirname, "..", "data");
const sourceDir = join(dataDir, "updated_source");

const moviesSourcePath = join(sourceDir, "movies_updated.json");
const musicSourcePath = join(sourceDir, "music_updated.json");

const moviesDestinationPath = join(dataDir, "movies_real.json");
const musicDestinationPath = join(dataDir, "music_real.json");

const CURRENT_YEAR = new Date().getFullYear();

const GENRE_MOOD_MAP = {
  Action: ["Excited", "Adventurous", "Energetic"],
  Adventure: ["Adventurous", "Excited", "Curious"],
  Animation: ["Happy", "Joyful", "Cheerful"],
  Comedy: ["Happy", "Joyful", "Cheerful"],
  Crime: ["Tense", "Mysterious", "Dark"],
  Documentary: ["Thoughtful", "Curious", "Inspired"],
  Drama: ["Emotional", "Thoughtful", "Intense"],
  Family: ["Happy", "Warm", "Joyful"],
  Fantasy: ["Magical", "Adventurous", "Curious"],
  History: ["Thoughtful", "Inspired", "Reflective"],
  Horror: ["Scared", "Tense", "Thrilling"],
  Music: ["Joyful", "Energetic", "Inspired"],
  Mystery: ["Mysterious", "Curious", "Tense"],
  Romance: ["Romantic", "Emotional", "Warm"],
  "Science Fiction": ["Curious", "Excited", "Adventurous"],
  Thriller: ["Tense", "Excited", "Thrilling"],
  War: ["Intense", "Emotional", "Thoughtful"],
  Western: ["Adventurous", "Intense", "Bold"],
};

const capitalize = (value) =>
  typeof value === "string" && value.length
    ? value.charAt(0).toUpperCase() + value.slice(1)
    : value;

const hashValue = (value) => {
  const str = String(value ?? "");
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) + 1;
};

const seededRandom = (seed, offset = 0) => {
  const adjustedSeed = seed + offset * 1013904223;
  const x = Math.sin(adjustedSeed) * 10000;
  return x - Math.floor(x);
};

const randomInRange = (seed, min, max, offset = 0) => {
  if (min >= max) {
    return min;
  }
  return min + seededRandom(seed, offset) * (max - min);
};

const ensureArray = (value) => {
  if (Array.isArray(value)) {
    return value;
  }
  if (value == null) {
    return [];
  }
  return [value];
};

const getMoodsFromGenres = (genres) => {
  const moods = new Set();
  genres.forEach((genre) => {
    const moodsForGenre = GENRE_MOOD_MAP[genre];
    if (moodsForGenre) {
      moodsForGenre.forEach((mood) => moods.add(mood));
    }
  });
  return moods.size > 0 ? Array.from(moods) : ["Neutral"];
};

const formatDuration = (seconds) => {
  const safeSeconds = Math.max(120, Math.min(420, Math.round(seconds)));
  const minutes = Math.floor(safeSeconds / 60);
  const remaining = safeSeconds % 60;
  return `${minutes}:${remaining.toString().padStart(2, "0")}`;
};

const enhanceMovies = (movies) =>
  movies.map((movie, index) => {
    const seed = hashValue(movie.id ?? movie.title ?? index);
    const rawGenres = ensureArray(movie.genre).map((genre) =>
      capitalize(String(genre).trim())
    );
    const parsedRating = Number.parseFloat(movie.rating);
    const rating = Number.isFinite(parsedRating) ? parsedRating : 0;
    const parsedYear = Number.parseInt(movie.releaseYear, 10);
    const releaseYear = Number.isFinite(parsedYear) ? parsedYear : null;
    const recencyBoost = releaseYear
      ? Math.max(0, 35 - Math.min(35, CURRENT_YEAR - releaseYear))
      : 10;
    const randomBoost = randomInRange(seed, 5, 40);
    const popularity = Math.max(
      10,
      Math.round(rating * 95 + recencyBoost + randomBoost)
    );
    const voteCount = Math.max(
      50,
      Math.round(randomInRange(seed, 120, 3800, 17))
    );

    return {
      id: movie.id ?? index + 1,
      title: String(movie.title ?? "Untitled Movie").trim(),
      genre: rawGenres,
      mood: getMoodsFromGenres(rawGenres),
      overview: String(movie.overview ?? "").trim(),
      releaseYear,
      posterUrl: movie.posterUrl ?? "",
      rating: Number.isFinite(rating) ? Number(rating.toFixed(2)) : 0,
      popularity,
      voteCount,
    };
  });

const enhanceMusic = (songs) =>
  songs.map((song, index) => {
    const seed = hashValue(song.id ?? song.title ?? index);
    const genres = ensureArray(song.genre).map((genre) =>
      capitalize(String(genre).trim())
    );
    const primaryGenre = genres[0] ?? "Unknown";
    const popularity = Math.round(randomInRange(seed, 35, 98));
    const durationSeconds = randomInRange(seed, 150, 270, 3);
    const danceability = Number(
      randomInRange(seed, 0.4, 0.95, 5).toFixed(3)
    );
    const energy = Number(randomInRange(seed, 0.35, 0.95, 7).toFixed(3));
    const valence = Number(randomInRange(seed, 0.2, 0.9, 11).toFixed(3));
    const tempo = Number(randomInRange(seed, 70, 180, 13).toFixed(3));

    return {
      id: song.id ?? index + 1,
      title: String(song.title ?? "Untitled Track").trim(),
      artist: String(song.artist ?? "Unknown Artist").trim(),
      genre: primaryGenre,
      album: String(song.album ?? "Unknown Album").trim(),
      url: typeof song.url === "string" ? song.url.trim() : "",
      coverUrl: song.coverUrl ?? "",
      duration: formatDuration(durationSeconds),
      popularity,
      danceability,
      energy,
      valence,
      tempo,
    };
  });

const readJson = (path) => JSON.parse(readFileSync(path, "utf-8"));

const writeJson = (path, data) => {
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, "utf-8");
};

try {
  const sourceMovies = readJson(moviesSourcePath);
  const transformedMovies = enhanceMovies(sourceMovies);
  writeJson(moviesDestinationPath, transformedMovies);

  const sourceMusic = readJson(musicSourcePath);
  const transformedMusic = enhanceMusic(sourceMusic);
  writeJson(musicDestinationPath, transformedMusic);

  console.log(
    `✅ Datasets refreshed successfully! Movies: ${transformedMovies.length.toLocaleString()}, Music: ${transformedMusic.length.toLocaleString()}`
  );
} catch (error) {
  console.error("❌ Failed to transform datasets:", error);
  process.exitCode = 1;
}
