const model = require('../models/tiposDatoAntropometricoModel');
const { registrarAuditoria } = require('../models/auditoriaModel');
const { ROLES } = require('../utils/constants');

const obtenerTodos = async (req, res) => {
  try {
    if (req.user.rol === ROLES.SUPER_ADMIN) {
      return res.json(await model.obtenerTodos());
    }
    res.json(await model.obtenerActivos());
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener tipos de dato antropométrico' });
  }
};

const obtenerPorId = async (req, res) => {
  try {
    const tipo = await model.obtenerPorId(parseInt(req.params.id));
    if (!tipo) return res.status(404).json({ error: 'Tipo de dato no encontrado' });
    res.json(tipo);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener tipo de dato' });
  }
};

const crear = async (req, res) => {
  try {
    const tipo = await model.crear(req.body, req.user.id);
    await registrarAuditoria({
      id_usuario: req.user.id,
      nombre_entidad: 'tbl_tipos_dato_antropometrico',
      id_entidad: tipo.id,
      tipo_accion: 'crear',
      datos_nuevos: { nombre: tipo.nombre, tipo_valor: tipo.tipo_valor, unidad: tipo.unidad },
    });
    res.status(201).json(tipo);
  } catch (error) {
    if (error.message === 'NOMBRE_REQUERIDO') {
      return res.status(400).json({ error: 'El nombre es obligatorio' });
    }
    if (error.message === 'TIPO_VALOR_INVALIDO') {
      return res.status(400).json({ error: error.detalle || 'Tipo de valor inválido' });
    }
    if (error.message === 'NOMBRE_DUPLICADO') {
      return res.status(409).json({ error: 'Ya existe un tipo con ese nombre' });
    }
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al crear tipo de dato' });
  }
};

const actualizar = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existente = await model.obtenerPorId(id);
    if (!existente) return res.status(404).json({ error: 'Tipo de dato no encontrado' });
    const tipo = await model.actualizar(id, req.body, req.user.id);
    await registrarAuditoria({
      id_usuario: req.user.id,
      nombre_entidad: 'tbl_tipos_dato_antropometrico',
      id_entidad: id,
      tipo_accion: 'actualizar',
      datos_anteriores: { nombre: existente.nombre, tipo_valor: existente.tipo_valor, unidad: existente.unidad },
      datos_nuevos: { nombre: tipo.nombre, tipo_valor: tipo.tipo_valor, unidad: tipo.unidad },
    });
    res.json(tipo);
  } catch (error) {
    if (error.message === 'NOMBRE_REQUERIDO') {
      return res.status(400).json({ error: 'El nombre es obligatorio' });
    }
    if (error.message === 'TIPO_VALOR_INVALIDO') {
      return res.status(400).json({ error: error.detalle || 'Tipo de valor inválido' });
    }
    if (error.message === 'NOMBRE_DUPLICADO') {
      return res.status(409).json({ error: 'Ya existe un tipo con ese nombre' });
    }
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al actualizar tipo de dato' });
  }
};

const inactivar = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existente = await model.obtenerPorId(id);
    if (!existente) return res.status(404).json({ error: 'Tipo de dato no encontrado' });
    await model.inactivar(id, req.user.id);
    await registrarAuditoria({
      id_usuario: req.user.id,
      nombre_entidad: 'tbl_tipos_dato_antropometrico',
      id_entidad: id,
      tipo_accion: 'inactivar',
    });
    res.json({ mensaje: 'Tipo de dato inactivado correctamente' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al inactivar tipo de dato' });
  }
};

const activar = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existente = await model.obtenerPorId(id);
    if (!existente) return res.status(404).json({ error: 'Tipo de dato no encontrado' });
    await model.activar(id, req.user.id);
    await registrarAuditoria({
      id_usuario: req.user.id,
      nombre_entidad: 'tbl_tipos_dato_antropometrico',
      id_entidad: id,
      tipo_accion: 'activar',
    });
    res.json({ mensaje: 'Tipo de dato activado correctamente' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al activar tipo de dato' });
  }
};

module.exports = { obtenerTodos, obtenerPorId, crear, actualizar, inactivar, activar };
