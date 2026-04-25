const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/triviaPublicaController');
const { verificarTokenTrivia } = require('../middleware/triviaAuthMiddleware');

// Public — no auth required
router.post('/validar-acceso', ctrl.validarAcceso);

// Protected by trivia session token
router.get('/partida', verificarTokenTrivia, ctrl.obtenerPartida);
router.get('/pregunta', verificarTokenTrivia, ctrl.obtenerPregunta);
router.post('/responder', verificarTokenTrivia, ctrl.responder);
router.get('/resultado', verificarTokenTrivia, ctrl.obtenerResultado);
router.get('/ranking', verificarTokenTrivia, ctrl.obtenerRanking);

module.exports = router;
