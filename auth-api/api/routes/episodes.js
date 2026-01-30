const express = require("express");
const router = express.Router();

const authMiddleware = require('../middlewares/middleware');
const { getActiveEpisodesFull } = require("../controllers/episodes-controller");

// GET /api/episodes/active/full
// Protegida por JWT
//router.get("/active/full", authMiddleware, getActiveEpisodesFull);
router.get("/", authMiddleware, getActiveEpisodesFull);

module.exports = router;
