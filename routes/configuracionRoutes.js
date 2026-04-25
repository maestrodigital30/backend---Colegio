const express = require('express');
const router = express.Router();
const multer = require('multer');
const ctrl = require('../controllers/configuracionController');
const { verificarToken, verificarRol } = require('../middleware/authMiddleware');
const { ROLES } = require('../utils/constants');
const { createMulterStorage } = require('../utils/storage');

const upload = multer({
  storage: createMulterStorage('logos'),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const uploadFondo = multer({
  storage: createMulterStorage('fondos'),
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.use(verificarToken);
router.use(verificarRol(ROLES.SUPER_ADMIN));

router.get('/', ctrl.obtener);
router.put('/', ctrl.actualizar);
router.post('/logo', upload.single('logo'), ctrl.subirLogo);
router.post('/fondo-login', uploadFondo.single('fondo'), ctrl.subirFondoLogin);
router.delete('/fondo-login', ctrl.eliminarFondoLogin);

module.exports = router;
