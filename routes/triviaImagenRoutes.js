// routes/triviaImagenRoutes.js
const express = require('express');
const router = express.Router({ mergeParams: true });
const ctrl = require('../controllers/triviaImagenController');
const { verificarToken, verificarRol } = require('../middleware/authMiddleware');
const { uploaderImagen } = require('../utils/uploadHelper');
const { SUBDIRS_WASABI, ROLES } = require('../utils/constants');

const upload = uploaderImagen(SUBDIRS_WASABI.TRIVIA_IMAGENES);

router.use(verificarToken);
router.get('/partida/:idPartida', ctrl.listar);
router.post('/partida/:idPartida', verificarRol(ROLES.SUPER_ADMIN, ROLES.DOCENTE), upload.single('archivo'), ctrl.subir);
router.delete('/:id', verificarRol(ROLES.SUPER_ADMIN, ROLES.DOCENTE), ctrl.eliminar);

module.exports = router;
