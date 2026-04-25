const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/asistenciaController');
const { verificarToken, verificarRol } = require('../middleware/authMiddleware');
const { ROLES } = require('../utils/constants');

router.use(verificarToken);
router.use(verificarRol(ROLES.SUPER_ADMIN, ROLES.DOCENTE));

router.get('/sesion', ctrl.obtenerSesion);
router.post('/manual', ctrl.registrarManual);
router.post('/qr', ctrl.registrarPorQr);
router.put('/registro/:id', ctrl.editarRegistro);
router.get('/historial/:idCurso', ctrl.obtenerHistorial);

module.exports = router;
