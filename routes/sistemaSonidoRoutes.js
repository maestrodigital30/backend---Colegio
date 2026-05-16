const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/sistemaSonidoController');
const { verificarToken, verificarRol } = require('../middleware/authMiddleware');
const { uploaderAudio } = require('../utils/uploadHelper');
const { SUBDIRS_WASABI, ROLES } = require('../utils/constants');

const upload = uploaderAudio(SUBDIRS_WASABI.SISTEMA_SONIDOS);

router.use(verificarToken);
router.get('/', ctrl.listar); // todos los roles autenticados (alumno necesita listarlos para precargar)
router.post('/', verificarRol(ROLES.SUPER_ADMIN), upload.single('archivo'), ctrl.subirSonido);
router.delete('/:id', verificarRol(ROLES.SUPER_ADMIN), ctrl.eliminarSonido);

module.exports = router;
