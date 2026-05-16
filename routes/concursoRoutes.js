const express = require('express');
const multer = require('multer');
const router = express.Router();
const ctrl = require('../controllers/concursoController');
const { verificarToken, verificarRol } = require('../middleware/authMiddleware');
const { ROLES, CONCURSOS } = require('../utils/constants');
const { createMulterStorage } = require('../utils/storage');

const uploadMultimedia = multer({
  storage: createMulterStorage('concursos'),
  limits: { fileSize: CONCURSOS.MULTIMEDIA_MAX_BYTES },
});

// Todas las rutas admin requieren token + rol Super Admin
router.use(verificarToken);
router.use(verificarRol(ROLES.SUPER_ADMIN));

// CRUD Concursos
router.get('/', ctrl.listar);
router.get('/:id', ctrl.obtenerPorId);
router.post('/', ctrl.crear);
router.put('/:id', ctrl.actualizar);
router.delete('/:id', ctrl.inactivar);
router.patch('/:id/publicar', ctrl.cambiarPublicacion);

// Preguntas
router.get('/:idConcurso/preguntas', ctrl.listarPreguntas);
router.post('/preguntas', ctrl.crearPregunta);
router.put('/preguntas/:id', ctrl.actualizarPregunta);
router.delete('/preguntas/:id', ctrl.inactivarPregunta);
router.patch('/:idConcurso/preguntas/orden', ctrl.reordenarPreguntas);

// Multimedia
router.post('/multimedia/subir', uploadMultimedia.single('archivo'), ctrl.subirMultimedia);
router.delete('/multimedia', ctrl.eliminarMultimedia);

module.exports = router;
