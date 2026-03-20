const express = require('express');
const router = express.Router();
const clinicalFactorsController = require('../controllers/clinical_factors_controller');

// GET: obtener todos los factores clínicos de un episodio
router.get('/episode/:episodeId', clinicalFactorsController.getByEpisodeId);

// POST: crear o actualizar factores clínicos
router.post('/', clinicalFactorsController.upsert);

module.exports = router;