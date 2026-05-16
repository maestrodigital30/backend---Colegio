// routes/avatarCatalogoRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/avatarCatalogoController');
const { verificarToken, verificarRol } = require('../middleware/authMiddleware');
const { uploaderImagen } = require('../utils/uploadHelper');
const { SUBDIRS_WASABI, ROLES } = require('../utils/constants');

const upload = uploaderImagen(SUBDIRS_WASABI.AVATARES);

router.use(verificarToken);
router.get('/', ctrl.listar);
router.get('/default/:tipo', ctrl.obtenerDefault);
router.post('/', verificarRol(ROLES.SUPER_ADMIN), upload.single('archivo'), ctrl.crear);
router.put('/:id', verificarRol(ROLES.SUPER_ADMIN), upload.single('archivo'), ctrl.actualizar);
router.delete('/:id', verificarRol(ROLES.SUPER_ADMIN), ctrl.eliminar);

module.exports = router;
