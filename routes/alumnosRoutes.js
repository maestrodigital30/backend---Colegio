const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const ctrl = require('../controllers/alumnosController');
const { verificarToken, verificarRol } = require('../middleware/authMiddleware');
const { ROLES } = require('../utils/constants');
const { createMulterStorage } = require('../utils/storage');

router.use(verificarToken);
router.use(verificarRol(ROLES.SUPER_ADMIN, ROLES.DOCENTE));

/* ── Multer: fotos de alumnos ── */
const uploadFoto = multer({
  storage: createMulterStorage('alumnos'),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    const permitidos = /jpeg|jpg|png|webp/;
    const extOk = permitidos.test(path.extname(file.originalname).toLowerCase());
    const mimeOk = permitidos.test(file.mimetype);
    cb(null, extOk && mimeOk);
  },
});

/* ── Rutas ── */
router.get('/', ctrl.obtenerTodos);
router.get('/:id', ctrl.obtenerPorId);
router.post('/', ctrl.crear);
router.put('/:id', ctrl.actualizar);
router.delete('/:id', ctrl.inactivar);
router.patch('/:id/activar', ctrl.activar);
router.post('/:id/cursos', ctrl.asignarCursos);
router.post('/:id/regenerar-carnet', ctrl.regenerarCarnetQr);
router.post('/:id/foto', uploadFoto.single('foto'), ctrl.subirFoto);

module.exports = router;
