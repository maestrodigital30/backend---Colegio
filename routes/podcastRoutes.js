const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const ctrl = require('../controllers/podcastController');
const { verificarToken, verificarRol } = require('../middleware/authMiddleware');
const { ROLES } = require('../utils/constants');
const { createMulterStorage } = require('../utils/storage');

const upload = multer({
  storage: createMulterStorage('podcasts'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/jpeg|jpg|png|webp/.test(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, webp)'));
    }
  },
});

// Todas las rutas requieren autenticacion
router.use(verificarToken);

// --- Config (logo) --- acceso lectura para todos, escritura solo admin
router.get('/config', ctrl.obtenerConfig);
router.post('/config/logo', verificarRol(ROLES.SUPER_ADMIN), upload.single('logo'), ctrl.subirLogo);
router.delete('/config/logo', verificarRol(ROLES.SUPER_ADMIN), ctrl.quitarLogo);

// --- Categorias --- lectura para todos, escritura solo admin
router.get('/categorias', ctrl.obtenerCategorias);
router.post('/categorias', verificarRol(ROLES.SUPER_ADMIN), ctrl.crearCategoria);
router.put('/categorias/:id', verificarRol(ROLES.SUPER_ADMIN), ctrl.actualizarCategoria);
router.delete('/categorias/:id', verificarRol(ROLES.SUPER_ADMIN), ctrl.inactivarCategoria);

// --- Entradas --- lectura para todos, escritura solo admin
router.get('/', ctrl.obtenerTodos);
router.get('/:id', ctrl.obtenerPorId);
router.post('/', verificarRol(ROLES.SUPER_ADMIN), ctrl.crear);
router.put('/:id', verificarRol(ROLES.SUPER_ADMIN), ctrl.actualizar);
router.delete('/:id', verificarRol(ROLES.SUPER_ADMIN), ctrl.inactivar);

module.exports = router;
