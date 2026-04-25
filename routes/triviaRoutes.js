const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/triviaController');
const { verificarToken, verificarRol } = require('../middleware/authMiddleware');
const { ROLES } = require('../utils/constants');

router.use(verificarToken);
router.use(verificarRol(ROLES.SUPER_ADMIN, ROLES.DOCENTE));

// Temas
router.get('/temas', ctrl.obtenerTemas);
router.post('/temas', ctrl.crearTema);
router.put('/temas/:id', ctrl.actualizarTema);
router.delete('/temas/:id', ctrl.inactivarTema);

// Preguntas
router.get('/preguntas/:idTema', ctrl.obtenerPreguntas);
router.post('/preguntas', ctrl.crearPregunta);
router.put('/preguntas/:id', ctrl.actualizarPregunta);
router.delete('/preguntas/:id', ctrl.inactivarPregunta);

// Partidas
router.post('/partidas', ctrl.crearPartida);
router.get('/partidas/:id', ctrl.obtenerPartida);
router.post('/partidas/:id/iniciar', ctrl.iniciarPartida);
router.post('/partidas/:id/finalizar', ctrl.finalizarPartida);
router.post('/partidas/:id/cancelar', ctrl.cancelarPartida);
router.post('/respuestas', ctrl.registrarRespuesta);
router.get('/partidas/:id/participante/:idParticipante/respuestas', ctrl.obtenerRespuestasParticipante);

// Historial
router.get('/historial', ctrl.obtenerHistorial);

// Ranking
router.get('/ranking/:idCurso', ctrl.obtenerRanking);
router.get('/ranking/:idCurso/alumno/:idAlumno', ctrl.obtenerHistorialAlumno);

module.exports = router;
