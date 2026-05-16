// routes/temaVisualRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/temaVisualController');
const { verificarToken, verificarRol } = require('../middleware/authMiddleware');
const { ROLES } = require('../utils/constants');

router.use(verificarToken);
router.get('/', ctrl.listar);
router.get('/codigo/:codigo', ctrl.obtenerPorCodigo);
router.put('/:id', verificarRol(ROLES.SUPER_ADMIN), ctrl.actualizarConfig);

module.exports = router;
