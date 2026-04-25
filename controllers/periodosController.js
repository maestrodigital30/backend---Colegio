const model = require('../models/periodosModel');
const { registrarAuditoria } = require('../models/auditoriaModel');

const obtenerTodos = async (req, res) => {
  try {
    res.json(await model.obtenerTodos());
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener periodos' });
  }
};

const obtenerPorId = async (req, res) => {
  try {
    const periodo = await model.obtenerPorId(parseInt(req.params.id));
    if (!periodo) return res.status(404).json({ error: 'Periodo no encontrado' });
    res.json(periodo);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener periodo' });
  }
};

const crear = async (req, res) => {
  try {
    const { nombre, fecha_inicio, fecha_fin } = req.body;
    if (!nombre || !fecha_inicio || !fecha_fin) {
      return res.status(400).json({ error: 'Campos obligatorios: nombre, fecha_inicio, fecha_fin' });
    }
    const periodo = await model.crear(req.body, req.user.id);
    await registrarAuditoria({
      id_usuario: req.user.id, nombre_entidad: 'tbl_periodos_escolares', id_entidad: periodo.id,
      tipo_accion: 'crear', datos_nuevos: req.body,
    });
    res.status(201).json(periodo);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al crear periodo' });
  }
};

const actualizar = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const periodo = await model.actualizar(id, req.body, req.user.id);
    await registrarAuditoria({
      id_usuario: req.user.id, nombre_entidad: 'tbl_periodos_escolares', id_entidad: id,
      tipo_accion: 'actualizar', datos_nuevos: req.body,
    });
    res.json(periodo);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al actualizar periodo' });
  }
};

const inactivar = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await model.inactivar(id, req.user.id);
    await registrarAuditoria({
      id_usuario: req.user.id, nombre_entidad: 'tbl_periodos_escolares', id_entidad: id, tipo_accion: 'inactivar',
    });
    res.json({ mensaje: 'Periodo inactivado correctamente' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al inactivar periodo' });
  }
};

const activar = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await model.activar(id, req.user.id);
    await registrarAuditoria({
      id_usuario: req.user.id, nombre_entidad: 'tbl_periodos_escolares', id_entidad: id, tipo_accion: 'activar',
    });
    res.json({ mensaje: 'Periodo activado correctamente' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al activar periodo' });
  }
};

module.exports = { obtenerTodos, obtenerPorId, crear, actualizar, inactivar, activar };
