const express = require('express');
const router = express.Router();
const { login } = require('../controllers/authController');
const configuracionController = require('../controllers/configuracionController');

router.post('/login', login);
// Configuración pública (para mostrar nombre y logo en login)
router.get('/configuracion-publica', configuracionController.obtener);

module.exports = router;
