const express = require('express');
const router = express.Router();
const historial = require('../models/concursoHistorialModel');
const { verificarToken, verificarRol } = require('../middleware/authMiddleware');
const { ROLES } = require('../utils/constants');

router.use(verificarToken);
router.use(verificarRol(ROLES.SUPER_ADMIN));

// Historial global (admin) con filtros
router.get('/historial', async (req, res) => {
  try {
    const filtros = {
      id_concurso: req.query.id_concurso ? parseInt(req.query.id_concurso) : null,
      id_usuario: req.query.id_usuario ? parseInt(req.query.id_usuario) : null,
      id_curso: req.query.id_curso ? parseInt(req.query.id_curso) : null,
      desde: req.query.desde || null,
      hasta: req.query.hasta || null,
      puntaje_min: req.query.puntaje_min != null ? parseInt(req.query.puntaje_min) : null,
    };
    res.json(await historial.obtenerHistorial(filtros));
  } catch (error) {
    console.error('Error historial admin:', error);
    res.status(500).json({ error: 'Error al obtener historial' });
  }
});

// Ranking global (admin) por concurso
router.get('/:idConcurso/ranking', async (req, res) => {
  try {
    const filtros = {
      id_concurso: parseInt(req.params.idConcurso),
      id_curso: req.query.id_curso ? parseInt(req.query.id_curso) : null,
    };
    res.json(await historial.obtenerRanking(filtros));
  } catch (error) {
    console.error('Error ranking admin:', error);
    res.status(500).json({ error: 'Error al obtener ranking' });
  }
});

// Detalle de un intento (incluye respuestas y opciones marcadas)
router.get('/intentos/:idIntento/detalle', async (req, res) => {
  try {
    const idIntento = parseInt(req.params.idIntento);
    const detalle = await historial.obtenerDetalleIntento(idIntento);
    if (!detalle) return res.status(404).json({ error: 'Intento no encontrado' });
    res.json(detalle);
  } catch (error) {
    console.error('Error detalle intento admin:', error);
    res.status(500).json({ error: 'Error al obtener detalle del intento' });
  }
});

module.exports = router;
