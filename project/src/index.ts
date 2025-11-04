import express from "express";
import cors from "cors";

const app = express();
const PORT = 5000;

// Enable CORS and JSON body parsing
app.use(cors());
app.use(express.json());

// Example movie data
const movies = [
  { id: 1, title: "Inception", genre: "Sci-Fi", rating: 8.8 },
  { id: 2, title: "Interstellar", genre: "Sci-Fi", rating: 8.6 },
  { id: 3, title: "The Dark Knight", genre: "Action", rating: 9.0 },
];

// Example API route to get all movies
app.get("/api/movies", (_req, res) => res.json(movies));

// Health check endpoint
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

// Start the server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
