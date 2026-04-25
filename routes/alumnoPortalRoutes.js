const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/alumnoPortalController');
const { verificarToken, verificarRol } = require('../middleware/authMiddleware');
const { ROLES } = require('../utils/constants');

router.use(verificarToken);
router.use(verificarRol(ROLES.ALUMNO));

router.get('/dashboard', ctrl.dashboard);
router.get('/mis-cursos', ctrl.misCursos);
router.get('/mis-notas', ctrl.misNotas);
router.get('/mis-trivias', ctrl.misTrivias);
router.get('/mis-trivias/:idPartida', ctrl.detalleTrivia);
router.get('/mi-asistencia', ctrl.miAsistencia);
router.get('/mi-carnet', ctrl.miCarnet);
router.get('/mi-perfil', ctrl.miPerfil);
router.put('/cambiar-contrasena', ctrl.cambiarContrasena);

module.exports = router;
