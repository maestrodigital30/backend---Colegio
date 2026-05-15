const express = require('express');
const router = express.Router({ mergeParams: true });
const ctrl = require('../controllers/datosAntropometricosController');
const { verificarToken, verificarRol } = require('../middleware/authMiddleware');
const { ROLES } = require('../utils/constants');

router.use(verificarToken);
router.use(verificarRol(ROLES.SUPER_ADMIN, ROLES.DOCENTE));

router.get('/:idAlumno/datos-antropometricos', ctrl.obtenerPorAlumno);
router.post('/:idAlumno/datos-antropometricos', ctrl.crear);
router.put('/:idAlumno/datos-antropometricos/:id', ctrl.actualizar);
router.delete('/:idAlumno/datos-antropometricos/:id', ctrl.inactivar);

module.exports = router;
