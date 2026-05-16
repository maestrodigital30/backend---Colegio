const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/concursoJuegoController');
const { verificarToken, verificarRol } = require('../middleware/authMiddleware');
const { ROLES } = require('../utils/constants');

router.use(verificarToken);
router.use(verificarRol(ROLES.SUPER_ADMIN, ROLES.DOCENTE, ROLES.ALUMNO));

// Listado de concursos jugables
router.get('/disponibles', ctrl.listarDisponibles);

// Mi historial de intentos
router.get('/historial', ctrl.obtenerMiHistorial);

// Ranking por concurso
router.get('/:idConcurso/ranking', ctrl.obtenerRanking);

// Motor de juego — intentos
router.post('/:idConcurso/iniciar', ctrl.iniciar);
router.get('/intentos/:idIntento', ctrl.obtenerDetalle);
router.post('/intentos/:idIntento/comodin', ctrl.aplicarComodin);
router.post('/intentos/:idIntento/responder', ctrl.responder);
router.get('/intentos/:idIntento/bonus', ctrl.obtenerBonus);
router.post('/intentos/:idIntento/bonus/seleccionar', ctrl.seleccionarBonus);
router.post('/intentos/:idIntento/finalizar', ctrl.finalizar);
router.get('/intentos/:idIntento/resultado', ctrl.obtenerResultado);

module.exports = router;
