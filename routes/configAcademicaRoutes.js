const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/configAcademicaController');
const { verificarToken, verificarRol } = require('../middleware/authMiddleware');
const { ROLES } = require('../utils/constants');

router.use(verificarToken);
router.use(verificarRol(ROLES.SUPER_ADMIN, ROLES.DOCENTE));

router.get('/curso/:idCurso', ctrl.obtenerEsquema);
router.post('/', ctrl.crearEsquema);
router.put('/:id/formula', ctrl.actualizarFormula);

module.exports = router;
