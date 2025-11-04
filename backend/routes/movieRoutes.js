import express from "express";
import {
  getMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie,
  getMoviesByMood,
  getAllMoods,
  getAllGenres,
  getTrendingMovies,
} from "../controllers/movieController.js";

const router = express.Router();

router.route("/").get(getMovies).post(createMovie);
router.route("/trending").get(getTrendingMovies);
router.route("/moods").get(getAllMoods);
router.route("/genres").get(getAllGenres);
router.route("/mood/:mood").get(getMoviesByMood);
router.route("/:id").get(getMovieById).put(updateMovie).delete(deleteMovie);

export default router;
