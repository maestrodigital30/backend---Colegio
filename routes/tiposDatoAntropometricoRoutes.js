const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/tiposDatoAntropometricoController');
const { verificarToken, verificarRol } = require('../middleware/authMiddleware');
const { ROLES } = require('../utils/constants');

router.use(verificarToken);

// Lectura: admin y docente (docente lee solo activos para registrar valores en alumnos)
router.get('/', verificarRol(ROLES.SUPER_ADMIN, ROLES.DOCENTE), ctrl.obtenerTodos);
router.get('/:id', verificarRol(ROLES.SUPER_ADMIN, ROLES.DOCENTE), ctrl.obtenerPorId);

// Escritura: solo admin
router.post('/', verificarRol(ROLES.SUPER_ADMIN), ctrl.crear);
router.put('/:id', verificarRol(ROLES.SUPER_ADMIN), ctrl.actualizar);
router.delete('/:id', verificarRol(ROLES.SUPER_ADMIN), ctrl.inactivar);
router.patch('/:id/activar', verificarRol(ROLES.SUPER_ADMIN), ctrl.activar);

module.exports = router;
