const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patient_controller');

// Registrar paciente + episodio
router.post('/register', patientController.registerPatientAndEpisode);
router.post('/update', patientController.updatePatientAndEpisode);

module.exports = router;
