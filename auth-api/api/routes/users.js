const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users_controller');
const authMiddleware = require('../middlewares/middleware');

// Ruta protegida → requiere token JWT
router.get('/', authMiddleware, usersController.getUsers);

module.exports = router;
