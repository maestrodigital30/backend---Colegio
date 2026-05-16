// routes/identidadVisualRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/identidadVisualController');
const { verificarToken, verificarRol } = require('../middleware/authMiddleware');
const { ROLES } = require('../utils/constants');

router.use(verificarToken);
router.get('/mi-identidad', verificarRol(ROLES.ALUMNO), ctrl.obtener);
router.put('/mi-identidad', verificarRol(ROLES.ALUMNO), ctrl.guardar);
router.get('/alumno/:idAlumno', verificarRol(ROLES.SUPER_ADMIN, ROLES.DOCENTE), ctrl.obtener);

module.exports = router;
