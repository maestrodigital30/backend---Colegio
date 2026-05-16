// routes/musicaCatalogoRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/musicaCatalogoController');
const { verificarToken, verificarRol } = require('../middleware/authMiddleware');
const { uploaderAudio } = require('../utils/uploadHelper');
const { SUBDIRS_WASABI, ROLES } = require('../utils/constants');

const upload = uploaderAudio(SUBDIRS_WASABI.MUSICA_FONDO);

router.use(verificarToken);
router.get('/', ctrl.listar);
router.post('/', verificarRol(ROLES.SUPER_ADMIN), upload.single('archivo'), ctrl.crear);
router.put('/:id', verificarRol(ROLES.SUPER_ADMIN), upload.single('archivo'), ctrl.actualizar);
router.delete('/:id', verificarRol(ROLES.SUPER_ADMIN), ctrl.eliminar);

module.exports = router;
