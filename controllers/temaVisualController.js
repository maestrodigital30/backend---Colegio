// controllers/temaVisualController.js
const model = require('../models/temaVisualModel');
const { registrarAuditoria } = require('../models/auditoriaModel');

const listar = async (_req, res) => {
  try {
    res.json(await model.listar());
  } catch (e) { console.error(e); res.status(500).json({ error: 'Error al listar temas' }); }
};

const obtenerPorCodigo = async (req, res) => {
  try {
    const tema = await model.obtenerPorCodigo(req.params.codigo);
    if (!tema) return res.status(404).json({ error: 'Tema no encontrado' });
    res.json(tema);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Error' }); }
};

const actualizarConfig = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existente = await model.obtenerPorId(id);
    if (!existente) return res.status(404).json({ error: 'No encontrado' });
    const datos = {};
    if (req.body.nombre) datos.nombre = req.body.nombre;
    if (req.body.descripcion !== undefined) datos.descripcion = req.body.descripcion;
    if (req.body.config_json) datos.config_json = req.body.config_json;
    if (req.body.orden != null) datos.orden = parseInt(req.body.orden);
    if (req.body.esta_activo !== undefined) datos.esta_activo = !!req.body.esta_activo;
    const upd = await model.actualizar(id, datos, req.user.id);
    await registrarAuditoria({ id_usuario: req.user.id, nombre_entidad: 'tbl_temas_visuales', id_entidad: id, tipo_accion: 'actualizar', datos_nuevos: datos });
    res.json(upd);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Error al actualizar' }); }
};

module.exports = { listar, obtenerPorCodigo, actualizarConfig };
