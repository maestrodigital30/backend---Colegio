const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/whatsappController');
const { verificarToken, verificarRol } = require('../middleware/authMiddleware');
const { ROLES } = require('../utils/constants');

router.use(verificarToken);
router.use(verificarRol(ROLES.SUPER_ADMIN, ROLES.DOCENTE));

// Envío individual por curso (legacy)
router.post('/enviar', ctrl.enviarReporte);
router.get('/historial/:idCurso', ctrl.obtenerHistorial);

// Envío masivo por grado/secciones
router.get('/grados-disponibles', ctrl.obtenerGradosDisponibles);
router.post('/preparar-envio-masivo', ctrl.prepararEnvioMasivo);
router.post('/confirmar-envio-masivo', ctrl.confirmarEnvioMasivo);
router.get('/historial-masivo', ctrl.obtenerHistorialMasivo);

module.exports = router;
