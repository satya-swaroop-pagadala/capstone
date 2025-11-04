import express from "express";
import cors from "cors";
import path from "path";

const app = express();
app.use(cors());
app.use(express.json());

// --- API Routes ---
const movies = [
  { id: 1, title: "Inception", genre: "Sci-Fi", rating: 8.8 },
  { id: 2, title: "Interstellar", genre: "Sci-Fi", rating: 8.6 },
  { id: 3, title: "The Dark Knight", genre: "Action", rating: 9.0 },
];

app.get("/api/movies", (_req, res) => res.json(movies));

// --- Serve React Frontend ---
const clientDist = path.join(__dirname, "../client/dist");
app.use(express.static(clientDist));

// ✅ FIX HERE
app.get("/.*/", (_req, res) => {
  res.sendFile(path.join(clientDist, "index.html"));
});

const PORT = 5000;
app.listen(PORT, () =>
  console.log(`✅ Server running on http://localhost:${PORT}`)
);

