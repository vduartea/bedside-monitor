const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/middleware");
const {
  createEpisodeNote,
  getEpisodeNotes,
} = require("../controllers/notes_controller");

// Crear nota clínica para un episodio
// POST /api/notes
router.post("/", authMiddleware, createEpisodeNote);

// Listar notas de un episodio
// GET /api/notes/:episode_id
router.get("/:episode_id", authMiddleware, getEpisodeNotes);

module.exports = router;
