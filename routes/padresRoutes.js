const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/padresController');
const { verificarToken, verificarRol } = require('../middleware/authMiddleware');
const { ROLES } = require('../utils/constants');

router.use(verificarToken);
router.use(verificarRol(ROLES.SUPER_ADMIN, ROLES.DOCENTE));

router.get('/', ctrl.obtenerTodos);
router.get('/:id', ctrl.obtenerPorId);
router.post('/', ctrl.crear);
router.put('/:id', ctrl.actualizar);
router.delete('/:id', ctrl.inactivar);
router.patch('/:id/activar', ctrl.activar);
router.post('/:id/vincular-alumno', ctrl.vincularAlumno);

module.exports = router;
