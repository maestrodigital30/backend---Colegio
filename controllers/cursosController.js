const model = require('../models/cursosModel');
const { registrarAuditoria } = require('../models/auditoriaModel');
const { ROLES } = require('../utils/constants');

const obtenerTodos = async (req, res) => {
  try {
    const filtros = {};
    if (req.user.rol === ROLES.DOCENTE && req.user.id_perfil_docente) {
      filtros.id_docente = req.user.id_perfil_docente;
    }
    if (req.query.id_periodo_escolar) filtros.id_periodo_escolar = parseInt(req.query.id_periodo_escolar);
    if (req.query.id_docente && req.user.rol !== ROLES.DOCENTE) filtros.id_docente = parseInt(req.query.id_docente);
    res.json(await model.obtenerTodos(filtros));
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener cursos' });
  }
};

const obtenerPorId = async (req, res) => {
  try {
    const curso = await model.obtenerPorId(parseInt(req.params.id));
    if (!curso) return res.status(404).json({ error: 'Curso no encontrado' });
    if (req.user.rol === ROLES.DOCENTE && curso.id_docente !== req.user.id_perfil_docente) {
      return res.status(403).json({ error: 'No tiene acceso a este curso' });
    }
    res.json(curso);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener curso' });
  }
};

const crear = async (req, res) => {
  try {
    const { nombre, id_periodo_escolar } = req.body;
    if (!nombre || !id_periodo_escolar) {
      return res.status(400).json({ error: 'Campos obligatorios: nombre, id_periodo_escolar' });
    }

    const datos = { ...req.body };
    if (req.user.rol === ROLES.DOCENTE) {
      datos.id_docente = req.user.id_perfil_docente;
    }
    if (!datos.id_docente) {
      return res.status(400).json({ error: 'id_docente es obligatorio' });
    }

    const curso = await model.crear(datos, req.user.id);
    await registrarAuditoria({
      id_usuario: req.user.id, nombre_entidad: 'tbl_cursos', id_entidad: curso.id,
      tipo_accion: 'crear', datos_nuevos: datos,
    });
    res.status(201).json(curso);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al crear curso' });
  }
};

const actualizar = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const cursoExistente = await model.obtenerPorId(id);
    if (!cursoExistente) return res.status(404).json({ error: 'Curso no encontrado' });
    if (req.user.rol === ROLES.DOCENTE && cursoExistente.id_docente !== req.user.id_perfil_docente) {
      return res.status(403).json({ error: 'No tiene acceso a este curso' });
    }
    const datos = { ...req.body };
    if (req.user.rol === ROLES.DOCENTE) {
      datos.id_docente = req.user.id_perfil_docente;
    }
    const curso = await model.actualizar(id, datos, req.user.id);
    await registrarAuditoria({
      id_usuario: req.user.id, nombre_entidad: 'tbl_cursos', id_entidad: id,
      tipo_accion: 'actualizar', datos_nuevos: datos,
    });
    res.json(curso);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al actualizar curso' });
  }
};

const inactivar = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const cursoExistente = await model.obtenerPorId(id);
    if (!cursoExistente) return res.status(404).json({ error: 'Curso no encontrado' });
    if (req.user.rol === ROLES.DOCENTE && cursoExistente.id_docente !== req.user.id_perfil_docente) {
      return res.status(403).json({ error: 'No tiene acceso a este curso' });
    }
    await model.inactivar(id, req.user.id);
    await registrarAuditoria({
      id_usuario: req.user.id, nombre_entidad: 'tbl_cursos', id_entidad: id, tipo_accion: 'inactivar',
    });
    res.json({ mensaje: 'Curso inactivado correctamente' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al inactivar curso' });
  }
};

const activar = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const cursoExistente = await model.obtenerPorId(id);
    if (!cursoExistente) return res.status(404).json({ error: 'Curso no encontrado' });
    if (req.user.rol === ROLES.DOCENTE && cursoExistente.id_docente !== req.user.id_perfil_docente) {
      return res.status(403).json({ error: 'No tiene acceso a este curso' });
    }
    await model.activar(id, req.user.id);
    await registrarAuditoria({
      id_usuario: req.user.id, nombre_entidad: 'tbl_cursos', id_entidad: id, tipo_accion: 'activar',
    });
    res.json({ mensaje: 'Curso activado correctamente' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al activar curso' });
  }
};

module.exports = { obtenerTodos, obtenerPorId, crear, actualizar, inactivar, activar };
