const express = require('express');
const router = express.Router();
const multer = require('multer');
const ctrl = require('../controllers/bibliotecaController');
const { verificarToken, verificarRol } = require('../middleware/authMiddleware');
const { ROLES } = require('../utils/constants');
const { createMulterStorage } = require('../utils/storage');

const upload = multer({
  storage: createMulterStorage('biblioteca'),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB para soportar PPTs grandes
});

// Todas las rutas requieren autenticacion
router.use(verificarToken);

// --- Categorias --- lectura para todos, escritura solo admin
router.get('/categorias', ctrl.obtenerCategorias);
router.post('/categorias', verificarRol(ROLES.SUPER_ADMIN), ctrl.crearCategoria);
router.put('/categorias/:id', verificarRol(ROLES.SUPER_ADMIN), ctrl.actualizarCategoria);
router.delete('/categorias/:id', verificarRol(ROLES.SUPER_ADMIN), ctrl.inactivarCategoria);

// --- Materiales --- lectura para todos, escritura solo admin
router.get('/', ctrl.obtenerTodos);
router.get('/:id', ctrl.obtenerPorId);
router.get('/:id/descargar', ctrl.descargar);
router.post('/', verificarRol(ROLES.SUPER_ADMIN), upload.single('archivo'), ctrl.crear);
router.put('/:id', verificarRol(ROLES.SUPER_ADMIN), ctrl.actualizar);
router.delete('/:id', verificarRol(ROLES.SUPER_ADMIN), ctrl.inactivar);

module.exports = router;
