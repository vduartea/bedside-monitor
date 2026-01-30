const express = require("express");
const router = express.Router();

const { upsertScaleFull, getAllScalesFull } = require("../controllers/scales_controller");

// POST /api/scales
// Crea o actualiza una escala completa (scale + scale_question)
router.post("/", upsertScaleFull);

// GET /api/scales  -> lista todas las escalas con sus preguntas
router.get("/", getAllScalesFull);

module.exports = router;
