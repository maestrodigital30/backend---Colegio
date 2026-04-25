const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/whatsappController');
const { verificarToken, verificarRol } = require('../middleware/authMiddleware');
const { ROLES } = require('../utils/constants');

router.use(verificarToken);
router.use(verificarRol(ROLES.SUPER_ADMIN, ROLES.DOCENTE));

router.post('/enviar', ctrl.enviarReporte);
router.get('/historial/:idCurso', ctrl.obtenerHistorial);

module.exports = router;
