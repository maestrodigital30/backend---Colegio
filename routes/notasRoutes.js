const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/notasController');
const { verificarToken, verificarRol } = require('../middleware/authMiddleware');
const { ROLES } = require('../utils/constants');

router.use(verificarToken);
router.use(verificarRol(ROLES.SUPER_ADMIN, ROLES.DOCENTE));

router.get('/', ctrl.obtenerNotasCursoBimestre);
router.get('/alumno', ctrl.obtenerNotasAlumno);
router.post('/', ctrl.registrarNotas);
router.delete('/:id', ctrl.inactivarNota);

module.exports = router;
