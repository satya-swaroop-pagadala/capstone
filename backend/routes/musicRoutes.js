import express from "express";
import {
  getMusic,
  getMusicById,
  createMusic,
  updateMusic,
  deleteMusic,
  getMusicByArtist,
  getAllArtists,
  getAllGenres,
} from "../controllers/musicController.js";

const router = express.Router();

router.route("/").get(getMusic).post(createMusic);
router.route("/artists/all").get(getAllArtists);
router.route("/genres/all").get(getAllGenres);
router.route("/artist/:artist").get(getMusicByArtist);
router.route("/:id").get(getMusicById).put(updateMusic).delete(deleteMusic);

export default router;
